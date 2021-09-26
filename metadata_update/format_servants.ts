import * as JSONStream from "JSONStream";
import * as fs from "fs";
import "reflect-metadata";
import { ServantData, GrowthCurve, Trigger, CardType, ServantClass, ServantAttribute, NoblePhantasm, Buff, Skill, BuffType } from "../src/Servant"
import update from "immutability-helper";

const U_RATIO = 0.001;

let enums: any = {};
let enumStream = fs.createReadStream("metadata_update\\enums.json", { encoding: 'utf-8' });
enumStream.pipe(JSONStream.parse([ { emitKey: true } ])).on("data", data => { enums[data.key] = data.value; });
enumStream.on("end", () => {
    let servants = new Map<string, ServantData[]>();
    let stream = fs.createReadStream("metadata_update\\servants_raw.json", { encoding: 'utf-8' });
    stream.pipe(JSONStream.parse("*")).on("data", data => {
        if (data.type == "enemyCollectionDetail") {
            console.log("Skipping servant named ", data.name, " because type was ", data.type);
            return;
        }
        //console.log(data.name);
        let npFuncFirst = data.noblePhantasms[0].functions.find(f => f.funcType.startsWith("damageNp"));
        let npFuncLastIndex = data.noblePhantasms[data.noblePhantasms.length - 1].functions.findIndex(f => f.funcType.startsWith("damageNp"));
        let npFuncLast = data.noblePhantasms[data.noblePhantasms.length - 1].functions[npFuncLastIndex];
        let servant = new ServantData(
            data.name,
            data.collectionNo,
            data.rarity,
            new GrowthCurve(new Map(data.atkGrowth.map((atk: number, i: number) => [ (i + 1).toString(), atk ]))),
            data.className,
            data.attribute,
            0,//TODO: f2pCopies. most you can get from rarity + ascension mat list. the few 3* and 4* exceptions can be handled manually (even though application logic will probably just assume that you have any 3* you are using at NP5)
            data.extraAssets.faces.ascension["1"],
            data.extraAssets.charaGraph.ascension["1"],
            "",//charge profile...
            data.appendPassive[2].skill.functions[0].buffs[0].tvals[0].name,
            getPassives(data, data.noblePhantasms[0].card),
            getSkills(data, data.noblePhantasms[0].card),
            new NoblePhantasm(
                data.noblePhantasms[0].card,
                npFuncFirst
                    ? npFuncFirst.svals.map(v => v.Value * U_RATIO) 
                    : [ 0, 0, 0, 0, 0 ],
                    npFuncFirst && data.noblePhantasms[0].strengthStatus ? (npFuncLast.svals[0].Value * U_RATIO - npFuncFirst.svals[0].Value * U_RATIO) : 0,
                    getExtraMultiplier(npFuncLast),
                    getExtraTrigger(npFuncLast),
                    data.noblePhantasms[data.noblePhantasms.length - 1].functions.filter((_, i) => i < npFuncLastIndex).flatMap(toBuff),
                    data.noblePhantasms[data.noblePhantasms.length - 1].functions.filter((_, i) => i > npFuncLastIndex).flatMap(toBuff)
                        .map((b: Buff) => update(b, { turns: { $set: b.turns - 1 } }))
                        .filter(b => b.turns > 0)
            )
        );
        //console.log(servant);
        if (!servants.has(servant.name))
            servants.set(servant.name, [ servant ]);
        else
            servants.get(servant.name).push(servant);
    }).on("end", () => {
        var allServants: ServantData[] = [ getDummyServant("<Placeholder>"), getDummyServant("<Unspecified>") ];
        servants.forEach(sArray => {
            let origServant = sArray.reduce((min, cur) => min.id < cur.id ? min : cur);
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
        fs.createWriteStream("src\\servants.json", { encoding: "utf-8" }).write(JSON.stringify(allServants, replaceMap, 4));
    });
});

function getExtraMultiplier(npFunc: any): number[] {
    if (!npFunc || !npFunc.svals[0].Correction) return [1.0, 1.0, 1.0, 1.0, 1.0 ];
    return [ npFunc.svals, npFunc.svals2, npFunc.svals3, npFunc.svals4, npFunc.svals5 ]
        .map(svals => svals[0].Correction * U_RATIO);
}

function getExtraTrigger(npFunc: any): Trigger {
    if (!npFunc || !npFunc.svals[0].Target) return Trigger.Never;
    return enums.Trait[npFunc.svals[0].Target] as Trigger;
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
        0,
        "",//TODO: find good icons
        "",//TODO: find good cards
        "",
        Trigger.Shielder,
        [],
        [],
        new NoblePhantasm(CardType.Buster, [], 0, [], Trigger.Never, [], [])
    );
}

function replaceMap(_: any, value: any): any {
    if (value instanceof Map)
        return Object.fromEntries(value.entries());
    return value;
}

/*

EFFECT TYPES (each has a skill flavor and an on-NP flavor)
    team buff (1T - 3T)
    self buff (1T - 3T)
    debuff (treat as 1T team buff; can reasonably apply to whole wave since 95% of the time you are just trying to get enough damage to kill the chunkiest enemy)
    buffs with "X times" can just be modeled as X turns (take the max of the actual turn limit)
        main problem is morgan's NP. we already need to handle NP effects after damage like eresh, but 
    optimize T3 by default
    track CDs so that we know what gets popped twice if vitch is in the party (mostly affects ishtar, melusine, oberon, cas cu)

EXCEPTIONS
    summer kama, grand boring, robin (checkbox for enabling supereffective damage, usually hidden. this applies a stack of the extraTrigger trait)
        romulus needs special stacking logic. also need to fix his NP import, it's messed up atm. same with kagekiyo
        paris is similar but it's very not straightforward to figure out if hers can apply
    arjuna alter (import power mod as "always")
    ishtar (restrict mana burst to T2+? this is so niche that it doesn't feel like it's worth implementing)
    melusine...
        double vitch => third skill only once
        single vitch => no third skill
        arash strat => third skill available again
    oberon
        just always limit third skill to T3

*/

function getSkills(data: any, npType: CardType): Skill[] {
    console.log(data.name);
    return data.skills.filter((s, _, arr) => arr.findIndex(o => o.num == s.num && o.strengthStatus > s.strengthStatus) < 0)
        .map(s => new Skill(s.coolDown[s.coolDown.length - 1], s.functions.flatMap(toBuff).filter(buff => isUseful(buff, npType))));
}

function getPassives(data: any, npType: CardType): Buff[] {
    //console.log(data.name);
    return data.classPassive.flatMap(p => p.functions)
        .flatMap(toBuff)
        .filter(buff => buff.type != BuffType.CardTypeUp || isUseful(buff, npType));
}

function toBuff(func: any): Buff[] {
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
        case "ptOne"://misses cases where there is a targeted buff useful only for the secondary clearer but I don't think such a skill exists
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
        //TODO: check how conditional buffs like liz work. (not sure I wanna bother though? none of them apply to arash/oberon anyway)
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
            if (func.buffs[0].tvals.length == 0) {
                console.log("Missing power mod trigger", func.buffs[0]);
                return [ new Buff(self, team, BuffType.PowerMod, getBuffValue(func), getBuffTurns(func), undefined, Trigger.Never) ];
            }
            return [ new Buff(self, team, BuffType.PowerMod, getBuffValue(func), getBuffTurns(func), undefined, func.buffs[0].tvals[0].name) ];
        case "upDamageIndividualityActiveonly":
            //hack
            return [ new Buff(self, team, BuffType.PowerMod, getBuffValue(func), getBuffTurns(func), undefined, Trigger.Always) ];
        case "buffRate":
            //TODO: this is coded as "increase effects of this specific buff type" rather than against NP damage specifically
            //console.log("UpBuffRateBuffIndiv", func.buffs[0].script.UpBuffRateBuffIndiv);
            return [ new Buff(self, team, BuffType.NpBoost, getBuffValue(func), getBuffTurns(func)) ];
        case "upChagetd":
            return [ new Buff(self, team, BuffType.Overcharge, getBuffValue(func), getBuffTurns(func)) ];
        case "overwriteClassRelation":
            //TODO: I had no idea kiara had this, wtf. well we needed to do this for kama anyway
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
        case "addDamage"://TODO: flat damage
        case "multiattack":
        case "subSelfdamage":
        case "preventDeathByDamage":
        case "regainNp":
        case "upDropnp":
        case "upDamagedropnp":
        case "attackFunction"://TODO: might be relevant
        case "commandattackFunction":
        case "commandattackBeforeFunction":
        case "npattackPrevBuff":
        case "damageFunction":
        case "changeCommandCardType":
        case "donotAct":
        case "donotSkill":
        case "donotSelectCommandcard":
        case "donotNoble":
        case "donotNobleCondMismatch":
        case "fixCommandcard":
        case "upGainHp":
        case "upGivegainHp":
        case "addMaxhp":
        case "subMaxhp":
        case "upHate":
        case "upFuncHpReduce":
        case "regainHp":
        case "reduceHp":
        case "delayFunction"://TODO: not sure how this is wired up
        case "selfturnendFunction"://TODO: not sure how this is wired up
        case "deadFunction":
        case "addIndividuality"://TODO: what is this
        case "fieldIndividuality"://TODO: do you want to go so far as to know who can change field type to proc their own buffs?
        case "reflectionFunction":
            return [];
        default:
            console.log("Unknown buff type", func.buffs[0]);
            return [];
    }
}

