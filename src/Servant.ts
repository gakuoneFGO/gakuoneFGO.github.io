import { Transform, Type } from "class-transformer";
import { s, ScaledInt, transformScaledInt } from "./arithmetic";

export class Servant {
    constructor(readonly config: ServantConfig, readonly data: ServantData) {};

    public getAttackStat(): number {
        return this.data.growthCurve.getAttackStat(this.config.level) + this.config.attackFou;
    }

    public getNpMultiplier(np: NoblePhantasm, overcharge: number): number {
        let multiplier = np.multiplier[this.config.npLevel - 1] + (this.config.isNpUpgraded ? this.getNpMultUpgrade(np) : 0.0);
        if (this.data.name == "Arash") {
            return multiplier + overcharge * (this.config.isNpUpgraded ?  2.0 : 1.0);
        } else if (this.data.name == "Chen Gong") {
            return multiplier + overcharge * 2.25;
        } else {
            return multiplier;
        }
    }

    private getNpMultUpgrade(np: NoblePhantasm) {
        if (np.multUpgrade > 0 || np.target == "none") return np.multUpgrade;
        //user selected to view upgraded NP damage but this servant has no upgrade yet, so add standard multiplier buff
        const cardMult =
            np.cardType == CardType.Buster  ?   1   :
            np.cardType == CardType.Arts    ?   1.5 :
            np.cardType == CardType.Quick   ?   2   :
                                                0   ;
        const targetMult =
            np.target == "aoe"  ?   1   :
            np.target == "st"   ?   2   :
                                    0   ;
        return cardMult * targetMult;
    }
    
    public getAppendMod(): PowerMod {
        return new PowerMod(this.data.appendTarget, appendMod[this.config.appendLevel]);
    }

    public hasInvalidNpUpgrade(): boolean {
        return this.config.isNpUpgraded && this.data.nps.some(np => np.target != "none" && np.multUpgrade == 0);
    }

    public isPlaceholder(): boolean {
        return this.data.isPlaceholder();
    }

    public isSpecified(): boolean {
        return this.data.isSpecified();
    }
}

export class ServantConfig {
    constructor(
        readonly name: string,
        readonly npLevel: number,
        readonly level: number,
        readonly attackFou: number,
        readonly appendLevel: AppendLevel,
        readonly isNpUpgraded: boolean) {}
}

const appendMod = [ 0, .2, .21, .22, .23, .24, .25, .26, .27, .28, .3 ].map(s);
export type AppendLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class GrowthCurve {
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

export class ServantData {
    constructor(
        readonly name: string,
        readonly id: number,
        readonly rarity: number,
        growthCurve: GrowthCurve,
        readonly sClass: ServantClass,
        readonly attribute: ServantAttribute,
        readonly traits: Trait[],
        readonly f2pCopies: number,
        readonly iconUrl: string,
        readonly cardArtUrl: string,
        readonly chargeProfile: string,
        readonly appendTarget: Trait[],
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

    public getNP(cardType?: CardType): NoblePhantasm {
        return this.nps.find(np => np.cardType == cardType) ?? this.nps.find(np => np.target == "aoe") ?? this.nps[0];
    }

    public hasNP(cardType: CardType): boolean {
        return this.nps.some(np => np.cardType == cardType);
    }

    public isPlaceholder(): boolean {
        return this.name == "<Placeholder>";
    }

    public isSpecified(): boolean {
        return this.name != "<Unspecified>";
    }

    public hasBuffInKit(buffType: BuffType): boolean {
        return this.skills.flatMap(s => s.buffs)
            .concat(this.nps.flatMap(np => np.preBuffs))
            .concat(this.nps.flatMap(np => np.postBuffs))
            .some(b => b.type == buffType);
    }
}

export class Buff {
    constructor(
        readonly self: boolean,
        readonly team: boolean,
        readonly type: BuffType,
        readonly val: number,
        readonly turns: number,
        readonly cardType?: CardType,
        readonly trig?: Trait[]) {}
}

export enum BuffType {
    AttackUp = "attackUp",
    CardTypeUp = "cardTypeUp",
    NpDmgUp = "npDamage",
    PowerMod = "powerMod",
    Overcharge = "overcharge",
    NpBoost = "npBoost",
    NpGain = "npGain",
    DamagePlus = "damagePlus",
    AddTrait = "addTrait",
}

export class Skill {
    constructor(
        readonly cooldown: number,
        buffs: Buff[]) {
        this.buffs = buffs;
    }

    @Type(() => Buff)
    readonly buffs: Buff[];
}

export class PowerMod {
    constructor(
        readonly trigger: Trait[],
        modifier: ScaledInt) {
            this.modifier = modifier;
        }
    
    @Type(() => ScaledInt)
    @Transform(transformScaledInt)
    readonly modifier: ScaledInt;
}

export type NPTarget = "aoe" | "st" | "none";

export class NoblePhantasm {
    constructor(
        readonly cardType: CardType,
        readonly target: NPTarget,
        readonly multiplier: number[],
        readonly multUpgrade: number,
        readonly extraDamage: number[],
        readonly extraTrigger: Trait[],
        readonly extraDmgStacks: boolean,
        readonly refundRate: number,
        readonly hitDistribution: number[],
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

export enum CardType {
    Buster = "buster",
    Arts = "arts",
    Quick = "quick",
    Extra = "extra",
}

export enum ServantClass {
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

export enum ServantAttribute {
    Man = "human",
    Earth = "earth",
    Sky = "sky",
    Star = "star",
    Beast = "beast",
}

// export enum Alignment {
//     Good = "good",
//     Evil = "evil",
//     Lawful = "lawful",
//     Chaotic = "chaotic",
//     Neutral = "neutral",
//     Balanced = "balanced",
//     Summer = "summer",
//     Madness = "madness",
// }

export enum Trait {
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
    Balanced = "alignmentBalanced",
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
    HominidaeServant = "hominidaeServant",
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
    DemonicBeastServant = "demonicBeastServant",
    Charmed = "buffCharm",
    MentalDebuff = "buffMentalEffect",
    WeaknessFound = "weakPointsRevealed",
    ShadowServant = "shadowServant",
}