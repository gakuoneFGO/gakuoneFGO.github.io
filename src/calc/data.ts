import { ServantConfig, Servant, ServantData } from "./servant";
import { Template, BuffMatrix, EnemyNode } from "./strat";
import { ClassConstructor, deserializeArray, serialize, Type } from 'class-transformer';
import { CraftEssence } from "./damage";
import { getVersionNumber, Version } from "../versioning"
import update from "immutability-helper";

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
                0,//data.rarity < 3 ? 9 : 0, //someday we can assume that bronze append skills are unlocked but NA doesn't even have them yet
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
        const data = this.templates.get(name);
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
        const data = new TemplateData(
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

export interface Named { name: string, aliases?: string[] }

export class Persistor<T extends Named> {
    constructor(private readonly type: ClassConstructor<T>, storageKey: string | undefined, staticItems: T[]) {
        if (storageKey) {
            this.storageKey = storageKey;
            const storedItems = deserializeArray(type, localStorage.getItem(storageKey!) ?? "[]");
            this.items = staticItems.concat(storedItems).sort((a, b)=> a.name.localeCompare(b.name));
        } else this.items = staticItems;

        this.map = new Map(this.items.map(item => [item.name, item]));
        this.isAllCustom = staticItems.length == 0;
    }

    private storageKey?: string;
    private items: T[];
    private map: Map<string, T>;
    private isAllCustom: boolean;

    has(name: string): boolean {
        return this.map.has(name);
    }

    get(name: string): T {
        return this.map.get(name) as T;
    }

    getAll(): T[] {
        //assumes that caller will not modify
        return this.items;
    }

    put(item: T) {
        this.map.set(item.name, item);
        this.items = this.items.filter(i => i.name != item.name).concat(item).sort((a, b)=> a.name.localeCompare(b.name));
        this.save(savedItems => savedItems.filter(i => i.name != item.name).concat(item));
    }

    delete(item: T) {
        this.map.delete(item.name);
        this.items = this.items.filter(i => i.name != item.name);
        this.save(savedItems => savedItems.filter(i => i.name != item.name));
    }

    private save(transform: (existing: T[]) => T[]) {
        if (!this.storageKey) {
            throw new Error("Attempted to save state which was not intended to be saved.")
        }

        const existing = deserializeArray(this.type, localStorage.getItem(this.storageKey!) ?? "[]");
        const transformed = transform(existing);
        localStorage.setItem(this.storageKey, serialize(transformed));
    }

    isCustom(item: T) {
        return this.isAllCustom || item.name.startsWith("*");
    }

    getCustomName(item: T) {
        return this.isCustom(item) ? item.name.substring(2) : "";
    }

    asCustom(item: T, name: string): T {
        return update(item as Named, { name: { $set: "* " + name } }) as T;
    }
}

async function load<T extends { name: string }>(sources: { type: ClassConstructor<T>, url?: string, storageKey?: string }): Promise<Persistor<T>> {
    const staticItems = sources.url ?
        fetch(`${sources.url}?v=${appVersion}`).then(resp => resp.text()).then(resp => deserializeArray(sources.type, resp)) :
        Promise.all([]);
    return new Persistor(sources.type, sources.storageKey, await staticItems);
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

export class TemplateData {
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

export const changeLog: Version[] = await fetch("version-history.json", { cache: "no-store" }).then(resp => resp.text()).then(text => JSON.parse(text));
export const appVersion = getVersionNumber(changeLog[changeLog.length - 1]);

export const db: DataProvider = await Promise.all([
    load({ type: ServantData, url: "servants.json" }),
    load({ type: ServantConfig, storageKey: "servants" }),
    load({ type: TemplateData, url: "templates.json", storageKey: "templates" }),
    load({ type: CraftEssence, url: "ces.json", storageKey: "craftEssences" }),
    load({ type: EnemyNode, url: "nodes.json", storageKey: "enemyNodes" }),
]).then(responses => new DataProvider(...responses));