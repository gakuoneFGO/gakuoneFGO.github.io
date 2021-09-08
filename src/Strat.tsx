import { BuffSet, Damage, Calculator, CraftEssence } from "./Damage";
import { Servant } from "./Servant";
import { Enemy } from "./Enemy";

class BuffMatrix {
    constructor(readonly buffs: BuffSet[]) {}

    static create(size: number): BuffMatrix {
        let buffs = new Array<BuffSet>(size);
        buffs.fill(BuffSet.empty());
        return new BuffMatrix(buffs);
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
    constructor(readonly waves: Wave[]) {}
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

    run(node: EnemyNode): NodeDamage {
        const calculator: Calculator = new Calculator();
        let result = new NodeDamage();
        result.damagePerWave = node.waves.map((wave, wIndex) => {
            let waveResult = new WaveDamage();
            var clearer = this.template.party[this.template.clearers[wIndex]];
            var ce = this.supportCe;
            if (clearer.data.name == "<Placeholder>") {
                clearer = this.servant;
                ce = this.servantCe;
            }
            waveResult.damagePerEnemy = wave.enemies.map(enemy => {
                let damage = calculator.calculateNpDamage(clearer, ce, enemy, [ this.servantBuffs.buffs[wIndex], this.template.buffs.buffs[wIndex] ]);
                if (damage.low < enemy.hitPoints) {
                    waveResult.unclearedEnemies += 1;
                    waveResult.leftToFacecard += enemy.hitPoints - damage.low;
                }
                return damage;
            });
            if (waveResult.unclearedEnemies > 0) result.unclearedWaves += 1;
            return waveResult;
        });
        return result;
    }
}

export { Strat, Template, BuffMatrix, NodeDamage, WaveDamage, EnemyNode, Wave };