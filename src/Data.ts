import { CardType, GrowthCurve, ServantConfig, Servant, ServantData, Trigger } from "./Servant";
import { Template, Strat, BuffMatrix } from "./Strat";
import { deserializeArray } from 'class-transformer';
import { PowerMod } from "./Damage";

class Data {
    constructor(
        public servants: Map<string, ServantData>,
        public templates: Map<string, Template>,
        public setups: [ Strat, Node ][]) {}
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
            template.party.map(name => getServantDefaultsFromData(name, allData)),
            template.clearers,
            template.description,
            template.instructions
        ));
    });
    console.log(allData);
    return allData;
});

function getServantDefaultsFromData(name: string, data: Data): Servant {
    let servantData = data.servants.get(name) as ServantData;
    let config = new ServantConfig(servantData.name, Math.max(servantData.f2pCopies, 1), getMaxLevel(servantData.rarity), 1000, new PowerMod((servantData.appendTarget as string) as Trigger, 0.3), servantData.npUpgrade > 0.0);
    return new Servant(config, servantData);
}

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
        readonly buffs: BuffMatrix,
        readonly party: string[],
        readonly clearers: number[][],
        readonly description: string,
        readonly instructions: string[]) {}
}

export { Data, allData }