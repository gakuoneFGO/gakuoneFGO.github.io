import { TransformPlainToClass, Type } from "class-transformer";
import { PowerMod } from "./Damage";

class Servant {
    constructor(readonly config: ServantConfig, readonly data: ServantData) {};

    getAttackStat(): number {
        return this.data.growthCurve.getAttackStat(this.config.level) + this.config.attackFou;
    }

    getNpMultiplier(overcharge: number): number {
        let multiplier = this.data.npMultiplier[this.config.npLevel - 1] + (this.config.isNpUpgraded ? this.data.npUpgrade : 0.0);
        if (this.data.name == "Arash") {
            return multiplier + overcharge * (this.config.isNpUpgraded ?  2.0 : 1.0);
        } else if (this.data.name == "Chen Gong") {
            return multiplier + overcharge * 2.25;
        } else {
            return multiplier;
        }
    }
}

class ServantConfig {
    constructor(
        readonly name: string,
        readonly npLevel: number,
        readonly level: number,
        readonly attackFou: number,
        readonly appendMod: PowerMod,
        readonly isNpUpgraded: boolean) {}
}

class ServantData {
    constructor(
        name: string,
        rarity: number,
        npType: CardType,
        npMultiplier: number[],
        npUpgrade: number,
        growthCurve: GrowthCurve,
        sClass: ServantClass,
        attribute: ServantAttribute,
        extraDamage: number[],
        extraTrigger: Trigger,
        f2pCopies: number,
        iconUrl: string,
        chargeProfile: string,
        appendTarget: ServantClass) {
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

        readonly name: string;
        readonly rarity: number;
        readonly npType: CardType;
        readonly npMultiplier: number[];
        readonly npUpgrade: number;
        @Type(() => GrowthCurve)
        readonly growthCurve: GrowthCurve;
        readonly sClass: ServantClass;
        readonly attribute: ServantAttribute;
        readonly extraDamage: number[];
        readonly extraTrigger: Trigger;
        readonly f2pCopies: number;
        readonly iconUrl: string;
        readonly chargeProfile: string;
        readonly appendTarget: ServantClass;
}

class GrowthCurve {
    constructor(stats: Map<string, number>) {
        this.stats = stats;
    }

    @Type(() => Map)
    readonly stats: Map<string, number>;

    getAttackStat(level: number): number {
        if (!this.stats.has(level.toString())) {
            throw new Error("Missing stats for servant at level " + level);
        }

        return this.stats.get(level.toString()) as number;
    }

    getValidLevels(): string[] {
        return Array.from(this.stats.keys());
    }
}

enum CardType {
    Buster = "Buster", 
    Arts = "Arts", 
    Quick = "Quick", 
}

enum ServantClass {
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
}

enum ServantAttribute {
    Man = "Man",
    Earth = "Earth",
    Sky = "Sky",
    Star = "Star",
    Beast = "Beast",
}

enum Trigger {
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
    Man = "Man",
    Earth = "Earth",
    Sky = "Sky",
    Star = "Star",
    Beast = "Beast",
    Always = "Always",
    Never = "Never",
    //TODO: add remaining triggers
}

export { Servant, ServantConfig, ServantData, ServantClass, ServantAttribute, Trigger, CardType, GrowthCurve };