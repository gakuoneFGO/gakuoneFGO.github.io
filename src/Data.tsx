import { CardType, GrowthCurve, ServantAttribute, ServantClass, ServantData, Trigger } from "./Servant";
import { Template, Strat } from "./Strat";

class Data {
    constructor(
        public servants: Map<string, ServantData>,
        public templates: Map<string, Template>,
        public setups: [ Strat, Node ][]) {}
}

var allData: Data = new Data(new Map(), new Map(), []);

allData.servants.set("Ereshkigal", tempServantData("Ereshkigal"));
allData.servants.set("<Placeholder>", tempServantData("<Placeholder>"));
allData.servants.set("<Unspecified>", tempServantData("<Unspecified>"));

function tempServantData(name: string): ServantData {
    return new ServantData(
        name,
        5,
        CardType.Buster,
        [ 3.0, 4.0, 4.5, 4.75, 5.0 ],
        1.0,
        new GrowthCurve(new Map([[90, 12000]])),
        ServantClass.Saber,
        ServantAttribute.Earth,
        [ 1.5, 1.5, 1.5, 1.5, 1.5 ],
        Trigger.Never,
        0,
        "https://static.wikia.nocookie.net/fategrandorder/images/b/b8/EreshkigalStage2Icon.png/revision/latest/scale-to-width-down/138?cb=20180618125059",
        "50% on T3",
        ServantClass.Rider
    );
}

export { Data, allData }