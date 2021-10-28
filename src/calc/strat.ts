import { BuffSet, Calculator, CraftEssence, NpResult, Range, RefundResult } from "./damage";
import { CardType, Servant } from "./servant";
import { Enemy } from "./enemy";
import update from "immutability-helper";
import { Type } from "class-transformer";
import { TemplateData } from "./data";
import { s, ScaledInt } from "./arithmetic";

export class BuffMatrix {
    constructor(buffs: BuffSet[]) {
        this.buffs = buffs;
    }

    @Type(() => BuffSet)
    readonly buffs: BuffSet[];

    merge(other: BuffMatrix, maxPowerMods: number): BuffMatrix {
        return new BuffMatrix(
            this.buffs.map((buffset, turn) => BuffSet.combine([buffset, other.buffs[turn]]).normalize(maxPowerMods))
        );
    }

    static create(size: number): BuffMatrix {
        const buffs = new Array<BuffSet>(size);
        buffs.fill(BuffSet.empty());
        return new BuffMatrix(buffs);
    }
}

export class Template {
    constructor(
        readonly name: string,
        readonly buffs: BuffMatrix,
        readonly party: Servant[],
        readonly clearers: number[],
        readonly description: string,
        readonly instructions: string[]) {}
    
    public asSaveable(): TemplateData {
        return new TemplateData(
            this.name,
            this.buffs,
            this.party.map(servant => servant.data.name),
            this.clearers,
            "",
            ["", "", ""]
        );
    }
}

export class Wave {
    constructor(enemies: Enemy[]) {
        this.enemies = enemies;
    }

    @Type(() => Enemy)
    public enemies: Enemy[];
}

export class EnemyNode {
    constructor(readonly name: string, waves: Wave[]) {
        this.waves = waves;
    }

    @Type(() => Wave)
    public readonly waves: Wave[];

    static uniform(enemy: Enemy): EnemyNode {
        let waves = new Array<Wave>(3);
        waves.fill(new Wave([ enemy ]));
        return new EnemyNode("", waves);
    }
}

export interface WaveDamage {
    readonly damagePerEnemy: NpResult[];
    readonly refund: Range<ScaledInt>;
}

export class NodeDamage {
    constructor(public readonly damagePerWave: WaveDamage[]) {}
}

//need this class since the compiler sucks at recognizing tuples
export class MainServant {
    constructor(servant: Servant, buffs: BuffMatrix) {
        this.servant = servant;
        this.buffs = buffs;
    }

    @Type(() => Servant)
    public readonly servant: Servant;
    @Type(() => BuffMatrix)
    public readonly buffs: BuffMatrix;
}

export class Strat {
    constructor(
        readonly servants: (MainServant | undefined)[],
        readonly template: Template,
        readonly servantCe: CraftEssence,
        readonly supportCe: CraftEssence,
        readonly npCards: CardType[]) {}

    public getRealParty(): [Servant, BuffMatrix | undefined, CraftEssence][] {
        return this.servants.map((servant, index) => servant ?
            [ servant.servant, servant.buffs, this.servantCe ] :
            [ this.template.party[index], undefined, this.supportCe ]);
    }

    public getRealClearers(): [Servant, BuffMatrix | undefined, CraftEssence][] {
        let party = this.getRealParty();
        return this.template.clearers.map(cIndex => party[cIndex]);
    }

    public swap(slot1: number, slot2: number): Strat {
        if (slot1 == slot2) return this;
        const getNewClearer = (clearer: number) =>
            clearer == slot1 ? slot2 :
            clearer == slot2 ? slot1 :
            clearer;
        return update(this as Strat, {
            servants: {
                [slot1]: { $set: this.servants[slot2] },
                [slot2]: { $set: this.servants[slot1] },
            },
            template: {
                party: {
                    [slot1]: { $set: this.template.party[slot2] },
                    [slot2]: { $set: this.template.party[slot1] },
                },
                clearers: { $set: this.template.clearers.map(getNewClearer) }
            }
        });
    }

    public setNpLevel(level: number): Strat {
        return this.template.clearers.reduce((unique, c) => unique.includes(c) ? unique : unique.concat([c]), [] as number[])
            .reduce((strat, clearer) => this.servants[clearer] ?
                update(strat, { servants: { [clearer]: { servant: { config: { npLevel: { $set: level } } } } } }) :
                update(strat, { template: { party: { [clearer]: { config: { npLevel: { $set: level } } } } } }),
                this as Strat)
    }

    public run(node: EnemyNode): NodeDamage {
        const clearers = this.getRealClearers();
        const damagePerWave = node.waves.map((wave, wIndex) => {
            const [clearer, _, ce] = clearers[wIndex];
            const  allBuffs = [ ...this.servants.filter(s => s).map(s => s!.buffs.buffs[wIndex]), this.template.buffs.buffs[wIndex] ];
            const damagePerEnemy = wave.enemies.map(enemy => calculator.calculateNp(clearer, ce, enemy, allBuffs, this.npCards[wIndex]));
            return {
                damagePerEnemy: damagePerEnemy,
                refund: Range.sum(damagePerEnemy.map(res => res.refund), (a, b) => a.plus(b.refunded), s(0))
            };
        });
        return new NodeDamage(damagePerWave);
    }
}

const calculator: Calculator = new Calculator();