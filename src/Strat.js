import { Calculator } from "./Damage.js";
class BuffMatrix {
    constructor(buffs) {
        this.buffs = buffs;
    }
}
class Template {
    constructor(name, buffs, party, clearers, description, instructions) {
        this.name = name;
        this.buffs = buffs;
        this.party = party;
        this.clearers = clearers;
        this.description = description;
        this.instructions = instructions;
    }
}
class Wave {
    constructor(enemies) {
        this.enemies = enemies;
    }
}
class Node {
    constructor(waves) {
        this.waves = waves;
    }
}
class WaveDamage {
    constructor(damagePerEnemy = [], unclearedEnemies = 0, leftToFacecard = 0.0) {
        this.damagePerEnemy = damagePerEnemy;
        this.unclearedEnemies = unclearedEnemies;
        this.leftToFacecard = leftToFacecard;
    }
}
class NodeDamage {
    constructor(damagePerWave = [], unclearedWaves = 0) {
        this.damagePerWave = damagePerWave;
        this.unclearedWaves = unclearedWaves;
    }
}
class Strat {
    constructor(servant, template, servantBuffs, servantCe, supportCe) {
        this.servant = servant;
        this.template = template;
        this.servantBuffs = servantBuffs;
        this.servantCe = servantCe;
        this.supportCe = supportCe;
    }
    run(node) {
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
            if (waveResult.unclearedEnemies > 0)
                result.unclearedWaves += 1;
            return waveResult;
        });
        return result;
    }
}
let calculator = new Calculator();
export { Strat, Template, BuffMatrix, NodeDamage, WaveDamage };
//# sourceMappingURL=Strat.js.map