import { CardType, GrowthCurve, ServantConfig, Servant, ServantData } from "./Servant";
import { Template, Strat, BuffMatrix } from "./Strat";
import { deserializeArray, Type } from 'class-transformer';
import { PowerMod } from "./Damage";
import { Trait } from "./Enemy";

class Data {
    constructor(
        public servants: Map<string, ServantData>,
        public templates: Map<string, Template>,
        public setups: [ Strat, Node ][]) {}

    getServantDefaults(name: string): Servant {
        let servantData = this.servants.get(name) as ServantData;
        let config = new ServantConfig(
            servantData.name, Math.max(servantData.f2pCopies, 1),
            getMaxLevel(servantData.rarity),
            1000,
            new PowerMod(servantData.appendTarget, 0.3),
            servantData.nps.some(np => np.multUpgrade > 0.0));
        return new Servant(config, servantData);
    }
}

let allData = Promise.all([
    fetch("servants.json"),
    fetch("templates.json"),
].map(p => p.then(resp => resp.text())))
.then(responses => {
    var allData: Data = new Data(new Map(), new Map(), []);
    let servants = deserializeArray(ServantData, responses[0]);
    servants.forEach(servant => {
        allData.servants.set(servant.name, servant);
    });
    let templates = deserializeArray(TemplateData, responses[1]);
    templates.forEach(template => {
        allData.templates.set(template.name, new Template(
            template.name,
            template.buffs,
            template.party.map(name => allData.getServantDefaults(name)),
            template.clearers,
            template.description,
            template.instructions
        ));
    });
    console.log(allData);
    return allData;
});

function getMaxLevel(rarity: number): number {
    switch (rarity) {
        case 1: return 60;
        case 2: return 65;
        case 3: return 70;
        case 4: return 80;
        case 5: return 90;
    }
    return 0;
}

class TemplateData {
    constructor(
        readonly name: string,
        buffs: BuffMatrix,
        readonly party: string[],
        readonly clearers: number[],
        readonly description: string,
        readonly instructions: string[]) {
            this.buffs = buffs;
        }
    
    @Type(() => BuffMatrix)
    readonly buffs: BuffMatrix;
}

export { Data, allData }