function debuffToBuff(func: any): Buff[] {
    //model debuffs as single turn team buffs for now
    //this winds up being optimistic about single target buffs, but 90% of the time you are just trying to clear the biggest enemy in the wave anywayh
    //TODO: need to fix this sooner rather than later so that it shows up correctly when looking at specific nodes
    switch (func.buffs[0].type) {
        case "downDefence":
            return [ new Buff(true, true, BuffType.AttackUp, getBuffValue(func), 1) ];
        case "downDefencecommandall":
            return [ new Buff(true, true, BuffType.CardTypeUp, getBuffValue(func), 1, getCardType(func.buffs[0].ckOpIndv[0].name)) ];
        case "donotAct":
        case "donotSkill":
        case "donotNoble":
        case "avoidState":
        case "invincible":
        case "reduceHp"://TODO: curse/poison/burn
        case "addSelfdamage":
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
        case "addIndividuality"://TODO: actually matters for romulus. fix then use the same approach for summer kama (maybe not paris)
            return [];
        default:
            console.log("Unknown debuff type", func.buffs[0]);
            return [];
    }
}

function getBuffValue(func: any): number {
    return func.svals[func.svals.length - 1].Rate * U_RATIO >= 1 ? func.svals[func.svals.length - 1].Value * U_RATIO : 0;
}

function getBuffTurns(func: any): number {
    let turns = func.svals[func.svals.length - 1].Turn;
    let count = func.svals[func.svals.length - 1].Count;
    if (turns < 0) return count;
    if (count < 0) return turns;
    return Math.min(turns, count);//TODO: edge case of 1 time, 3 turns. only affects team buffs (morgan) and NP buffs after damage (morgan)
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
        case BuffType.AttackUp:
        case BuffType.NpDmgUp:
        case BuffType.PowerMod:
        case BuffType.Overcharge:
        case BuffType.NpBoost:
            return buff.val > 0;
        case BuffType.CardTypeUp:
            return buff.val > 0 && (buff.team || buff.cardType == npType);
    }
}

export {}