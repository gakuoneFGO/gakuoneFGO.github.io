class Servant {
    constructor(data, npLevel, level, attackFou, appendMod, isNpUpgraded) {
        this.data = data;
        this.npLevel = npLevel;
        this.level = level;
        this.attackFou = attackFou;
        this.appendMod = appendMod;
        this.isNpUpgraded = isNpUpgraded;
    }
    getAttackStat() {
        return this.data.growthCurve.getAttackStat(this.level) + this.attackFou;
    }
    getNpMultiplier(overcharge) {
        let multiplier = this.data.npMultiplier[this.npLevel] + (this.isNpUpgraded ? this.data.npUpgrade : 0.0);
        if (this.data.name == "Arash") {
            return multiplier + (overcharge - 1) * (this.isNpUpgraded ? 2.0 : 1.0);
        }
        else if (this.data.name == "Chen Gong") {
            return multiplier + (overcharge - 1) * 2.25;
        }
        else {
            return multiplier;
        }
    }
}
class ServantData {
    constructor(name, rarity, npType, npMultiplier, npUpgrade, growthCurve, sClass, attribute, extraDamage, extraTrigger, f2pCopies, iconUrl, chargeProfile, appendTarget) {
        this.name = name;
        this.rarity = rarity;
        this.npType = npType;
        this.npMultiplier = npMultiplier;
        this.npUpgrade = npUpgrade;
        this.growthCurve = growthCurve;
        this.sClass = sClass;
        this.attribute = attribute;
        this.extraDamage = extraDamage;
        this.extraTrigger = extraTrigger;
        this.f2pCopies = f2pCopies;
        this.iconUrl = iconUrl;
        this.chargeProfile = chargeProfile;
        this.appendTarget = appendTarget;
    }
}
class GrowthCurve {
    constructor(stats) {
        this.stats = stats;
    }
    getAttackStat(level) {
        if (!this.stats.has(level)) {
            throw new Error("Missing stats for servant at level " + level);
        }
        return this.stats.get(level);
    }
}
var CardType;
(function (CardType) {
    CardType["Buster"] = "Buster";
    CardType["Arts"] = "Arts";
    CardType["Quick"] = "Quick";
})(CardType || (CardType = {}));
var ServantClass;
(function (ServantClass) {
    ServantClass["Saber"] = "Saber";
    ServantClass["Archer"] = "Archer";
    ServantClass["Lancer"] = "Lancer";
    ServantClass["Rider"] = "Rider";
    ServantClass["Caster"] = "Caster";
    ServantClass["Assassin"] = "Assassin";
    ServantClass["Berserker"] = "Berserker";
    ServantClass["Ruler"] = "Ruler";
    ServantClass["Avenger"] = "Avenger";
    ServantClass["MoonCancer"] = "MoonCancer";
    ServantClass["AlterEgo"] = "AlterEgo";
    ServantClass["Foreigner"] = "Foreigner";
    ServantClass["Pretender"] = "Pretender";
    ServantClass["Shielder"] = "Shielder";
})(ServantClass || (ServantClass = {}));
var ServantAttribute;
(function (ServantAttribute) {
    ServantAttribute["Man"] = "Man";
    ServantAttribute["Earth"] = "Earth";
    ServantAttribute["Sky"] = "Sky";
    ServantAttribute["Star"] = "Star";
    ServantAttribute["Beast"] = "Beast";
})(ServantAttribute || (ServantAttribute = {}));
var Trigger;
(function (Trigger) {
    Trigger["Saber"] = "Saber";
    Trigger["Archer"] = "Archer";
    Trigger["Lancer"] = "Lancer";
    Trigger["Rider"] = "Rider";
    Trigger["Caster"] = "Caster";
    Trigger["Assassin"] = "Assassin";
    Trigger["Berserker"] = "Berserker";
    Trigger["Ruler"] = "Ruler";
    Trigger["Avenger"] = "Avenger";
    Trigger["MoonCancer"] = "MoonCancer";
    Trigger["AlterEgo"] = "AlterEgo";
    Trigger["Foreigner"] = "Foreigner";
    Trigger["Pretender"] = "Pretender";
    Trigger["Man"] = "Man";
    Trigger["Earth"] = "Earth";
    Trigger["Sky"] = "Sky";
    Trigger["Star"] = "Star";
    Trigger["Beast"] = "Beast";
    Trigger["Always"] = "Always";
    Trigger["Never"] = "Never";
    //TODO: add remaining triggers
})(Trigger || (Trigger = {}));
export { Servant, ServantData, ServantClass, ServantAttribute, Trigger, CardType, GrowthCurve };
//# sourceMappingURL=Servant.js.map