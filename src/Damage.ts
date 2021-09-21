import { Servant, ServantClass, ServantAttribute, Trigger, CardType } from "./Servant";
import { Enemy, EnemyClass, EnemyAttribute } from "./Enemy";

class PowerMod {
    constructor(
        readonly trigger: Trigger,
        readonly modifier: number) {}
}

class BuffSet {
    constructor(
        readonly attackUp: number, //includes def down
        readonly effUp: number, //includes resistance down
        readonly npUp: number,
        readonly isDoubleNpUp: boolean,
        readonly powerMods: PowerMod[],
        readonly overcharge: number) {}

    static empty(): BuffSet {
        let powerMod = new PowerMod(Trigger.Always, 0.0);
        const emptySingleton = new BuffSet(0.0, 0.0, 0.0, false, [ powerMod, powerMod, powerMod ], 0);
        return emptySingleton;
    }

    static combine(buffs: BuffSet[], appendMod: PowerMod): BuffSet {
        return new BuffSet (
            buffs.map(buff => buff.attackUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.effUp).reduce((a, b) => a + b),
            buffs.map(buff => buff.npUp).reduce((a, b) => a + b),
            buffs.some(buff => buff.isDoubleNpUp),
            buffs.flatMap(buff => buff.powerMods).concat(appendMod),
            buffs.map(buff => buff.overcharge).reduce((a, b) => a + b),
        );
    }

    getMultiplier(enemy: Enemy) {
        let powerMod = this.powerMods.filter(pm => isTriggerActive(enemy, pm.trigger)).map(pm => pm.modifier).reduce((a, b) => a + b);
        let npUp = this.isDoubleNpUp ? 2 * this.npUp : this.npUp;
        return (1 + this.attackUp) * (1 + this.effUp) * (1 + powerMod + npUp);
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
    calculateNpDamage(servant: Servant, ce: CraftEssence, enemy: Enemy, buffs: BuffSet[]): Damage {
        let combinedBuffs = BuffSet.combine(buffs.concat([ ce.buffs ]), servant.config.appendMod);
        let baseDamage = (servant.getAttackStat() + ce.attackStat) * servant.getNpMultiplier(combinedBuffs.overcharge) * this.getCardMultiplier(servant.data.npType) * this.getClassMultiplier(servant.data.sClass) * 0.23;
        let triangleDamage = getClassTriangleMultiplier(servant.data.sClass, enemy.eClass) * getAttributeTriangleMultiplier(servant.data.attribute, enemy.attribute);
        let extraDamage = isTriggerActive(enemy, servant.data.extraTrigger) ? servant.data.extraDamage[combinedBuffs.overcharge] : 1.0;
        return new Damage(baseDamage * combinedBuffs.getMultiplier(enemy) * triangleDamage * extraDamage);
    }

    getCardMultiplier(cardType:CardType):number {
        switch (cardType) {
            case CardType.Buster: return 1.5;
            case CardType.Arts: return 0.75;
            case CardType.Quick: return 0.8;
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

function isTriggerActive(enemy: Enemy, trigger: Trigger): boolean {
    //TODO: oddball ones like tesla's
    let strTrigger = trigger as string;
    if (strTrigger.startsWith("class"))
        return strTrigger.endsWith(enemy.eClass.substring(1));
    if (strTrigger.startsWith("attribute"))
        return strTrigger.endsWith(enemy.attribute.substring(1));
    return trigger == Trigger.Always || enemy.traits.some(trait => (trait as string) == strTrigger);
}

class CraftEssence {
    constructor(
        readonly name: string,
        readonly attackStat: number,
        readonly buffs: BuffSet) {}
}


function getAttributeTriangleMultiplier(servantAttribute: ServantAttribute, enemyAttribute: EnemyAttribute): number {
    if (enemyAttribute == EnemyAttribute.Neutral) return 1.0;
    let castEnemyAttribute = (enemyAttribute as string) as ServantAttribute;
    if (isAdvantaged(servantAttribute, castEnemyAttribute, attributeTriangleAdvantages)) return 1.1;
    if (isAdvantaged(castEnemyAttribute, servantAttribute, attributeTriangleAdvantages)) return 0.9;
    return 1.0;
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
            return true;
    }
}

function isKnight(enemyClass: EnemyClass): boolean {
    switch (enemyClass) {
        case EnemyClass.Saber:
        case EnemyClass.Archer:
        case EnemyClass.Lancer:
            return true;
        default:
            return true;
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

export { PowerMod, BuffSet, Calculator, Damage, CraftEssence };