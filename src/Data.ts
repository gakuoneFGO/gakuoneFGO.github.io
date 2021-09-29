import { CardType, GrowthCurve, ServantConfig, Servant, ServantData } from "./Servant";
import { Template, Strat, BuffMatrix, EnemyNode } from "./Strat";
import { ClassConstructor, deserializeArray, Type } from 'class-transformer';
import { CraftEssence, PowerMod } from "./Damage";

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

class DataProvider {
    constructor(
        public readonly servantData: Persistor<ServantData>,
        public readonly servantConfig: Persistor<ServantConfig>,
        public readonly templates: Persistor<TemplateData>,
        public readonly craftEssences: Persistor<CraftEssence>,
        public readonly nodes: Persistor<EnemyNode>) {
        this.defaultServantCache = new Map<string, Servant>();
    }

    private readonly defaultServantCache: Map<string, Servant>;

    getServantDefaults(name: string): Servant {
        //I think caching these helps reduce the amount of pointless rerendering done on the template tab
        if (this.defaultServantCache.has(name)) {
            return this.defaultServantCache.get(name)!;
        }

        const data = this.servantData.get(name);
        const config = this.servantConfig.has(name) ?
            this.servantConfig.get(name) :
            new ServantConfig(
                data.name, Math.max(data.f2pCopies, 1),
                getMaxLevel(data.rarity),
                1000,
                new PowerMod(data.appendTarget, 0.3),//TODO
                data.nps.some(np => np.multUpgrade > 0.0));
        const servant = new Servant(config, data);
        this.defaultServantCache.set(name, servant);
        return servant;
    }

    setServantDefaults(config: ServantConfig) {
        this.servantConfig.put(config);
        this.defaultServantCache.set(config.name, new Servant(
            config,
            this.servantData.get(config.name)
        ));
    }

    getTemplate(name: string): Template {
        let data = this.templates.get(name);
        return new Template(
            data.name,
            data.buffs,
            data.party.map(name => this.getServantDefaults(name), this),
            data.clearers,
            data.description,
            data.instructions
        );
    }

    setTemplate(template: Template) {
        let data = new TemplateData(
            template.name,
            template.buffs,
            template.party.map(servant => servant.data.name),
            template.clearers,
            template.description,
            template.instructions
        );
        this.templates.put(data);
    }
}

class Persistor<T extends { name: string }> {
    constructor(type: ClassConstructor<T>, storageKey: string | undefined, staticItems: T[]) {
        if (storageKey) {
            this.storageKey = storageKey;
            let storedItems = deserializeArray(type, localStorage.getItem(storageKey!) ?? "[]");
            this.items = staticItems.concat(storedItems);
        } else this.items = staticItems;

        this.items = this.items.sort((a, b)=> a.name.localeCompare(b.name));
        this.map = new Map(this.items.map(item => [item.name, item]));
        this.isAllCustom = staticItems.length == 0;
    }

    private storageKey?: string;
    private items: T[];
    private map: Map<string, T>;
    private isAllCustom: boolean;

    get(name: string): T {
        return this.map.get(name) as T;
    }

    has(name: string): boolean {
        return this.map.has(name);
    }

    getAll(): T[] {
        //assumes that caller will not modify
        return this.items;
    }

    put(item: T) {
        if (!this.storageKey) {
            console.log("Invalid call to Persistor.put", item);
            throw new Error("Attempted to save state which was not intended to be saved.")
        }
        this.items = this.items.concat(item).sort((a, b)=> a.name.localeCompare(b.name));//TODO: kinda inefficient, all we need to do is binary search then insert
        this.map.set(item.name, item);
        localStorage.setItem(this.storageKey, JSON.stringify(this.items.filter(this.isCustom, this)));
    }

    isCustom(item: T) {
        return this.isAllCustom || item.name.startsWith("*");
    }
}

async function load<T extends { name: string }>(sources: { type: ClassConstructor<T>, url?: string, storageKey?: string }): Promise<Persistor<T>> {
    let staticItems = sources.url ?
        fetch(sources.url!).then(resp => resp.text()).then(resp => deserializeArray(sources.type, resp)) :
        Promise.all([]);
    const items = await staticItems;
    return new Persistor(sources.type, sources.storageKey, items);
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

var provider: DataProvider;
let promise = Promise.all([
    load({ type: ServantData, url: "servants.json" }),
    load({ type: ServantConfig, storageKey: "servants" }),
    load({ type: TemplateData, url: "templates.json", storageKey: "templates" }),
    load({ type: CraftEssence, url: "ces.json", storageKey: "craftEssences" }),
    load({ type: EnemyNode, url: "nodes.json", storageKey: "enemyNodes" }),
]).then(responses => provider = new DataProvider(...responses));

function useData(): [ DataProvider, Promise<DataProvider> ] {
    return [ provider, promise ];
}

export { useData, Persistor }