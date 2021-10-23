import * as JSONStream from "JSONStream";
import * as fs from "fs";
import "reflect-metadata";
import { ServantData, GrowthCurve, CardType, ServantClass, ServantAttribute, NoblePhantasm, Buff, Skill, BuffType, NPTarget, distinct } from "../src/Servant"
import update from "immutability-helper";
import { Trait } from "../src/Enemy";
import fetch from "node-fetch";
import { SCALE } from "../src/arithmetic";

const U_RATIO = 1 / SCALE;

const enums: any = {};
const enumStream = fs.createReadStream("metadata_update\\enums.json", { encoding: 'utf-8' });
const allPromises = [] as Promise<void>[];
enumStream.pipe(JSONStream.parse([ { emitKey: true } ])).on("data", data => { enums[data.key] = data.value; });
enumStream.on("end", () => {
    const servants = new Map<string, ServantData[]>();
    const stream = fs.createReadStream("metadata_update\\servants_raw.ignored.json", { encoding: 'utf-8' });
    stream.pipe(JSONStream.parse("*")).on("data", data => {
        allPromises.push(mapServant(data).then(servant => {
            if (!servant) return;
            if (!servants.has(servant.name))
                servants.set(servant.name, [ servant ]);
            else
                servants.get(servant.name).push(servant);
            //console.log("done -", data.name);
        }));
    }).on("end", () => {
        Promise.all(allPromises).then(() => {
            let allServants: ServantData[] = [ getDummyServant("<Placeholder>"), getDummyServant("<Unspecified>") ];
            servants.forEach(sArray => {
                const origServant = sArray.reduce((min, cur) => min.id < cur.id ? min : cur);
                allServants = allServants.concat(sArray.map(servant => {
                    if (servant == origServant)
                        return servant;
                    if (servant.sClass != origServant.sClass)
                        //TODO: fold in class name when ends in (Alter)
                        return update(servant, { name: { $set: servant.name + " (" + toNiceClassName(servant.sClass) + ")" } })
                    //just BB and Abby will hit this for now
                    return update(servant, { name: { $set: servant.name + " (Summer)" } });
                }));
            });
            fs.createWriteStream("src\\servants.json", { encoding: "utf-8" }).write(JSON.stringify(allServants.sort((a, b) => a.name.localeCompare(b.name)), replaceMap, 4));
        });
    });
});

async function mapServant(data: any): Promise<ServantData> {
    if (data.type == "enemyCollectionDetail") {
        console.log("Skipping servant named ", data.name, " because type was ", data.type);
        return;
    }
    //console.log(data.name);
    if (data.name == "pasteNameHere") {
        console.log(JSON.stringify(data, undefined, 4));
    }
    const upgradedNps = getUpgraded(data.noblePhantasms, (np1, np2) => np1.card == np2.card);
    const unknownTraits = data.traits.map(t => t.name).filter(t => !allowedTraits.includes(t) && !excludedTraits.includes(t));
    if (unknownTraits.length > 0) {
        console.log("Unknown traits", data.name, unknownTraits);
    }
    const iconPath = `/images/servants/${data.collectionNo}.png`;
    if (!fs.existsSync("src" + iconPath)) {
        console.log("Downloading icon", iconPath);
        const icon = await fetch(data.extraAssets.faces.ascension["1"]);
        icon.body.pipe(fs.createWriteStream("src" + iconPath));
    }
    return new ServantData(
        data.name,
        data.collectionNo,
        data.rarity,
        new GrowthCurve(new Map(data.atkGrowth.map((atk: number, i: number) => [ (i + 1).toString(), atk ]))),
        data.className,
        data.attribute,
        data.traits.map(t => t.name).filter(t => allowedTraits.includes(t)),
        getF2PCopies(data),
        iconPath,
        data.extraAssets.charaGraph.ascension["1"],
        "",//charge profile...
        data.className == "berserker" ? [] : data.appendPassive[2].skill.functions[0].buffs[0].tvals.map(tval => tval.name),
        await getPassives(data, data.noblePhantasms[0].card),
        await getSkills(data, data.noblePhantasms[0].card),
        await Promise.all(upgradedNps.map(np => mapNp(np, getUnupgraded(np, data.noblePhantasms, (np1, np2) => np1.card == np2.card))))
    );
}

