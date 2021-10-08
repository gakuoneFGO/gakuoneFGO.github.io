import { Type } from "class-transformer";
import { Trait } from "./Enemy";

class Servant {
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

class ServantConfig {
    constructor(
        readonly name: string,
        readonly npLevel: number,
        readonly level: number,
        readonly attackFou: number,
        readonly appendLevel: AppendLevel,
        readonly isNpUpgraded: boolean) {}
}

const appendMod = [ 0, .2, .21, .22, .23, .24, .25, .26, .27, .28, .3 ];
export type AppendLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
        readonly trig?: Trait[]) {}
}

enum BuffType {
    AttackUp = "attackUp",
    CardTypeUp = "cardTypeUp",
    NpDmgUp = "npDamage",
    PowerMod = "powerMod",
    Overcharge = "overcharge",
    NpBoost = "npBoost",
    AddTrait = "addTrait",
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

export class PowerMod {
    constructor(
        readonly trigger: Trait[],
        readonly modifier: number) {}
}

export type NPTarget = "aoe" | "st" | "none";

class NoblePhantasm {
    constructor(
        readonly cardType: CardType,
        readonly target: NPTarget,
        readonly multiplier: number[],
        readonly multUpgrade: number,
        readonly extraDamage: number[],
        readonly extraTrigger: Trait[],
        readonly extraDmgStacks: boolean,
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