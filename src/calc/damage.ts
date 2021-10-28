import { Servant, ServantClass, ServantAttribute, CardType, Buff, BuffType, PowerMod, NoblePhantasm, distinct, reflection } from "./servant";
import { Enemy, EnemyClass, EnemyAttribute, Trait } from "./enemy";
import { ScaledInt, s, f, transformScaledInt } from "./arithmetic";
import { Transform, Type } from "class-transformer";
import update from "immutability-helper";

class BuffSet {
    public constructor(
        attackUp: ScaledInt, //includes def down
        cardUp: ScaledInt, //includes resistance down
        npUp: ScaledInt,
        npBoost: ScaledInt,
        npGain: ScaledInt,
        powerMods: PowerMod[],
        readonly overcharge: number,
        readonly flatDamage: number,
        readonly applyTraits: Trait[]) {
            this.attackUp = attackUp;
            this.cardUp = cardUp;
            this.npUp = npUp;
            this.npBoost = npBoost;
            this.npGain = npGain;
            this.powerMods = powerMods;
        }

        @Type(() => ScaledInt)
        @Transform(transformScaledInt)
        readonly attackUp: ScaledInt;
        @Type(() => ScaledInt)
        @Transform(transformScaledInt)
        readonly cardUp: ScaledInt;
        @Type(() => ScaledInt)
        @Transform(transformScaledInt)
        readonly npUp: ScaledInt;
        @Type(() => ScaledInt)
        @Transform(transformScaledInt)
        readonly npBoost: ScaledInt;
        @Type(() => ScaledInt)
        @Transform(transformScaledInt)
        readonly npGain: ScaledInt;
        @Type(() => PowerMod)
        readonly powerMods: PowerMod[];

    public static empty(): BuffSet {
        const blankMod = new PowerMod([Trait.Always], s(0));
        return new BuffSet(s(0), s(0), s(0), s(0), s(0), [ blankMod, blankMod, blankMod ], 0, 0, []);
    }

    public static combine(buffs: BuffSet[], appendMod?: PowerMod): BuffSet {
        return new BuffSet (
            buffs.map(buff => buff.attackUp).reduce((a, b) => a.plus(b)),
            buffs.map(buff => buff.cardUp).reduce((a, b) => a.plus(b)),
            buffs.map(buff => buff.npUp).reduce((a, b) => a.plus(b)),
            ScaledInt.max(...buffs.map(buff => buff.npBoost)),
            buffs.map(buff => buff.npGain).reduce((a, b) => a.plus(b)),
            buffs.flatMap(buff => buff.powerMods).concat(appendMod ?? []),
            buffs.map(buff => buff.overcharge).reduce((a, b) => a + b),
            buffs.map(buff => buff.flatDamage).reduce((a, b) => a + b),
            buffs.flatMap(buff => buff.applyTraits ?? [])
        );
    }

    /**
     * Combines power mods to make sure there aren't any in the model which aren't rendered.
     * This will trim off some power mods unless we eventually allow an arbitrary number of power mods in the UI.
     */
    normalize(maxPowerMods: number): BuffSet {
        const filtered = this.powerMods.filter(mod => mod.modifier.value() > 0 && mod.trigger.length > 0);
        const deduplicated = mapReduce(filtered,
            m => m.trigger,
            (trig1, trig2) => trig1.length == trig2.length && !trig1.some(trig => !trig2.includes(trig)),
            (mods, triggers) => new PowerMod(triggers, mods.reduce((a, b) => a.plus(b.modifier), s(0))));
        const blankMod = new PowerMod([Trait.Always], s(0));
        const normalizedMods = deduplicated.concat(new Array(maxPowerMods).fill(blankMod)).slice(0, maxPowerMods);
        return update(this as BuffSet, { powerMods: { $set: normalizedMods } });
    }

