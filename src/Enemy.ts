class Enemy {
    constructor(
        readonly eClass: EnemyClass,
        readonly attribute: EnemyAttribute,
        readonly traits: Trait[],
        readonly hitPoints: number) {}
}

enum EnemyClass {
    Saber = "Saber",
    Archer = "Archer",
    Lancer = "Lancer",
    Rider = "Rider",
    Caster = "Caster",
    Assassin = "Assassin",
    Berserker = "Berserker",
    Ruler = "Ruler",
    Avenger = "Avenger",
    MoonCancer = "MoonCancer",
    AlterEgo = "AlterEgo",
    Foreigner = "Foreigner",
    Pretender = "Pretender",
    Shielder = "Shielder",
    Knight = "Knight",
    Cavalry = "Cavalry",
    Neutral = "(Neutral)"
}

enum EnemyAttribute {
    Man = "Man",
    Earth = "Earth",
    Sky = "Sky",
    Star = "Star",
    Beast = "Beast",
    Neutral = "(Neutral)",
}

enum Trait {
    Argo = "Argo",
    Arthur = "Arthur",
    BrynhildrsBeloved = "Brynhildr's Beloved",
    Children = "Children",
    CostumeOwning = "Costume-Owning",
    Demonic = "Demonic",
    Divine = "Divine",
    DivineSpirit = "Divine Spirit",
    Dragon = "Dragon",
    Fae = "Fae",
    Feminine = "Feminine",
    Genji = "Genji",
    Giant = "Giant",
    GreekMythMales = "Greek Myth Males",
    Humanoid = "Humanoid",
    Illya = "Illya",
    King = "King",
    Human = "Human",
    Mechanical = "Mechanical",
    Nobunaga = "Nobunaga",
    Oni = "Oni",
    Pseudo = "Pseudo",
    Demi = "Demi",
    Riding = "Riding",
    Roman = "Roman",
    KoTR = "KoTR",
    Saberface = "Saberface",
    Servant = "Servant",
    Shuten = "Shuten",
    SuperLarge = "Super Large",
    ThreatToHumanity = "Threat to Humanity",
    Undead = "Undead",
    WeakToEnumaElish = "Weak to Enuma Elish",
    WildBeast = "Wild Beast",
}

export { Enemy, EnemyClass, EnemyAttribute };