const allowedTraits = Object.values(Trait);
const excludedTraits = [
    "unknown",
    "canBeInBattle",
    "basedOnServant",
    "existenceOutsideTheDomain",
    "divineOrDaemonOrUndead",
    "dragonSlayer",
    "genderCaenisServant",
    "atalante",
    "demonBeast",
    "fairyTaleServant",
];

async function mapNp(np: any, unupgraded: any): Promise<NoblePhantasm> {
    const npFuncIndex = np.functions.findIndex(f => f.funcType.startsWith("damageNp"));
    const npFunc = np.functions[npFuncIndex];
    const npFuncUnupgraded = unupgraded.functions.find(f => f.funcType.startsWith("damageNp"));
    const preBuffs: Buff[][] = await Promise.all(np.functions.filter((_, i) => i < npFuncIndex).map(toBuff));
    const postBuffs: Buff[][] = await Promise.all(np.functions.filter((_, i) => i > npFuncIndex).map(toBuff));

    return new NoblePhantasm(
        np.card,
        getNpTarget(npFunc),
        npFuncUnupgraded
            ? npFuncUnupgraded.svals.map(v => v.Value * U_RATIO) 
            : [ 0, 0, 0, 0, 0 ],
        npFunc ? npFunc.svals[0].Value * U_RATIO - npFuncUnupgraded.svals[0].Value * U_RATIO : 0,
        getExtraMultiplier(npFunc),
        getExtraTrigger(npFunc),
        doesExtraDamageStack(npFunc),
        np.npGain.np[0] / 100,
        np.npDistribution.map(hit => hit / 100),
        preBuffs.flat(1),
        postBuffs.flat(1)
            .map((b: Buff) => update(b, { turns: { $set: b.turns - 1 } }))
            .filter(b => b.turns > 0)
    );
}

function getNpTarget(func: any): NPTarget {
    if (!func) return "none";
    switch (func.funcTargetType) {
        case "enemyAll": return "aoe";
        case "enemy": return "st";
        default:
            console.log("Unknown NP target", func.funcTargetType);
            return "none";
    }
}

function getExtraMultiplier(npFunc: any): number[] {
    if (!npFunc || !npFunc.svals[0].Correction) return [1.0, 1.0, 1.0, 1.0, 1.0 ];
    return [ npFunc.svals, npFunc.svals2, npFunc.svals3, npFunc.svals4, npFunc.svals5 ]
        .map(svals => svals[0].Correction * U_RATIO);
}

function getExtraTrigger(npFunc: any): Trait[] {
    if (!npFunc || !npFunc.svals[0].Target) return [];
    return npFunc.svals[0].TargetList ?
        npFunc.svals[0].TargetList.map(target => enums.Trait[target]) :
        [enums.Trait[npFunc.svals[0].Target]];
}

function doesExtraDamageStack(npFunc: any): boolean {
    return npFunc && npFunc.svals[0].Correction && npFunc.svals[0].Correction * U_RATIO < 1;
}

function toNiceClassName(className: string): string {
    return className.substring(0, 1).toUpperCase() + className.substring(1);
}

function getDummyServant(name: string): ServantData {
    return new ServantData(
        name,
        0,
        0,
        new GrowthCurve(new Map()),
        ServantClass.Shielder,
        ServantAttribute.Beast,
        [],
        0,
        "images/servants/select.png",
        "",
        "",
        [],
        [],
        [],
        []
    );
}

function replaceMap(_: any, value: any): any {
    if (value instanceof Map)
        return Object.fromEntries(value.entries());
    return value;
}

async function getSkills(data: any, npType: CardType): Promise<Skill[]> {
    return Promise.all(getUpgraded(data.skills, (s1, s2) => s1.num == s2.num).map(s => getSkill(s, npType)));
}