    public static fromBuffs(buffs: Buff[], npCard: CardType): BuffSet {
        const powerMod = new PowerMod([Trait.Always], s(0));
        return new BuffSet(
            buffs.filter(b => b.type == BuffType.AttackUp).reduce((v, b) => v.plus(s(b.val)), s(0)),
            buffs.filter(b => b.type == BuffType.CardTypeUp && b.cardType == npCard).reduce((v, b) => v.plus(s(b.val)), s(0)),
            buffs.filter(b => b.type == BuffType.NpDmgUp).reduce((v, b) => v.plus(s(b.val)), s(0)),
            s(Math.max(0, ...buffs.filter(b => b.type == BuffType.NpBoost).map(b => b.val))),
            buffs.filter(b => b.type == BuffType.NpGain).reduce((v, b) => v.plus(s(b.val)), s(0)),
            buffs.filter(b => b.type == BuffType.PowerMod).map(b => new PowerMod(b.trig!, s(b.val))).concat([ powerMod, powerMod, powerMod ]),
            buffs.filter(b => b.type == BuffType.Overcharge).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.DamagePlus).reduce((v, b) => v + b.val, 0),
            distinct(buffs.filter(b => b.type == BuffType.AddTrait).flatMap(b => b.trig!))
        );
    }

    public getPowerMod(enemy: Enemy) {
        return this.powerMods
            .filter(pm => isTriggerActive(enemy.traits.concat(this.applyTraits), pm.trigger))
            .map(pm => pm.modifier)
            .reduce((a, b) => a.plus(b));
    }

    public getAdjustedNpUp() {
        //there is no documentation yet on exactly how Oberon's "NP Boost" arithmetic works so this is just a guess
        return this.npUp.times(this.npBoost.asMultiplier());
    }
}

export function mapReduce<TArray, TKey, TOut>(
    items: TArray[],
    getKey: (item: TArray) => TKey,
    areKeysEqual: (key1: TKey, key2: TKey) => boolean,
    map: (items: TArray[], key: TKey) => TOut
): TOut[] {
    const mapped = [] as { key: TKey, items: TArray[] }[];
    items.forEach(item => {
        const key = getKey(item);
        const match = mapped.find(m => areKeysEqual(m.key, key));
        if (match) {
            match.items.push(item);
        } else {
            mapped.push({ key: key, items: [item] })
        }
    });
    return mapped.map(m => map(m.items, m.key));
}

