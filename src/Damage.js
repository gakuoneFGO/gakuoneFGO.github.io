import { ServantClass, ServantAttribute, Trigger, CardType } from "./Servant.js";
import { EnemyClass, EnemyAttribute } from "./Enemy.js";
class PowerMod {
    constructor(trigger, modifier) {
        this.trigger = trigger;
        this.modifier = modifier;
    }
}
class BuffSet {
    constructor(attackUp, //includes def down
    effUp, //includes resistance down
    npUp, isDoubleNpUp, powerMods, overcharge) {
        this.attackUp = attackUp;
        this.effUp = effUp;
        this.npUp = npUp;
        this.isDoubleNpUp = isDoubleNpUp;
        this.powerMods = powerMods;
        this.overcharge = overcharge;
    }
    static combine(buffs, appendMod) {
        return new BuffSet(buffs.map(buff => buff.attackUp).reduce((a, b) => a + b), buffs.map(buff => buff.effUp).reduce((a, b) => a + b), buffs.map(buff => buff.npUp).reduce((a, b) => a + b), buffs.some(buff => buff.isDoubleNpUp), buffs.flatMap(buff => buff.powerMods).concat(appendMod), buffs.map(buff => buff.overcharge).reduce((a, b) => a + b));
    }
    getMultiplier(enemy) {
        let powerMod = this.powerMods.filter(pm => isTriggerActive(enemy, pm.trigger)).map(pm => pm.modifier).reduce((a, b) => a + b);
        let npUp = this.isDoubleNpUp ? 2 * this.npUp : this.npUp;
        return (1 + this.attackUp) * (1 + this.effUp) * (1 + powerMod + npUp);
    }
}
class Damage {
    constructor(average) {
        this.average = Math.round(average);
        this.low = Math.round(average * 0.9);
        this.high = Math.round(average * 1.1);
    }
}
class Calculator {
    calculateNpDamage(servant, ce, enemy, buffs) {
        let combinedBuffs = BuffSet.combine(buffs.concat([ce.buffs]), servant.appendMod);
        let baseDamage = (servant.getAttackStat() + ce.attackStat) * servant.getNpMultiplier(combinedBuffs.overcharge) * this.getCardMultiplier(servant.data.npType) * this.getClassMultiplier(servant.data.sClass) * 0.23;
        let triangleDamage = getClassTriangleMultiplier(servant.data.sClass, enemy.eClass) * getAttributeTriangleMultiplier(servant.data.attribute, enemy.attribute);
        let extraDamage = isTriggerActive(enemy, servant.data.extraTrigger) ? servant.data.extraDamage[combinedBuffs.overcharge] : 1.0;
        return new Damage(baseDamage * combinedBuffs.getMultiplier(enemy) * triangleDamage * extraDamage);
    }
    getCardMultiplier(cardType) {
        switch (cardType) {
            case CardType.Buster: return 1.5;
            case CardType.Arts: return 0.75;
            case CardType.Quick: return 0.8;
        }
    }
    getClassMultiplier(servantClass) {
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
function isTriggerActive(enemy, trigger) {
    //TODO: oddball ones like tesla's
    return enemy.eClass == trigger ||
        enemy.attribute == trigger ||
        enemy.traits.some(trait => trait == trigger) ||
        trigger == Trigger.Always;
}
class CraftEssence {
    constructor(name, attackStat, buffs) {
        this.name = name;
        this.attackStat = attackStat;
        this.buffs = buffs;
    }
}
function getAttributeTriangleMultiplier(servantAttribute, enemyAttribute) {
    return attributeTriangle.get([servantAttribute, enemyAttribute]);
}
let attributeTriangle = new Map([
    [[ServantAttribute.Man, EnemyAttribute.Man], 1.0],
    [[ServantAttribute.Man, EnemyAttribute.Earth], 0.9],
    [[ServantAttribute.Man, EnemyAttribute.Sky], 1.1],
    [[ServantAttribute.Man, EnemyAttribute.Star], 1.0],
    [[ServantAttribute.Man, EnemyAttribute.Beast], 1.0],
    [[ServantAttribute.Man, EnemyAttribute.Neutral], 1.0],
    [[ServantAttribute.Earth, EnemyAttribute.Man], 1.1],
    [[ServantAttribute.Earth, EnemyAttribute.Earth], 1.0],
    [[ServantAttribute.Earth, EnemyAttribute.Sky], 0.9],
    [[ServantAttribute.Earth, EnemyAttribute.Star], 1.0],
    [[ServantAttribute.Earth, EnemyAttribute.Beast], 1.0],
    [[ServantAttribute.Earth, EnemyAttribute.Neutral], 1.0],
    [[ServantAttribute.Sky, EnemyAttribute.Man], 0.9],
    [[ServantAttribute.Sky, EnemyAttribute.Earth], 1.1],
    [[ServantAttribute.Sky, EnemyAttribute.Sky], 1.0],
    [[ServantAttribute.Sky, EnemyAttribute.Star], 1.0],
    [[ServantAttribute.Sky, EnemyAttribute.Beast], 1.0],
    [[ServantAttribute.Sky, EnemyAttribute.Neutral], 1.0],
    [[ServantAttribute.Star, EnemyAttribute.Man], 1.0],
    [[ServantAttribute.Star, EnemyAttribute.Earth], 1.0],
    [[ServantAttribute.Star, EnemyAttribute.Sky], 1.0],
    [[ServantAttribute.Star, EnemyAttribute.Star], 1.0],
    [[ServantAttribute.Star, EnemyAttribute.Beast], 1.1],
    [[ServantAttribute.Star, EnemyAttribute.Neutral], 1.0],
    [[ServantAttribute.Beast, EnemyAttribute.Man], 1.0],
    [[ServantAttribute.Beast, EnemyAttribute.Earth], 1.0],
    [[ServantAttribute.Beast, EnemyAttribute.Sky], 1.0],
    [[ServantAttribute.Beast, EnemyAttribute.Star], 1.1],
    [[ServantAttribute.Beast, EnemyAttribute.Beast], 1.0],
    [[ServantAttribute.Beast, EnemyAttribute.Neutral], 1.0],
]);
function getClassTriangleMultiplier(servantClass, enemyClass) {
    if (servantClass == ServantClass.Shielder || enemyClass == EnemyClass.Shielder)
        return 1.0;
    if (servantClass == ServantClass.Berserker)
        return enemyClass == EnemyClass.Foreigner ? 0.5 : 1.5;
    if (enemyClass == EnemyClass.Berserker)
        return 2.0;
    if (enemyClass == EnemyClass.Neutral)
        return 1.0;
    if (enemyClass == EnemyClass.Ruler && !isExtra(servantClass))
        return 0.5;
    if (servantClass == ServantClass.AlterEgo && isCavalry(enemyClass))
        return 1.5;
    if (servantClass == ServantClass.Pretender && isKnight(enemyClass))
        return 1.5;
    if (enemyClass == EnemyClass.Knight || enemyClass == EnemyClass.Cavalry)
        return 1.0;
    let castEnemyClass = enemyClass;
    if (classTriangleAdvantages.has([servantClass, castEnemyClass]))
        return 2.0;
    if (classTriangleAdvantages.has([castEnemyClass, servantClass]))
        return 0.5;
    return 1.0;
}
function isExtra(servantClass) {
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
function isCavalry(enemyClass) {
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
function isKnight(enemyClass) {
    switch (enemyClass) {
        case EnemyClass.Saber:
        case EnemyClass.Archer:
        case EnemyClass.Lancer:
            return true;
        default:
            return true;
    }
}
const tuple = (args) => args;
let classTriangleAdvantages = new Set([
    tuple([ServantClass.Saber, ServantClass.Lancer]),
    tuple([ServantClass.Archer, ServantClass.Saber]),
    tuple([ServantClass.Lancer, ServantClass.Archer]),
    tuple([ServantClass.Rider, ServantClass.Caster]),
    tuple([ServantClass.Caster, ServantClass.Assassin]),
    tuple([ServantClass.Assassin, ServantClass.Rider]),
    tuple([ServantClass.Ruler, ServantClass.MoonCancer]),
    tuple([ServantClass.Avenger, ServantClass.Ruler]),
    tuple([ServantClass.MoonCancer, ServantClass.Avenger]),
    tuple([ServantClass.AlterEgo, ServantClass.Foreigner]),
    tuple([ServantClass.Foreigner, ServantClass.Pretender]),
    tuple([ServantClass.Pretender, ServantClass.AlterEgo]),
]);
export { PowerMod, BuffSet, Calculator, Damage, CraftEssence };
//# sourceMappingURL=Damage.js.map