async function getSkill(skill: any, npType: CardType): Promise<Skill> {
    const buffs: Buff[][] = await Promise.all(skill.functions.map(toBuff));
    return new Skill(skill.coolDown[skill.coolDown.length - 1], buffs.flat(1).filter(buff => isUseful(buff, npType)))
}

function getUpgraded(array: any[], areSame: (item1: any, item2:any) => boolean): any[] {
    return array.filter(item => !array.some(other => areSame(item, other) && other.condQuestId > item.condQuestId));
}

function getUnupgraded(upgraded: any, array: any[], areSame: (item1: any, item2:any) => boolean): any {
    return array.find(item => areSame(item, upgraded) && !array.some(other => areSame(item, other) && other.condQuestId < item.condQuestId));
}

async function getPassives(data: any, npType: CardType): Promise<Buff[]> {
    const buffs: Buff[][] = await Promise.all(data.classPassive.flatMap(p => p.functions).map(toBuff));
    return buffs.flat(1).filter(buff => buff.type != BuffType.CardTypeUp || isUseful(buff, npType));
}

async function toBuff(func: any): Promise<Buff[]> {
    if (func.buffs == undefined) console.log(func);
    if (func.buffs.length < 1) {
        return [];
    }

    if (func.buffs.length > 1) {
        console.log("Wrong number of buffs", func);
        return [];
    }

    var self: boolean;
    var team: boolean;
    switch (func.funcTargetType) {
        case "enemy":
        case "enemyAll":
            return debuffToBuff(func);
        case "self":
        case "ptOne"://misses cases where there is a targeted buff useful only for the secondary clearer but I don't think such a skill exists (except chen gong but no one uses that guy)
            self = true;
            team = false;
            break;
        case "ptAll":
        case "ptFull":
            self = true;
            team = true;
            break;
        case "ptOther":
        case "ptOtherFull":
            self = false;
            team = true;
            break;
        case "commandTypeSelfTreasureDevice":
            return [];
        default:
            console.log("Unknown target type", func.funcTargetType);
            break;
    }

    switch (func.buffs[0].type) {
        //TODO: check how conditional buffs like liz work. (not sure I wanna bother though? none of them apply to arash/oberon/gong anyway)
        //TODO: figure out how to filter stuff like zerkersashi's power mod
        case "upAtk":
            return [ new Buff(self, team, BuffType.AttackUp, getBuffValue(func), getBuffTurns(func)) ];
        case "downAtk":
            return [ new Buff(self, team, BuffType.AttackUp, getBuffValue(func) * -1, getBuffTurns(func)) ];
        case "upCommandall":
            return [ new Buff(self, team, BuffType.CardTypeUp, getBuffValue(func), getBuffTurns(func), getCardType(func.buffs[0].ckSelfIndv[0].name)) ];
        case "upNpdamage":
            return [ new Buff(self, team, BuffType.NpDmgUp, getBuffValue(func), getBuffTurns(func)) ];
        case "downNpdamage":
            return [ new Buff(self, team, BuffType.NpDmgUp, getBuffValue(func) * -1, getBuffTurns(func)) ];
        case "upDamage":
        case "upDamageIndividualityActiveonly":
            if (func.buffs[0].tvals.length == 0) {
                console.log("Missing power mod trigger", func.buffs[0]);
                return [ new Buff(self, team, BuffType.PowerMod, getBuffValue(func), getBuffTurns(func), undefined, []) ];
            } else if (func.buffs[0].tvals.some(tval => allowedTraits.includes(tval))) {
                console.log("Unknown power mod trigger", func.buffs[0]);
            }
            return [ new Buff(self, team, BuffType.PowerMod, getBuffValue(func), getBuffTurns(func), undefined, func.buffs[0].tvals.map(tval => tval.name)) ];
        case "buffRate":
            //this is coded as "increase effects of this specific buff type" rather than against NP damage specifically, but hopefully they just don't add it for another buff type
            return [ new Buff(self, team, BuffType.NpBoost, getBuffValue(func), getBuffTurns(func)) ];
        case "upChagetd":
            return [ new Buff(self, team, BuffType.Overcharge, getBuffValue(func, 1), getBuffTurns(func, true)) ];
        case "delayFunction":
        case "selfturnendFunction":
            const delayedFunc = await lookUpSkill(getBuffValue(func) / U_RATIO);
            //console.log(delayedFunc);
            //TODO: this applies everything immediately, which may be fine for most skills but is not fine for NP effects (are there any relevant ones?)
            const buffs: Buff[][] = await Promise.all(delayedFunc.functions.map(toBuff));
            return buffs.flat(1);
        case "addDamage":
            return [ new Buff(self, team, BuffType.DamagePlus, getBuffValue(func) / U_RATIO, getBuffTurns(func)) ];
        case "upDropnp":
            return [ new Buff(self, team, BuffType.NpGain, getBuffValue(func), getBuffTurns(func)) ];
        case "overwriteClassRelation":
            //I hardcoded this for kiara and kama (can't turn kama's off but there's not really a use for that). if they add more servants that screw with the class triangle we can handle it then
        case "upCommandatk": //TODO: handle this if it comes up for any new servants
        case "avoidState":
        case "regainStar":
        case "upStarweight":
        case "downStarweight":
        case "downCriticalStarDamageTaken":
        case "downCriticalRateDamageTaken":
        case "upTolerance":
        case "downTolerance":
        case "upToleranceSubstate":
        case "upGrantstate":
        case "downGrantstate":
        case "upDefence":
        case "downDefence":
        case "upDefencecommandall":
        case "upSpecialdefence":
        case "avoidance":
        case "invincible":
        case "specialInvincible":
        case "guts":
        case "gutsRatio":
        case "gutsFunction":
        case "upGrantInstantdeath":
        case "upResistInstantdeath":
        case "upNonresistInstantdeath":
        case "avoidInstantdeath":
        case "breakAvoidance":
        case "pierceInvincible":
        case "pierceDefence":
        case "upCriticaldamage":
        case "upCriticalrate":
        case "downCriticalrate":
        case "upCriticalpoint":
        case "downCriticalpoint":
        case "multiattack":
        case "subSelfdamage":
        case "preventDeathByDamage":
        case "regainNp":
        case "upDamagedropnp":
        case "attackFunction"://TODO: might be relevant
        case "commandattackFunction":
        case "commandattackBeforeFunction":
        case "npattackPrevBuff":
        case "damageFunction":
        case "changeCommandCardType":
        case "skillRankUp":
        case "donotAct":
        case "donotSkill":
        case "donotSelectCommandcard":
        case "donotNoble":
        case "donotNobleCondMismatch":
        case "donotReplace":
        case "fixCommandcard":
        case "upGainHp":
        case "upGivegainHp":
        case "addMaxhp":
        case "subMaxhp":
        case "upHate":
        case "upFuncHpReduce":
        case "regainHp":
        case "reduceHp":
        case "deadFunction":
        case "addIndividuality"://TODO: what is this
        case "fieldIndividuality"://do you want to go so far as to know who can change field type to proc their own buffs? nope
        case "reflectionFunction":
            return [];
        default:
            console.log("Unknown buff type", func.buffs[0]);
            return [];
    }
}

