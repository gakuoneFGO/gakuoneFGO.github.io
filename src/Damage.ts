import { Servant, ServantClass, ServantAttribute, CardType, Buff, BuffType, PowerMod, NoblePhantasm } from "./Servant";
import { Enemy, EnemyClass, EnemyAttribute, Trait } from "./Enemy";

class BuffSet {
    public constructor(
        readonly attackUp: number, //includes def down
        readonly cardUp: number, //includes resistance down
        readonly npUp: number,
        readonly npBoost: number,
        readonly npGain: number,
        readonly powerMods: PowerMod[],
        readonly overcharge: number,
        readonly flatDamage: number,
        readonly applyTraits: Trait[]) {}

    public static empty(): BuffSet {
        const powerMod = new PowerMod([Trait.Always], 0);
        return new BuffSet(0, 0, 0, 0, 0, [ powerMod, powerMod, powerMod ], 0, 0, []);
    }

    public static combine(buffs: BuffSet[], appendMod: PowerMod): BuffSet {
        return new BuffSet (
            buffs.map(buff => buff.attackUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.cardUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.npUp).reduce((a, b) => a + b),
            Math.max(...buffs.map(buff => buff.npBoost)),
            buffs.map(buff => buff.npGain).reduce((a, b) => a + b),
            buffs.flatMap(buff => buff.powerMods).concat(appendMod),
            buffs.map(buff => buff.overcharge).reduce((a, b) => a + b),
            buffs.map(buff => buff.flatDamage).reduce((a, b) => a + b),
            buffs.flatMap(buff => buff.applyTraits)
        );
    }

    public static fromBuffs(buffs: Buff[], npCard: CardType): BuffSet {
        const powerMod = new PowerMod([Trait.Always], 0);
        return new BuffSet(
            buffs.filter(b => b.type == BuffType.AttackUp).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.CardTypeUp && b.cardType == npCard).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.NpDmgUp).reduce((v, b) => v + b.val, 0),
            Math.max(0, ...buffs.filter(b => b.type == BuffType.NpBoost).map(b => b.val)),
            buffs.filter(b => b.type == BuffType.NpGain).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.PowerMod).map(b => new PowerMod(b.trig!, b.val)).concat([ powerMod, powerMod, powerMod ]),
            buffs.filter(b => b.type == BuffType.Overcharge).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.DamagePlus).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.AddTrait).flatMap(b => b.trig!)
        );
    }

    public getMultiplier(enemy: Enemy) {
        const powerMod = this.powerMods.filter(pm => isTriggerActive(enemy.traits.concat(this.applyTraits), pm.trigger)).map(pm => pm.modifier).reduce((a, b) => a + b);
        const modAndNp = powerMod + this.npUp * (1 + this.npBoost);
        return (1 + this.attackUp) * (1 + this.cardUp) * (1 + modAndNp);
    }
}

export class Range<T> {
    constructor(
        readonly low: T,
        readonly average: T,
        readonly high: T
    ) {}

    public static ofDamage(average: number, flatDamage: number): Range<number> {
        return new Range(
            average * 0.9 + flatDamage,
            average + flatDamage,
            average * 1.1 + flatDamage
        );
    }

    public static sum<T, S>(ranges: Range<T>[], add: (a: S, b: T) => S, initialVal: S): Range<S> {
        return new Range(
            ranges.reduce((val, range) => add(val, range.low), initialVal),
            ranges.reduce((val, range) => add(val, range.average), initialVal),
            ranges.reduce((val, range) => add(val, range.high), initialVal)
        );
    }
}

export class NpResult {
    constructor(
        readonly damage: Range<number>,
        readonly refund: Range<RefundResult>
    ) {}
}

export class RefundResult {
    constructor(
        readonly refunded: number,
        readonly hpOnHit: number[],
        readonly overkillDifferential: number
    ) {}

    getOverkillHitCount(): number {
        return this.hpOnHit.filter(hp => hp <= 0).length;
    }

