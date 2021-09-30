import { Type } from "class-transformer";
import { PowerMod } from "./Damage";
import { Trait } from "./Enemy";

class Servant {
    constructor(readonly config: ServantConfig, readonly data: ServantData) {};

    getAttackStat(): number {
        return this.data.growthCurve.getAttackStat(this.config.level) + this.config.attackFou;
    }

    getNpMultiplier(np: NoblePhantasm, overcharge: number): number {
        let multiplier = np.multiplier[this.config.npLevel - 1] + (this.config.isNpUpgraded ? np.multUpgrade : 0.0);
        if (this.data.name == "Arash") {
            return multiplier + overcharge * (this.config.isNpUpgraded ?  2.0 : 1.0);
        } else if (this.data.name == "Chen Gong") {
            return multiplier + overcharge * 2.25;
        } else {
            return multiplier;
        }
    }

    isPlaceholder(): boolean {
        return this.data.name == "<Placeholder>";
    }

    isSpecified(): boolean {
        return this.data.name != "<Unspecified>";
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
        readonly name: string,
        readonly id: number,
        readonly rarity: number,
        growthCurve: GrowthCurve,
        readonly sClass: ServantClass,
        readonly attribute: ServantAttribute,
        readonly f2pCopies: number,
        readonly iconUrl: string,
        readonly cardArtUrl: string,
        readonly chargeProfile: string,
        readonly appendTarget: Trait,
        passives: Buff[],
        skills: Skill[],
        nps: NoblePhantasm[]) {
            this.growthCurve = growthCurve;
            this.passives = passives;
            this.skills = skills;
            this.nps = nps;
        }

    @Type(() => GrowthCurve)
    readonly growthCurve: GrowthCurve;
    @Type(() => Buff)
    readonly passives: Buff[];
    @Type(() => Skill)
    readonly skills: Skill[];
    @Type(() => NoblePhantasm)
    readonly nps: NoblePhantasm[];

    getNP(cardType?: CardType): NoblePhantasm {
        return this.nps.find(np => !cardType || np.cardType == cardType) as NoblePhantasm;
    }

    hasNP(cardType: CardType): boolean {
        return this.nps.some(np => np.cardType == cardType);
    }
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

class Buff {
    constructor(
        readonly self: boolean,
        readonly team: boolean,
        readonly type: BuffType,
        readonly val: number,
        readonly turns: number,
        readonly cardType?: CardType,
        readonly trig?: Trait) {}
}

enum BuffType {
    AttackUp = "atk",
    CardTypeUp = "card",
    NpDmgUp = "npDmg",
    PowerMod = "pMod",
    Overcharge = "oc",
    NpBoost = "npBoost",
}

class Skill {
    constructor(
        readonly cooldown: number,
        buffs: Buff[]) {
        this.buffs = buffs;
    }

    @Type(() => Buff)
    readonly buffs: Buff[];
}

class NoblePhantasm {
    constructor(
        readonly cardType: CardType,
        readonly multiplier: number[],
        readonly multUpgrade: number,
        readonly extraDamage: number[],
        readonly extraTrigger: Trait,
        preBuffs: Buff[],
        postBuffs: Buff[]) {
        this.preBuffs = preBuffs;
        this.postBuffs = postBuffs;
    }

    @Type(() => Buff)
    readonly preBuffs: Buff[];
    @Type(() => Buff)
    readonly postBuffs: Buff[];
} 

enum CardType {
    Buster = "buster",
    Arts = "arts",
    Quick = "quick",
    Extra = "extra",
}

enum ServantClass {
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
}

enum ServantAttribute {
    Man = "human",
    Earth = "earth",
    Sky = "sky",
    Star = "star",
    Beast = "beast",
}

enum Alignment {
    Good = "good",
    Evil = "evil",
    Lawful = "lawful",
    Chaotic = "chaotic",
    Neutral = "neutral",
    Summer = "summer",
    Madness = "madness",
}

export { Servant, ServantConfig, ServantData, Buff, BuffType, Skill, NoblePhantasm, ServantClass, ServantAttribute, CardType, GrowthCurve, Alignment };