async function lookUpSkill(id: number): Promise<any> {
    return await fetch(`https://api.atlasacademy.io/nice/JP/skill/${id}`, undefined).then(resp => resp.text()).then(raw => JSON.parse(raw));
}

function debuffToBuff(func: any): Buff[] {
    //model debuffs as single turn team buffs for now
    //this winds up being optimistic about single target buffs, but 90% of the time you are just trying to clear the biggest enemy in the wave anyway
    //I have one idea of a UI for this which doesn't just add a debuff control to the enemies tab ("debuff" tab which generates a trait you can apply to enemies)
    //...and some variations on that idea...
    //  (e.g. drag and drop the debuff onto the enemy you want to apply it to, instead of generating a trait)
    //  (e.g. put the debuff control below the buff matrix, which selects an enemy by default but can be changed with a dropdown)
    //...but there's nothing worth implementing. damage and refund are broken down per enemy already, so nothing I can add would be substantially easier than just "turn the buff on then off while using your eyes and brain"
    let debuffs: Buff[] = [];
    switch (func.buffs[0].type) {
        case "downDefence":
            debuffs = [ new Buff(true, true, BuffType.AttackUp, getBuffValue(func), 1) ];
            break;
        case "downDefencecommandall":
            debuffs = [ new Buff(true, true, BuffType.CardTypeUp, getBuffValue(func), 1, getCardType(func.buffs[0].ckOpIndv[0].name)) ];
            break;
        case "addIndividuality":
            debuffs = [ new Buff(true, true, BuffType.AddTrait, canMiss(func) ? 0 : 1, 1, undefined, enums.Trait[func.svals[0].Value]) ];
            break;
        case "addSelfdamage":
            debuffs = [ new Buff(true, true, BuffType.DamagePlus, getBuffValue(func) / U_RATIO, 1) ];
            break;
        case "donotAct":
        case "reduceHp":
        case "donotSkill":
        case "donotNoble":
        case "avoidState":
        case "invincible":
        case "upFuncHpReduce":
        case "downGainHp":
        case "downCriticalpoint":
        case "downCriticalrate":
        case "downCriticaldamage":
        case "upNonresistInstantdeath":
        case "downAtk":
        case "upAtk":
        case "downNpdamage":
        case "downTolerance":
        case "upTolerance":
        case "downDropnp":
        case "upHate":
        case "delayFunction":
        case "selfturnendFunction":
            debuffs = [];
            break;
        default:
            console.log("Unknown debuff type", func.buffs[0]);
            debuffs = [];
            break;
    }

    const statuses = func.buffs[0].vals.map(val => val.name).filter(name => allowedTraits.includes(name));
    return statuses.length > 0 ?
        debuffs.concat([ new Buff(true, true, BuffType.AddTrait, canMiss(func) ? 0 : 1, 1, undefined, distinct(statuses)) ]) :
        debuffs;
}

