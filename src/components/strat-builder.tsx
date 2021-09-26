import { Box, Grid, Tab } from "@material-ui/core";
import { TabContext, TabList, TabPanel } from "@material-ui/lab";
import React from "react";
import { BuffSet, CraftEssence, getLikelyClassMatchup } from "../Damage";
import { allData } from "../Data";
import { Enemy, EnemyAttribute } from "../Enemy";
import { EnemyBuilder } from "./enemy-builder";
import { OutputPanel } from "./output-panel";
import { BuffMatrix, EnemyNode, Strat, Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { CEBuilder } from "./ce-builder";
import { PartyDisplay } from "./party-display";
import { ServantSelector } from "./servant-selector";
import { TemplateBuilder } from "./template-builder";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { Servant, ServantData } from "../Servant";

interface StratBuilderState {
    readonly strat: Strat;
    readonly selectedTab: string;
}

class StratBuilder extends React.Component<any, StratBuilderState, any> {
    constructor(props: any) {
        super(props);
        this.onServantChanged = this.onServantChanged.bind(this);
    }

    componentDidMount() {
        let component = this;
        allData.then(data => {
            let servant = data.getServantDefaults("Iskandar");
            let template = data.templates.get("Double Oberon + Castoria (0%)") as Template;
            let strat = new Strat(
                servant,
                template,
                defaultBuffsetHeuristic(servant.data, template.party, template.clearers.map(clearers => clearers.includes(0))),
                new CraftEssence("<None>", 0, []),
                new CraftEssence("<None>", 0, []),
                EnemyNode.uniform(new Enemy(getLikelyClassMatchup(servant.data.sClass), EnemyAttribute.Neutral, [], 0.0))
            );
            component.setState({ strat: strat, selectedTab: "servant" });
        });
    }

    render() {
        if (!this.state) return null;
        return (
            <Grid container direction="row-reverse">
                <Grid item lg={4} md={5} sm={12}>
                    <PartyDisplay party={replacePlaceholder(this.state.strat.template.party, this.state.strat.servant)} />
                    <OutputPanel strat={this.state.strat} />
                    <EnemyBuilder value={this.state.strat.node.waves[0].enemies[0]} onChange={enemy => this.handleChange({ strat: { node: { $set: EnemyNode.uniform(enemy) } } })} />
                </Grid>
                <Grid item lg={8} md={7} sm={12}>
                    <TabContext value={this.state.selectedTab}>
                        <Box>
                            <TabList onChange={(_, v) => this.handleChange({ selectedTab: { $set: v } })}>
                                <Tab label="Servant" value="servant" />
                                <Tab label="Party" value="template" />
                                <Tab label="Craft Essence" value="ce" />
                            </TabList>
                        </Box>
                        <TabPanel value="servant">
                            <div>
                                <ServantSelector value={this.state.strat.servant} label="Servant" onChange={(servant: Servant) => this.onServantChanged(servant)} />
                                <BuffMatrixBuilder value={this.state.strat.servantBuffs}
                                    maxPowerMods={2}
                                    onChange={buffs => this.handleChange({ strat: { servantBuffs: { $set: buffs } } })} />
                            </div>
                        </TabPanel>
                        <TabPanel value="template">
                            <TemplateBuilder key={this.state.strat.template.name}
                                value={this.state.strat.template}
                                onChange={(template: Template) => this.handleChange({ strat: { template: { $set: template } } })} />
                        </TabPanel>
                        <TabPanel value="ce">
                            <Grid container>
                                <Grid item md={6} sm={12}>
                                    <CEBuilder value={this.state.strat.servantCe}
                                        onChange={(ce: CraftEssence) => this.handleChange({ strat: { servantCe: { $set: ce } } })} />
                                </Grid>
                                <Grid item md={6} sm={12}>
                                    <CEBuilder value={this.state.strat.supportCe}
                                        onChange={(ce: CraftEssence) => this.handleChange({ strat: { supportCe: { $set: ce } } })} />
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </TabContext>
                </Grid>
            </Grid>
        );
    }

    handleChange(spec: Spec<Readonly<StratBuilderState>, never>) {
        //console.log(spec);
        let state = update(this.state, spec);
        this.setState(state);
    }

    onServantChanged(servant: Servant) {
        if (servant.data.name != this.state.strat.servant.data.name) {
            this.handleChange({ strat: {
                    servant: { $set: servant },
                    servantBuffs: { $set: defaultBuffsetHeuristic(servant.data, this.state.strat.template.party, this.state.strat.template.clearers.map(clearers => clearers.includes(0))) },
                    node: { $set: EnemyNode.uniform(update(this.state.strat.node.waves[0].enemies[0], { eClass: { $set: getLikelyClassMatchup(servant.data.sClass) } })) }
            }});
        } else {
            this.handleChange({ strat: { servant: { $set: servant } } });
        }
    }
}

function defaultBuffsetHeuristic(servant: ServantData, party: Servant[], clearers: boolean[]): BuffMatrix {
    let skillOrder = servant.skills.map(skill => {
        let anySelfBuff = skill.buffs.findIndex(b => b.self) >= 0;
        let turnsToApplyTo = clearers.flatMap((isMain, index) => isMain == anySelfBuff ? [index] : []);
        if (turnsToApplyTo.length == 0) {
            return { buffs: skill.buffs, turn: 0 };
        }
        return { buffs: skill.buffs, turn: turnsToApplyTo.reverse()[0] - Math.min(...skill.buffs.map(b => b.turns)) + 1 };
    }).concat(clearers.map((isMain, turn) => {
        return { buffs: isMain ? servant.np.preBuffs : [], turn: turn };
    })).concat(clearers.map((isMain, turn) => {
        return { buffs: isMain ? servant.np.postBuffs : [], turn: turn + 1 };
    }));

    return new BuffMatrix(clearers.map((isMain, turn) => {
        return BuffSet.fromBuffs(skillOrder.flatMap(order => {
            return order.turn <= turn
                ? order.buffs.filter(b => (isMain && b.self) || (!isMain && b.team)).filter(b => order.turn + b.turns > turn)
                : []
        }).concat(servant.passives.filter(b => (isMain && b.self) || (!isMain && b.team))), servant.np.type)//TODO
    }));
}

function replacePlaceholder(party: Servant[], servant: Servant): Servant[] {
    return party.reduce<Servant[]>((prev: Servant[], cur, i) => cur.data.name == "<Placeholder>" ? update(prev, { [i]: { $set: servant } }) : prev, party);
}

export { StratBuilder }
