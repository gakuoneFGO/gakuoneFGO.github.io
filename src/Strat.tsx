import { BuffSet, Damage, Calculator, CraftEssence } from "./Damage";
import { Servant } from "./Servant";
import { Enemy } from "./Enemy";

class BuffMatrix {
    constructor(public buffs: BuffSet[]) {}
}

class Template {
    constructor(
        public name: string,
        public buffs: BuffMatrix,
        public party: Servant[],
        public clearers: number[],
        public description: string,
        public instructions: string[]) {}
}

class Wave {
    constructor(readonly enemies: Enemy[]) {}
}

class Node {
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
        public servant: Servant,
        public template: Template,
        public servantBuffs: BuffMatrix,
        public servantCe: CraftEssence,
        public supportCe: CraftEssence) {}

    run(node: Node): NodeDamage {
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
                let damage = calculator.calculateNpDamage(clearer, ce, enemy, this.servantBuffs.buffs.concat(this.template.buffs.buffs));
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

let calculator: Calculator = new Calculator();

export { Strat, Template, BuffMatrix, NodeDamage, WaveDamage };