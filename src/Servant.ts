import { TransformPlainToClass, Type } from "class-transformer";
import { BuffSet, PowerMod } from "./Damage";

class Servant {
    constructor(readonly config: ServantConfig, readonly data: ServantData) {};

    getAttackStat(): number {
        return this.data.growthCurve.getAttackStat(this.config.level) + this.config.attackFou;
    }

    getNpMultiplier(overcharge: number): number {
        let multiplier = this.data.np.multiplier[this.config.npLevel - 1] + (this.config.isNpUpgraded ? this.data.np.multUpgrade : 0.0);
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
        readonly appendTarget: Trigger,
        passives: Buff[],
        skills: Skill[],
        np: NoblePhantasm) {
            this.growthCurve = growthCurve;
            this.passives = passives;
            this.skills = skills;
            this.np = np;
        }

        @Type(() => GrowthCurve)
        readonly growthCurve: GrowthCurve;
        @Type(() => Buff)
        readonly passives: Buff[];
        @Type(() => Skill)
        readonly skills: Skill[];
        @Type(() => NoblePhantasm)
        readonly np: NoblePhantasm;
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
        readonly trig?: Trigger) {}
}

enum BuffType {
    AttackUp = "atk",
    CardTypeUp = "eff",
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
        readonly type: CardType,
        readonly multiplier: number[],
        readonly multUpgrade: number,
        readonly extraDamage: number[],
        readonly extraTrigger: Trigger,
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
    Man = "man",
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

enum Trigger {
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
    Always = "always",
    Never = "never",
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
    KotrOrFae = "KoTR or Fae",
    Good = "alignmentGood",
    Evil = "alignmentEvil",
    Lawful = "alignmentLawful",
    Chaotic = "alignmentChaotic",
    Neutral = "alignmentNeutral",
    Summer = "alignmentSummer",
    Madness = "alignmentMadness",
    //TODO: add remaining triggers
}

export { Servant, ServantConfig, ServantData, Buff, BuffType, Skill, NoblePhantasm, ServantClass, ServantAttribute, Trigger, CardType, GrowthCurve, Alignment };