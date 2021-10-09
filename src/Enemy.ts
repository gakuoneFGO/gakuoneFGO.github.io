import update from "immutability-helper";
import { Trait } from "./Servant";

class Enemy {
    constructor(
        readonly eClass: EnemyClass,
        readonly attribute: EnemyAttribute,
        readonly traits: Trait[],
        readonly hitPoints: number) {}
    
    public withClass(className: EnemyClass): Enemy {
        const toAdd = [ toTrait("class", className) ].filter(t => classTraits.some(t2 => t == t2));
        const toRemove = classTraits.filter(t => t != toAdd[0]);
        const withClass = update(this as Enemy, { eClass: { $set: className }, traits: { $set: this.updateTraits(toAdd, toRemove) } });
        return withClass.withCompositeTraits(this);
    }

    public withAttribute(attribute: EnemyAttribute): Enemy {
        const toAdd = [ toTrait("attribute", attribute) ].filter(t => attrTraits.some(t2 => t == t2));
        const toRemove = attrTraits.filter(t => t != toAdd[0]);
        const withAttr = update(this as Enemy, { attribute: { $set: attribute }, traits: { $set: this.updateTraits(toAdd, toRemove) } });
        return withAttr.withCompositeTraits(this);
    }

    public withSpecificTraits(traits: Trait[]): Enemy {
        const withTraits = update(this as Enemy, { traits: { $set: traits } });
        return withTraits.withCompositeTraits(this);
    }

    private updateTraits(traitsToAdd: Trait[], traitsToRemove: Trait[]): Trait[] {
        return this.traits.filter(t => !traitsToRemove.includes(t))
            .concat(traitsToAdd.filter(t => !this.traits.includes(t)));
    }

    private withCompositeTraits(oldEnemy: Enemy): Enemy {
        return update(this as Enemy, { traits: { $set: this.updateTraits(...this.getCompositeTraits(oldEnemy)) } });
    }

    private getCompositeTraits(oldEnemy: Enemy): [Trait[], Trait[]] {
        const computed = compositeTraits
            .map(t => ({ trait: t[0], oldEval: t[1](oldEnemy), newEval: t[1](this) }))
            .filter(({ oldEval, newEval }) => oldEval != newEval);
        return [
            computed.flatMap(({ trait, newEval }) => newEval ? [trait] : []),//to add
            computed.flatMap(({ trait, oldEval }) => oldEval ? [trait] : []),//to remove
        ];
    }
}                   

function toTrait<T extends string>(traitType: string, enumValue: T): Trait {
    return (traitType + enumValue.substring(0, 1).toUpperCase() + enumValue.substring(1)) as Trait;
}

enum EnemyClass {
    Saber = "saber",
    Archer = "archer",
    Lancer = "lancer",
    Rider = "rider",
    Caster = "caster",
    Assassin = "assassin",
    Berserker = "berserker",
    Ruler = "ruler",
    Avenger = "avenger",
    MoonCancer = "moonCancer",
    AlterEgo = "alterEgo",
    Foreigner = "foreigner",
    Pretender = "pretender",
    Shielder = "shielder",
    Knight = "knight",
    Cavalry = "cavalry",
    Neutral = "(neutral)"
}

enum EnemyAttribute {
    Man = "human",
    Earth = "earth",
    Sky = "sky",
    Star = "star",
    Beast = "beast",
    Neutral = "(neutral)",
}

const classTraits = Object.values(Trait).filter(t => t.startsWith("class"));
const attrTraits = Object.values(Trait).filter(t => t.startsWith("attribute"));

const compositeTraits: [Trait, (enemy: Enemy) => boolean][] = [
    [ Trait.EarthOrSky, (enemy: Enemy) => [EnemyAttribute.Earth, EnemyAttribute.Sky].includes(enemy.attribute) && enemy.traits.includes(Trait.Servant) ],
    [ Trait.SaberServant, (enemy: Enemy) => enemy.eClass == EnemyClass.Saber && enemy.traits.includes(Trait.Servant) ],
];

export { Enemy, EnemyClass, EnemyAttribute, Trait };