    getNonOverkillHitCount(): number {
        return this.hpOnHit.filter(hp => hp > 0).length;
    }

    getFacecardThresholds(): { fcDamage: number, extraRefund: number }[] {
        return this.hpOnHit
            .filter(hp => hp > 0)
            .slice(1)
            .reverse()
            .map((hp, i) => ({ fcDamage: hp, extraRefund: (i + 1) * this.overkillDifferential }));
    }
};

class Calculator {
    public calculateNp(servant: Servant, ce: CraftEssence, enemy: Enemy, buffs: BuffSet[], npCard: CardType): NpResult {
        const
            np = servant.data.getNP(npCard),
            combinedBuffs = BuffSet.combine(buffs.concat([ BuffSet.fromBuffs(ce.buffs, np.cardType) ]), servant.getAppendMod()),
            damage = this.calculateNpDamage(servant, np, ce, enemy, combinedBuffs),
            refund = this.calculateNpRefund(np, combinedBuffs, enemy, damage);
        return new NpResult(damage, refund);
    }

    private calculateNpDamage(servant: Servant, np: NoblePhantasm, ce: CraftEssence, enemy: Enemy, combinedBuffs: BuffSet): Range<number> {
        const
            oc = Math.floor(combinedBuffs.overcharge),
            baseDamage = (servant.getAttackStat() + ce.attackStat) * servant.getNpMultiplier(np, oc) * this.getCardMultiplier(np.cardType) * this.getClassMultiplier(servant.data.sClass) * 0.23;
        //skip damage plus for non-damaging NPs
        if (baseDamage == 0) return Range.ofDamage(0, 0);
        const
            enemyTraits = enemy.traits.concat(combinedBuffs.applyTraits),
            triangleDamage = getClassTriangleMultiplier(servant.data.sClass, enemy.eClass, servant) * getAttributeTriangleMultiplier(servant.data.attribute, enemy.attribute),
            extraDamage = np.extraDmgStacks ?
                1 + matchTraits(enemyTraits, np.extraTrigger).length * np.extraDamage[oc] :
                //eresh is the only servant to get a supereffective modifier on NP upgrade I think? so hardcoding this is the simplest fix for now
                //eventually it may be worth properly modeling NP upgrades since that fixes both this and autofilled buffs
                //more likely: her upgrade is released in NA and we can just remove this since the workaround is "just do the strengthening quest lol"
                isTriggerActive(enemyTraits, np.extraTrigger) && (servant.data.name != "Ereshkigal" || servant.config.isNpUpgraded) ? np.extraDamage[oc] : 1.0;
        return Range.ofDamage(baseDamage * combinedBuffs.getMultiplier(enemy) * triangleDamage * extraDamage, combinedBuffs.flatDamage);
    }

    private getCardMultiplier(cardType:CardType): number {
        switch (cardType) {
            case CardType.Buster: return 1.5;
            case CardType.Arts: return 1;
            case CardType.Quick: return 0.8;
            case CardType.Extra: return 1;
        }
    }

    private getClassMultiplier(servantClass: ServantClass): number {
        switch (servantClass) {
            case ServantClass.Berserker:
            case ServantClass.Ruler:
            case ServantClass.Avenger:
                return 1.1;
            case ServantClass.Lancer:
                return 1.05;
            case ServantClass.Archer:
                return 0.95;
            case ServantClass.Caster:
            case ServantClass.Assassin:
                return 0.9;
            default:
                return 1;
        }
    }

    private calculateNpRefund(np: NoblePhantasm, buffs: BuffSet, enemy: Enemy, damage: Range<number>): Range<RefundResult> {
        return new Range(
            this.calculateNpRefundScenario(np, buffs, enemy, damage.low),
            this.calculateNpRefundScenario(np, buffs, enemy, damage.average),
            this.calculateNpRefundScenario(np, buffs, enemy, damage.high)
        );
    }

