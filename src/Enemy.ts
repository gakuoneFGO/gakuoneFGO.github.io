import update from "immutability-helper";

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

enum Trait {
    Always = "always",
    Shielder = "classShielder",
    Saber = "classSaber",
    Archer = "classArcher",
    Lancer = "classLancer",
    Rider = "classRider",
    Caster = "classCaster",
    Assassin = "classAssassin",
    Berserker = "classBerserker",
    Ruler = "classRuler",
    Avenger = "classAvenger",
    MoonCancer = "classMoonCancer",
    AlterEgo = "classAlterEgo",
    Foreigner = "classForeigner",
    Pretender = "classPretender",
    Man = "attributeHuman",
    Earth = "attributeEarth",
    Sky = "attributeSky",
    Star = "attributeStar",
    Beast = "attributeBeast",
    Good = "alignmentGood",
    Evil = "alignmentEvil",
    Lawful = "alignmentLawful",
    Chaotic = "alignmentChaotic",
    Neutral = "alignmentNeutral",
    Summer = "alignmentSummer",
    Madness = "alignmentMadness",
    Male = "genderMale",
    Female = "genderFemale",
    UnknownGender = "genderUnknown",
    Argo = "argonaut",
    Arthur = "arthur",
    BrynhildrsBeloved = "brynhildsBeloved",
    Children = "childServant",
    CostumeOwning = "hasCostume",
    Demonic = "demonic",
    Divine = "divine",
    DivineSpirit = "divineSpirit",
    Dragon = "dragon",
    Fae = "fae",
    Feminine = "feminineLookingServant",
    Genji = "genji",
    Giant = "giant",
    GreekMythMales = "greekMythologyMales",
    Humanoid = "humanoid",
    Illya = "illya",
    King = "king",
    Human = "livingHuman",
    Mechanical = "mechanical",
    Nobunaga = "nobunaga",
    Oni = "oni",
    SkyOrEarthExceptPseudoAndDemi = "skyOrEarthExceptPseudoAndDemi",
    Riding = "riding",
    Roman = "roman",
    KoTR = "knightsOfTheRound",
    Saberface = "saberface",
    Servant = "servant",
    Shuten = "shuten",
    SuperLarge = "superGiant",
    ThreatToHumanity = "threatToHumanity",
    Undead = "undead",
    WeakToEnumaElish = "weakToEnumaElish",
    WildBeast = "wildbeast",
    EarthOrSky = "skyOrEarth",
    SaberServant = "saberClassServant",
    Charmed = "buffCharm",
    WeaknessFound = "weakPointsRevealed",
}

const classTraits = Object.values(Trait).filter(t => t.startsWith("class"));
const attrTraits = Object.values(Trait).filter(t => t.startsWith("attribute"));

const compositeTraits: [Trait, (enemy: Enemy) => boolean][] = [
    [ Trait.EarthOrSky, (enemy: Enemy) => [EnemyAttribute.Earth, EnemyAttribute.Sky].includes(enemy.attribute) && enemy.traits.includes(Trait.Servant) ],
    [ Trait.SaberServant, (enemy: Enemy) => enemy.eClass == EnemyClass.Saber && enemy.traits.includes(Trait.Servant) ],
];

export { Enemy, EnemyClass, EnemyAttribute, Trait };