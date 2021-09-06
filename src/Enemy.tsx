class Enemy {
    constructor(
        public eClass: EnemyClass,
        public attribute: EnemyAttribute,
        public traits: Trait[],
        public hitPoints: number) {}
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
    Human = "Human",
    //TODO
}

export { Enemy, EnemyClass, EnemyAttribute };