    private calculateNpRefundScenario(np: NoblePhantasm, buffs: BuffSet, enemy: Enemy, damage: number): RefundResult {
        const singleRefund = this.calculateSingleHitRefund(np, buffs, enemy);
        const diff = singleRefund.withOK - singleRefund.noOK;
        const hpOnHit = np.hitDistribution
            .map(hit => hit * damage)
            .reduce((cumulative, hit) => cumulative.concat([cumulative[cumulative.length - 1] - hit]), [enemy.hitPoints])
            .slice(0, np.hitDistribution.length);
        const refunded = hpOnHit.length * singleRefund.noOK + hpOnHit.filter(hp => hp <= 0).length * diff;
        return new RefundResult(refunded, hpOnHit, diff);
    }

    private calculateSingleHitRefund(np: NoblePhantasm, buffs: BuffSet, enemy: Enemy): { noOK: number, withOK: number } {
        const baseGain =
            np.refundRate *
            npGainByCard.get(np.cardType)! *
            (1 + buffs.cardUp) *
            (npGainByEnemyClass.get(enemy.eClass as string as ServantClass) ?? 1) *
            (enemy.specialNpGainMod ? 1.2 : 1) *
            (1 + buffs.npGain);
        return { withOK: roundDown(roundDown(baseGain) * 1.5), noOK: roundDown(baseGain) };
    }
}

function roundDown(val: number): number {
    return Math.floor(val * 10) / 10;
}

function isTriggerActive(traits: Trait[], trigger: Trait[]): boolean {
    return trigger.includes(Trait.Always) || matchTraits(traits, trigger).length > 0;
}

function matchTraits(traits: Trait[], trigger: Trait[]): Trait[] {
    return traits.filter(trait => trigger.includes(trait));
}

class CraftEssence {
    constructor(
        readonly name: string,
        readonly attackStat: number,
        readonly buffs: Buff[]) {}
}

function getAttributeTriangleMultiplier(servantAttribute: ServantAttribute, enemyAttribute: EnemyAttribute): number {
    if (enemyAttribute == EnemyAttribute.Neutral) return 1.0;
    let castEnemyAttribute = (enemyAttribute as string) as ServantAttribute;
    if (isAdvantaged(servantAttribute, castEnemyAttribute, attributeTriangleAdvantages)) return 1.1;
    if (isAdvantaged(castEnemyAttribute, servantAttribute, attributeTriangleAdvantages)) return 0.9;
    return 1.0;
}

function getLikelyClassMatchup(servantClass: ServantClass): EnemyClass {
    switch(servantClass) {
        case ServantClass.Berserker:
            return EnemyClass.Neutral;
        case ServantClass.AlterEgo:
            return EnemyClass.Cavalry;
        case ServantClass.Pretender:
            return EnemyClass.Knight;
        default:
            return isExtra(servantClass) ? EnemyClass.Neutral : classTriangleAdvantages.get(servantClass) as string as EnemyClass;
    }
}

const attributeTriangleAdvantages: Map<ServantAttribute, ServantAttribute> = new Map([
    [ServantAttribute.Man, ServantAttribute.Sky],
    [ServantAttribute.Earth, ServantAttribute.Man],
    [ServantAttribute.Sky, ServantAttribute.Earth],
    [ServantAttribute.Star, ServantAttribute.Beast],
    [ServantAttribute.Beast, ServantAttribute.Star],
]);

function isAdvantaged<T>(attacker: T, defender: T, advantages: Map<T, T>): boolean {
    return advantages.get(attacker) == defender;
}