function canMiss(func: any): boolean {
    return func.svals[func.svals.length - 1].Rate * U_RATIO < 1;
}

function getBuffValue(func: any, buffRatio?: number): number {
    return !canMiss(func) ? func.svals[func.svals.length - 1].Value * (buffRatio ?? U_RATIO) : 0;
}

function getBuffTurns(func: any, useTurns?: true | undefined): number {
    const turns = func.svals[func.svals.length - 1].Turn;
    const count = func.svals[func.svals.length - 1].Count;
    if (turns < 0) return count;
    if (useTurns || count < 0) return turns;
    return Math.min(turns, count);
}

function getCardType(name: string): CardType {
    switch (name) {
        case "cardArts":
            return CardType.Arts;
        case "cardBuster":
            return CardType.Buster;
        case "cardQuick":
            return CardType.Quick;
    }
}

function isUseful(buff: Buff, npType: CardType): boolean {
    switch (buff.type) {
        case BuffType.CardTypeUp:
            return buff.val > 0 && (buff.team || npType == buff.cardType)
        case BuffType.NpGain:
            return buff.val > 0 && (buff.team || npType != CardType.Buster)
        default:
            return buff.val > 0;;
    }
}

//doesn't actually return f2p copies but as "default NP level" this is reasonable
function getF2PCopies(data: any): number {
    if (["Altria Pendragon (Lily)", "Habetrot"].includes(data.name)) return 5;

    switch (data.rarity) {
        case 1:
        case 2:
        case 3: return 5; //not true but w/e
        case 5: return 0;
        case 4: return data.ascensionMaterials["3"].items.length <= 1 ? 5 : 0;
    }
}

export {}