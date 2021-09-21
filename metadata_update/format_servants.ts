import * as JSONStream from "JSONStream";
import * as fs from "fs";
import "reflect-metadata";
import { ServantData, GrowthCurve, Trigger, CardType, ServantClass, ServantAttribute } from "../src/Servant"
import update from "immutability-helper";

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
        let npFunc = data.noblePhantasms[0].functions.find(f => f.funcType.startsWith("damageNp"));
        let servant = new ServantData(
            data.name,
            data.collectionNo,
            data.rarity,
            data.noblePhantasms[0].card,
            npFunc
                ? npFunc.svals.map(v => v.Value / v.Rate) 
                : [ 0.0, 0.0, 0.0, 0.0, 0.0 ],
            data.noblePhantasms[0].card == "buster" ? data.noblePhantasms[0].strengthStatus : data.noblePhantasms[0].strengthStatus * 2.0,
            new GrowthCurve(new Map(data.atkGrowth.map((atk: number, i: number) => [ (i + 1).toString(), atk ]))),
            data.className,
            data.attribute,
            getExtraMultiplier(npFunc),
            getExtraTrigger(npFunc),
            0,//TODO: f2pCopies
            data.extraAssets.faces.ascension["1"],
            data.extraAssets.charaGraph.ascension["1"],
            "",//charge profile...
            data.appendPassive[2].skill.functions[0].buffs[0].tvals[0].name
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
        .map(svals => svals[0].Correction / svals[0].Rate);
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
        CardType.Buster,
        [],
        0,
        new GrowthCurve(new Map()),
        ServantClass.Shielder,
        ServantAttribute.Beast,
        [],
        Trigger.Never,
        0,
        "",
        "",
        "",
        Trigger.Shielder
    )
}

function replaceMap(_: any, value: any): any {
    if (value instanceof Map)
        return Object.fromEntries(value.entries());
    return value;
}

export {}