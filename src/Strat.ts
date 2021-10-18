import { BuffSet, Calculator, CraftEssence, NpResult, Range, RefundResult } from "./Damage";
import { CardType, Servant } from "./Servant";
import { Enemy } from "./Enemy";
import update from "immutability-helper";
import { Type } from "class-transformer";
import { TemplateData } from "./Data";

export class BuffMatrix {
    constructor(buffs: BuffSet[]) {
        this.buffs = buffs;
    }

    @Type(() => BuffSet)
    readonly buffs: BuffSet[];

    static create(size: number): BuffMatrix {
        let buffs = new Array<BuffSet>(size);
        buffs.fill(BuffSet.empty());
        return new BuffMatrix(buffs);
    }

    /**
     * Keeps npCard in sync on all BuffMatrix objects so that display and calculations are consistent.
     * (Ideally we would just track that on the Strat level but this simplifies coordination between components by avoiding the need to write extra update hooks.)
     * @param other BuffMatrix to take values from.
     * @returns 
     */
    // public syncNpCard(other: BuffMatrix): BuffMatrix {
    //     return this.buffs.some((buffSet, index) => buffSet.npCard != other.buffs[index].npCard) ?
    //         new BuffMatrix(this.buffs.map((buffSet, index) => update(buffSet, { npCard: { $set: other.buffs[index].npCard } }))) :
    //         this;
    // }
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
        damagePerEnemy: NpResult[];
        refund: Range<number>;
        unclearedEnemies: number;
        leftToFacecard: number;
}

export class NodeDamage {
    constructor(
        public damagePerWave: WaveDamage[] = [],
        public unclearedWaves: number = 0) {}
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

    //TODO: fix this garbage
    public run(node: EnemyNode): NodeDamage {
        const calculator: Calculator = new Calculator();
        const result = new NodeDamage();
        const clearers = this.getRealClearers();
        result.damagePerWave = node.waves.map((wave, wIndex) => {
            const waveResult = { unclearedEnemies: 0, damagePerEnemy: [] as NpResult[], leftToFacecard: 0 };
            const [clearer, _, ce] = clearers[wIndex];
            waveResult.damagePerEnemy = wave.enemies.map(enemy => calculator.calculateNp(
                clearer, ce, enemy, [ ...this.servants.filter(s => s).map(s => s!.buffs.buffs[wIndex]), this.template.buffs.buffs[wIndex] ], this.npCards[wIndex]
            ));
            waveResult.damagePerEnemy.forEach((result, eIndex) => {
                const enemy = wave.enemies[eIndex];
                if (result.damage.low < enemy.hitPoints) {
                    waveResult.unclearedEnemies += 1;
                    waveResult.leftToFacecard += enemy.hitPoints - result.damage.low;
                }
            })
            if (waveResult.unclearedEnemies > 0) result.unclearedWaves += 1;
            return {
                ...waveResult,
                refund: Range.sum(waveResult.damagePerEnemy.map(res => res.refund), (a, b) => a + b.refunded, 0)
            };
        });
        return result;
    }
}