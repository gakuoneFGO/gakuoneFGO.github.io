import { PowerMod } from "./Damage";

class Servant {
    constructor(
        public data: ServantData,
        public npLevel: number,
        public level: number,
        public attackFou: number,
        public appendMod: PowerMod,
        public isNpUpgraded: boolean) {}

    getAttackStat(): number {
        return this.data.growthCurve.getAttackStat(this.level) + this.attackFou;
    }

    getNpMultiplier(overcharge: number): number {
        let multiplier = this.data.npMultiplier[this.npLevel] + (this.isNpUpgraded ? this.data.npUpgrade : 0.0);
        if (this.data.name == "Arash") {
            return multiplier + (overcharge - 1) * (this.isNpUpgraded ?  2.0 : 1.0);
        } else if (this.data.name == "Chen Gong") {
            return multiplier + (overcharge - 1) * 2.25;
        } else {
            return multiplier;
        }
    }
}

class ServantData {
    constructor(
        readonly name: string,
        readonly rarity: number,
        readonly npType: CardType,
        readonly npMultiplier: number[],
        readonly npUpgrade: number,
        readonly growthCurve: GrowthCurve,
        readonly sClass: ServantClass,
        readonly attribute: ServantAttribute,
        readonly extraDamage: number[],
        readonly extraTrigger: Trigger,
        readonly f2pCopies: number,
        readonly iconUrl: string,
        readonly chargeProfile: string,
        readonly appendTarget: ServantClass) {}
}

class GrowthCurve {
    constructor(readonly stats: Map<number, number>) { }

    getAttackStat(level: number): number {
        if (!this.stats.has(level)) {
            throw new Error("Missing stats for servant at level " + level);
        }

        return this.stats.get(level) as number;
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

export { Servant, ServantData, ServantClass, ServantAttribute, Trigger, CardType, GrowthCurve };