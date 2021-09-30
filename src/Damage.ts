import { Servant, ServantClass, ServantAttribute, CardType, Buff, BuffType, ServantData } from "./Servant";
import { Enemy, EnemyClass, EnemyAttribute, Trait } from "./Enemy";

class PowerMod {
    constructor(
        readonly trigger: Trait,
        readonly modifier: number) {}
}

class BuffSet {
    constructor(
        readonly attackUp: number, //includes def down
        readonly cardUp: number, //includes resistance down
        readonly npUp: number,
        readonly npBoost: number,
        readonly powerMods: PowerMod[],
        readonly overcharge: number) {}

    static empty(): BuffSet {
        let powerMod = new PowerMod(Trait.Always, 0);
        const emptySingleton = new BuffSet(0, 0, 0, 0, [ powerMod, powerMod, powerMod ], 0);
        return emptySingleton;
    }

    static combine(buffs: BuffSet[], appendMod: PowerMod): BuffSet {
        return new BuffSet (
            buffs.map(buff => buff.attackUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.cardUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.npUp).reduce((a, b) => a + b),
            Math.max(...buffs.map(buff => buff.npBoost)),
            buffs.flatMap(buff => buff.powerMods).concat(appendMod),
            buffs.map(buff => buff.overcharge).reduce((a, b) => a + b)
        );
    }

    static fromBuffs(buffs: Buff[], npCard: CardType): BuffSet {
        let powerMod = new PowerMod(Trait.Always, 0);
        return new BuffSet(
            buffs.filter(b => b.type == BuffType.AttackUp).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.CardTypeUp && b.cardType == npCard).reduce((v, b) => v + b.val, 0),
            buffs.filter(b => b.type == BuffType.NpDmgUp).reduce((v, b) => v + b.val, 0),
            Math.max(0, ...buffs.filter(b => b.type == BuffType.NpBoost).map(b => b.val)),
            //TODO: just make a groupBy method, geez
            Array.from(buffs.filter(b => b.type == BuffType.PowerMod)
                .reduce((map, buff) => {
                    if (!map.has(buff.trig as Trait))
                        map.set(buff.trig as Trait, buff.val);
                    else
                        map.set(buff.trig as Trait, buff.val + (map.get(buff.trig as Trait) as number));
                    return map;
                }, new Map<Trait, number>())
                .entries()).map(entry => new PowerMod(entry[0], entry[1])).concat([ powerMod, powerMod, powerMod ]),
                buffs.filter(b => b.type == BuffType.Overcharge).reduce((v, b) => v + b.val, 0)
        );
    }

    getMultiplier(enemy: Enemy) {
        let powerMod = this.powerMods.filter(pm => isTriggerActive(enemy, pm.trigger)).map(pm => pm.modifier).reduce((a, b) => a + b);
        let modAndNp = powerMod + this.npUp * (1 + this.npBoost);
        return (1 + this.attackUp) * (1 + this.cardUp) * (1 + modAndNp);
    }
}

class Damage {
    readonly low: number;
    readonly average: number;
    readonly high: number;

    constructor(average: number) {
        this.average = Math.round(average);
        this.low = Math.round(average * 0.9);
        this.high = Math.round(average * 1.1); 
    }
}

class Calculator {
    calculateNpDamage(servant: Servant, ce: CraftEssence, enemy: Enemy, buffs: BuffSet[], npCard: CardType): Damage {
        let np = servant.data.getNP(buffs.reduce((type, buff) => npCard ?? type, undefined as CardType | undefined));
        let combinedBuffs = BuffSet.combine(buffs.concat([ BuffSet.fromBuffs(ce.buffs, np.cardType) ]), servant.config.appendMod);
        let baseDamage = (servant.getAttackStat() + ce.attackStat) * servant.getNpMultiplier(np, combinedBuffs.overcharge) * this.getCardMultiplier(np.cardType) * this.getClassMultiplier(servant.data.sClass) * 0.23;
        let triangleDamage = getClassTriangleMultiplier(servant.data.sClass, enemy.eClass) * getAttributeTriangleMultiplier(servant.data.attribute, enemy.attribute);
        let extraDamage = isTriggerActive(enemy, np.extraTrigger) ? np.extraDamage[combinedBuffs.overcharge] : 1.0;
        return new Damage(baseDamage * combinedBuffs.getMultiplier(enemy) * triangleDamage * extraDamage);
    }

    getCardMultiplier(cardType:CardType): number {
        switch (cardType) {
            case CardType.Buster: return 1.5;
            case CardType.Arts: return 1;
            case CardType.Quick: return 0.8;
            case CardType.Extra: return 1;//TODO
        }
    }

    getClassMultiplier(servantClass: ServantClass): number {
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
                return 1.0;
        }
    }
}

function isTriggerActive(enemy: Enemy, trigger: Trait): boolean {
    return trigger == Trait.Always || enemy.traits.some(trait => trait == trigger);
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

let attributeTriangleAdvantages: Map<ServantAttribute, ServantAttribute> = new Map([
    [ServantAttribute.Man, ServantAttribute.Sky],
    [ServantAttribute.Earth, ServantAttribute.Man],
    [ServantAttribute.Sky, ServantAttribute.Earth],
    [ServantAttribute.Star, ServantAttribute.Beast],
    [ServantAttribute.Beast, ServantAttribute.Star],
]);

function isAdvantaged<T>(attacker: T, defender: T, advantages: Map<T, T>): boolean {
    return advantages.get(attacker) == defender;
}

function getClassTriangleMultiplier(servantClass: ServantClass, enemyClass: EnemyClass): number {
    if (servantClass == ServantClass.Shielder || enemyClass == EnemyClass.Shielder) return 1.0;
    if (servantClass == ServantClass.Berserker) return enemyClass == EnemyClass.Foreigner ? 0.5 : 1.5;
    if (enemyClass == EnemyClass.Berserker) return 2.0;
    if (enemyClass == EnemyClass.Neutral) return 1.0;
    if (enemyClass == EnemyClass.Ruler && !isExtra(servantClass)) return 0.5;
    if (servantClass == ServantClass.AlterEgo && isCavalry(enemyClass)) return 1.5;
    if (servantClass == ServantClass.Pretender && isKnight(enemyClass)) return 1.5;
    if (enemyClass == EnemyClass.Knight || enemyClass == EnemyClass.Cavalry) return 1.0;
    let castEnemyClass = (enemyClass as string) as ServantClass;
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
            return true;
        default:
            return false;
    }
}

let classTriangleAdvantages: Map<ServantClass, ServantClass> = new Map([
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

export { PowerMod, BuffSet, Calculator, Damage, CraftEssence, getLikelyClassMatchup };