function getClassTriangleMultiplier(servantClass: ServantClass, enemyClass: EnemyClass, servant: Servant): number {
    const castEnemyClass = (enemyClass as string) as ServantClass;
    if (specialClassTriangleAdvantages.has(servant.data.name + "|" + castEnemyClass))
        return specialClassTriangleAdvantages.get(servant.data.name + "|" + castEnemyClass)!;
    if (servantClass == ServantClass.Shielder || enemyClass == EnemyClass.Shielder) return 1.0;
    if (servantClass == ServantClass.Berserker) return enemyClass == EnemyClass.Foreigner ? 0.5 : 1.5;
    if (enemyClass == EnemyClass.Berserker) return 2.0;
    if (enemyClass == EnemyClass.Neutral) return 1.0;
    if (enemyClass == EnemyClass.Ruler && !isExtra(servantClass)) return 0.5;
    if (servantClass == ServantClass.AlterEgo && isCavalry(enemyClass)) return 1.5;
    if (servantClass == ServantClass.Pretender && isKnight(enemyClass)) return 1.5;
    if (servantClass == ServantClass.AlterEgo && isKnight(enemyClass)) return 0.5;
    if (servantClass == ServantClass.Pretender && isCavalry(enemyClass)) return 0.5;
    if (enemyClass == EnemyClass.Knight || enemyClass == EnemyClass.Cavalry) return 1.0;
    if (isAdvantaged(servantClass, castEnemyClass, classTriangleAdvantages)) return 2.0;
    if (isAdvantaged(castEnemyClass, servantClass, classTriangleAdvantages)) return 0.5;
    return 1.0
}

function isExtra(servantClass: ServantClass): boolean {
    switch (servantClass) {
        case ServantClass.Saber:
        case ServantClass.Archer:
        case ServantClass.Lancer:
        case ServantClass.Rider:
        case ServantClass.Caster:
        case ServantClass.Assassin:
        case ServantClass.Berserker:
            return false;
        default:
            return true;
    }
}

function isCavalry(enemyClass: EnemyClass): boolean {
    switch (enemyClass) {
        case EnemyClass.Rider:
        case EnemyClass.Caster:
        case EnemyClass.Assassin:
        case EnemyClass.Berserker:
        case EnemyClass.Cavalry:
            return true;
        default:
            return false;
    }
}

function isKnight(enemyClass: EnemyClass): boolean {
    switch (enemyClass) {
        case EnemyClass.Saber:
        case EnemyClass.Archer:
        case EnemyClass.Lancer:
        case EnemyClass.Knight:
            return true;
        default:
            return false;
    }
}

const classTriangleAdvantages: Map<ServantClass, ServantClass> = new Map([
    [ServantClass.Saber, ServantClass.Lancer],
    [ServantClass.Archer, ServantClass.Saber],
    [ServantClass.Lancer, ServantClass.Archer],
    [ServantClass.Rider, ServantClass.Caster],
    [ServantClass.Caster, ServantClass.Assassin],
    [ServantClass.Assassin, ServantClass.Rider],
    [ServantClass.Ruler, ServantClass.MoonCancer],
    [ServantClass.Avenger, ServantClass.Ruler],
    [ServantClass.MoonCancer, ServantClass.Avenger],
    [ServantClass.AlterEgo, ServantClass.Foreigner],
    [ServantClass.Foreigner, ServantClass.Pretender],
    [ServantClass.Pretender, ServantClass.AlterEgo],
]);

const specialClassTriangleAdvantages: Map<string, number> = new Map([
    ["Sessyoin Kiara|" + ServantClass.Ruler, 1.5],
    ["Kama|" + ServantClass.AlterEgo, 2],
]);

const npGainByCard: Map<CardType, number> = new Map([
    [ CardType.Buster, 0 ],
    [ CardType.Arts, 3 ],
    [ CardType.Quick, 1 ],
    [ CardType.Extra, 1 ],
]);

//assume 1 if omitted
const npGainByEnemyClass: Map<ServantClass, number> = new Map([
    [ ServantClass.Caster, 1.2 ],
    [ ServantClass.MoonCancer, 1.2 ],
    [ ServantClass.Rider, 1.1 ],
    [ ServantClass.Assassin, 0.9 ],
    [ ServantClass.Berserker, 0.8 ],
    //TODO: not sure what typical Pretender rate is
]);

export { BuffSet, Calculator, CraftEssence, getLikelyClassMatchup };