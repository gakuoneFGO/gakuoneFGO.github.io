class Enemy {
    constructor(eClass, attribute, traits, hitPoints) {
        this.eClass = eClass;
        this.attribute = attribute;
        this.traits = traits;
        this.hitPoints = hitPoints;
    }
}
var EnemyClass;
(function (EnemyClass) {
    EnemyClass["Saber"] = "Saber";
    EnemyClass["Archer"] = "Archer";
    EnemyClass["Lancer"] = "Lancer";
    EnemyClass["Rider"] = "Rider";
    EnemyClass["Caster"] = "Caster";
    EnemyClass["Assassin"] = "Assassin";
    EnemyClass["Berserker"] = "Berserker";
    EnemyClass["Ruler"] = "Ruler";
    EnemyClass["Avenger"] = "Avenger";
    EnemyClass["MoonCancer"] = "MoonCancer";
    EnemyClass["AlterEgo"] = "AlterEgo";
    EnemyClass["Foreigner"] = "Foreigner";
    EnemyClass["Pretender"] = "Pretender";
    EnemyClass["Shielder"] = "Shielder";
    EnemyClass["Knight"] = "Knight";
    EnemyClass["Cavalry"] = "Cavalry";
    EnemyClass["Neutral"] = "(Neutral)";
})(EnemyClass || (EnemyClass = {}));
var EnemyAttribute;
(function (EnemyAttribute) {
    EnemyAttribute["Man"] = "Man";
    EnemyAttribute["Earth"] = "Earth";
    EnemyAttribute["Sky"] = "Sky";
    EnemyAttribute["Star"] = "Star";
    EnemyAttribute["Beast"] = "Beast";
    EnemyAttribute["Neutral"] = "(Neutral)";
})(EnemyAttribute || (EnemyAttribute = {}));
var Trait;
(function (Trait) {
    Trait["Human"] = "Human";
    //TODO
})(Trait || (Trait = {}));
export { Enemy, EnemyClass, EnemyAttribute };
//# sourceMappingURL=Enemy.js.map