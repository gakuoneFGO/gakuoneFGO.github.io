import update from "immutability-helper";

class Enemy {
    constructor(
        readonly eClass: EnemyClass,
        readonly attribute: EnemyAttribute,
        readonly traits: Trait[],
        readonly hitPoints: number) {}
    
    public changeClass(className: EnemyClass): Enemy {
        let toAdd = [ toTrait("class", className) ].filter(t => classTraits.some(t2 => t == t2));
        let toRemove = classTraits.filter(t => t != toAdd[0]);
        return update(this as Enemy, { eClass: { $set: className }, traits: { $set: this.updateTraits(toAdd, toRemove) } });
    }

    public changeAttribute(attribute: EnemyAttribute): Enemy {
        let toAdd = [ toTrait("attribute", attribute) ].filter(t => attrTraits.some(t2 => t == t2));
        let toRemove = attrTraits.filter(t => t != toAdd[0]);
        return update(this as Enemy, { attribute: { $set: attribute }, traits: { $set: this.updateTraits(toAdd, toRemove) } });
    }

    private updateTraits(traitsToAdd: Trait[], traitsToRemove: Trait[]): Trait[] {
        return this.traits
            .filter(t => !traitsToRemove.some(t2 => t2 == t))
            .concat(traitsToAdd.filter(t => !this.traits.some(t2 => t2 == t)));
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
    Never = "never",
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
}

let classTraits = Object.values(Trait).filter(t => t.startsWith("class"));
let attrTraits = Object.values(Trait).filter(t => t.startsWith("attribute"));

export { Enemy, EnemyClass, EnemyAttribute, Trait };