export class Range<T> {
    constructor(
        readonly low: T,
        readonly average: T,
        readonly high: T
    ) {}

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
        readonly refunded: ScaledInt,
        readonly hpAfterHit: number[],
        readonly overkillDifferential: ScaledInt
    ) {}

    getOverkillHitCount(): number {
        return this.hpAfterHit.filter(hp => hp < 0).length;
    }

    getNonOverkillHitCount(): number {
        return this.hpAfterHit.filter(hp => hp >= 0).length;
    }

    getFacecardThresholds(): { fcDamage: number, extraRefund: ScaledInt }[] {
        return this.hpAfterHit
            .filter(hp => hp >= 0)
            .map(reflection)
            .map((hp, i) => ({ fcDamage: hp + 1, extraRefund: this.overkillDifferential.times(i + 1) }));
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
        let oc = Math.floor(combinedBuffs.overcharge);
        oc = Math.max(oc, 0);
        oc = Math.min(oc, 4);
        const npMultiplier = servant.getNpMultiplier(np, oc);
        //skip damage plus for non-damaging NPs
        if (npMultiplier == 0) return new Range(0, 0, 0);
        const enemyTraits = enemy.traits.concat(combinedBuffs.applyTraits);
        const extraDamage = np.extraDmgStacks ?
            1 + matchTraits(enemyTraits, np.extraTrigger).length * np.extraDamage[oc] :
            //eresh is the only servant to get a supereffective modifier on NP upgrade I think? so hardcoding this is the simplest fix for now
            //eventually it may be worth properly modeling NP upgrades since that fixes both this and autofilled buffs
            //more likely: her upgrade is released in NA and we can just remove this since the workaround is "just do the strengthening quest lol"
            isTriggerActive(enemyTraits, np.extraTrigger) && (servant.data.name != "Ereshkigal" || servant.config.isNpUpgraded) ? np.extraDamage[oc] : 1.0;

        const preRandom = f(servant.getAttackStat() + ce.attackStat)
            .times(npMultiplier)
            .times(combinedBuffs.cardUp.asMultiplier().times(getCardMultiplier(np.cardType)))
            .times(getClassMultiplier(servant.data.sClass))
            .times(getClassTriangleMultiplier(servant.data.sClass, enemy.eClass, servant))
            .times(getAttributeTriangleMultiplier(servant.data.attribute, enemy.attribute));
        const range = [ .9, 1, 1.099 ].map(rand => preRandom
            .times(rand)
            .times(.23)
            .times(combinedBuffs.attackUp.asMultiplier())
            .times(combinedBuffs.getPowerMod(enemy).plus(combinedBuffs.getAdjustedNpUp()).asMultiplier())
            .times(extraDamage)
            .plus(combinedBuffs.flatDamage)
            .floor()) as [number, number, number];
        return new Range(...range);
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
        const diff = singleRefund.withOK.minus(singleRefund.noOK);
        const hpAfterHit = np.hitDistribution
            //no documentation of rounding on hit distribution
            //so I'm guessing this just floors each hit and puts the remainder on the last hit since that's what my coworkers would do
            //(it also happens to be the most pessimistic assumption)
            .map(hit => f(hit).times(damage).floor())
            .reduce((cumulative, hit) => cumulative.concat([cumulative[cumulative.length - 1] - hit]), [enemy.hitPoints])
            .slice(1, np.hitDistribution.length)
            .concat(enemy.hitPoints - damage);
        const refunded = singleRefund.noOK.times(hpAfterHit.length)
            .plus(diff.times(hpAfterHit.filter(hp => hp < 0).length));
        return new RefundResult(refunded, hpAfterHit, diff);
    }

    private calculateSingleHitRefund(np: NoblePhantasm, buffs: BuffSet, enemy: Enemy): { noOK: ScaledInt, withOK: ScaledInt } {
        //no info on the format of the server mod but it's probably an int like everything else
        const serverMod = s((npGainByEnemyClass.get(enemy.eClass) ?? 1) * (enemy.specialNpGainMod ? 1.2 : 1));
        const baseGain = buffs.cardUp.asMultiplier()
            .times(npGainByCard.get(np.cardType)!)
            .times(Math.round(np.refundRate * 100))
            .times(serverMod.value())
            .times(buffs.npGain.asMultiplier());
        const noOK = baseGain.floor();
        //refundRate is scaled differently than almost everything else for some reason (100 times the percentage value instead of 10 times)
        //may be more appropriate to just return a regular number divided by 100
        return { withOK: new ScaledInt(f(noOK).times(1.5).floor() * 10), noOK: new ScaledInt(noOK * 10) };
    }
}

function getCardMultiplier(cardType:CardType): number {
    switch (cardType) {
        case CardType.Buster: return 1.5;
        case CardType.Arts: return 1;
        case CardType.Quick: return 0.8;
        case CardType.Extra: return 1;
    }
}

function getClassMultiplier(servantClass: ServantClass): number {
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
const npGainByEnemyClass: Map<EnemyClass, number> = new Map([
    [ EnemyClass.Caster, 1.2 ],
    [ EnemyClass.MoonCancer, 1.2 ],
    [ EnemyClass.Rider, 1.1 ],
    [ EnemyClass.Assassin, 0.9 ],
    [ EnemyClass.Berserker, 0.8],
    //TODO: not sure what typical Pretender rate is
]);

export { BuffSet, Calculator, CraftEssence, getLikelyClassMatchup };