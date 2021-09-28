import { BuffSet, Damage, Calculator, CraftEssence } from "./Damage";
import { CardType, Servant } from "./Servant";
import { Enemy } from "./Enemy";
import update, { Spec } from "immutability-helper";
import { Type } from "class-transformer";

class BuffMatrix {
    constructor(buffs: BuffSet[]) {
        this.buffs = buffs;
    }

    @Type(() => BuffSet)
    readonly buffs: BuffSet[];

    // static create(size: number): BuffMatrix {
    //     let buffs = new Array<BuffSet>(size);
    //     buffs.fill(BuffSet.empty());
    //     return new BuffMatrix(buffs);
    // }

    /**
     * Keeps npCard in sync on all BuffMatrix objects so that display and calculations are consistent.
     * (Ideally we would just track that on the Strat level but this simplifies coordination between components by avoiding the need to write extra update hooks.)
     * TODO: no-op detection
     * @param other BuffMatrix to take values from.
     * @returns 
     */
    public syncNpCard(other: BuffMatrix): BuffMatrix {
        return new BuffMatrix(this.buffs.map((buffSet, index) => update(buffSet, { npCard: { $set: other.buffs[index].npCard } })));
    }
}

class Template {
    constructor(
        readonly name: string,
        readonly buffs: BuffMatrix,
        readonly party: Servant[],
        readonly clearers: number[],
        readonly description: string,
        readonly instructions: string[]) {}
}

class Wave {
    constructor(readonly enemies: Enemy[]) {}
}

class EnemyNode {
    constructor(readonly name: string, readonly waves: Wave[]) {}

    static uniform(enemy: Enemy): EnemyNode {
        let waves = new Array<Wave>(3);
        waves.fill(new Wave([ enemy ]));
        return new EnemyNode("", waves);
    }
}

class WaveDamage {
    constructor(
        public damagePerEnemy: Damage[] = [],
        public unclearedEnemies: number = 0,
        public leftToFacecard: number = 0.0) {}
}

class NodeDamage {
    constructor(
        public damagePerWave: WaveDamage[] = [],
        public unclearedWaves: number = 0) {}
}

class Strat {
    constructor(
        readonly servant: Servant,
        readonly template: Template,
        readonly servantBuffs: BuffMatrix,
        readonly servantCe: CraftEssence,
        readonly supportCe: CraftEssence) {}

    public getRealParty(): [Servant, CraftEssence][] {
        let strat = this;
        return this.template.party.map(s => s.data.name == "<Placeholder>" ? [strat.servant, strat.servantCe] : [s, strat.supportCe]);
    } 

    public getRealClearers(): [Servant, CraftEssence][] {
        let party = this.getRealParty();
        return this.template.clearers.map(cIndex => party[cIndex]);
    }

    //TODO: fix this garbage
    run(node: EnemyNode): NodeDamage {
        const calculator: Calculator = new Calculator();
        let result = new NodeDamage();
        let clearers = this.getRealClearers();
        result.damagePerWave = node.waves.map((wave, wIndex) => {
            let waveResult = new WaveDamage();
            let [clearer, ce] = clearers[wIndex];
            waveResult.damagePerEnemy = wave.enemies.map(enemy => {
                let damage = calculator.calculateNpDamage(clearer, ce, enemy, [ this.servantBuffs.buffs[wIndex], this.template.buffs.buffs[wIndex] ]);
                return damage;
            });
            waveResult.damagePerEnemy.forEach((damage, eIndex) => {
                let enemy = wave.enemies[eIndex];
                if (damage.low < enemy.hitPoints) {
                    waveResult.unclearedEnemies += 1;
                    waveResult.leftToFacecard += enemy.hitPoints - damage.low;
                }
            })
            if (waveResult.unclearedEnemies > 0) result.unclearedWaves += 1;
            return waveResult;
        });
        return result;
    }
}

export { Strat, Template, BuffMatrix, NodeDamage, WaveDamage, EnemyNode, Wave };