import { Box, Grid, Stack, Tab } from "@mui/material";
import React from "react";
import { BuffSet, CraftEssence, getLikelyClassMatchup } from "../Damage";
import { allData } from "../Data";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyBuilder, NodeBuilder, nodeMap } from "./enemy-builder";
import { NodeOutputPanel, OutputPanel } from "./output-panel";
import { BuffMatrix, EnemyNode, Strat, Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { CEBuilder } from "./ce-builder";
import { PartyDisplay } from "./party-display";
import { ServantSelector } from "./servant-selector";
import { TemplateBuilder } from "./template-builder";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { NoblePhantasm, Servant, ServantData } from "../Servant";
import { TabContext, TabList, TabPanel } from "@mui/lab";

interface StratBuilderState {
    readonly strat: Strat;
    readonly basicEnemy: Enemy;
    readonly advancedNode: EnemyNode;
    readonly selectedTab: string;
    readonly selectedOutput: string;
}

class StratBuilder extends React.Component<any, StratBuilderState, any> {
    constructor(props: any) {
        super(props);
        this.onServantChanged = this.onServantChanged.bind(this);
        this.onTemplateChanged = this.onTemplateChanged.bind(this);
    }

    componentDidMount() {
        let component = this;
        allData.then(data => {
            let servant = data.getServantDefaults("Iskandar");
            let template = data.templates.get("Double Oberon + Castoria (0%)") as Template;
            var strat = new Strat(
                servant,
                template,
                template.buffs,
                new CraftEssence("<None>", 0, []),
                new CraftEssence("<None>", 0, []),
            );
            component.setState({
                strat: defaultBuffsetHeuristic(strat, 0),
                basicEnemy: new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0.0).changeClass(getLikelyClassMatchup(servant.data.sClass)),
                advancedNode: nodeMap.get("[LANCERS] Nursemas Band-aid Farming") as EnemyNode,
                selectedTab: "servant",
                selectedOutput: "basic"
            });
        });
    }

    render() {
        if (!this.state) return null;
        return (
            <Grid container direction="row-reverse">
                <Grid item lg={4} md={5} sm={12}>
                    <PartyDisplay party={this.state.strat.getRealParty().map(s => s[0])} />
                    <TabContext value={this.state.selectedOutput}>
                        <Box>
                            <TabList onChange={(_, v) => this.handleChange({ selectedOutput: { $set: v } })}>
                                <Tab label="Basic" value="basic" />
                                <Tab label="Advanced" value="advanced" />
                            </TabList>
                        </Box>
                        <TabPanel value="basic">
                            <Stack spacing={2}>
                                <OutputPanel strat={this.state.strat} enemy={this.state.basicEnemy} />
                                <EnemyBuilder value={this.state.basicEnemy} onChange={enemy => this.handleChange({ basicEnemy: { $set: enemy } } )} />
                            </Stack>
                        </TabPanel>
                        <TabPanel value="advanced">
                            <NodeOutputPanel strat={this.state.strat} node={this.state.advancedNode} />
                        </TabPanel>
                    </TabContext>
                </Grid>
                <Grid item lg={8} md={7} sm={12}>
                    <TabContext value={this.state.selectedTab}>
                        <Box>
                            <TabList onChange={(_, v) => this.handleChange({ selectedTab: { $set: v } })}>
                                <Tab label="Servant" value="servant" />
                                <Tab label="Party" value="template" />
                                <Tab label="Craft Essence" value="ce" />
                                <Tab label="Node" value="node" />
                            </TabList>
                        </Box>
                        <TabPanel value="servant">
                            <Box>
                                <ServantSelector value={this.state.strat.servant} label="Servant" onChange={(servant: Servant) => this.onServantChanged(servant)} />
                                <BuffMatrixBuilder value={this.state.strat.servantBuffs}
                                    maxPowerMods={2}
                                    onChange={buffs => this.handleChange({ strat: { servantBuffs: { $set: buffs }, template: { buffs: { $set: this.state.strat.template.buffs.syncNpCard(buffs) } } } })}
                                    servants={[this.state.strat.servant]}
                                    warnOtherNp
                                    clearers={this.state.strat.getRealClearers().map(c => c[0])} />
                            </Box>
                        </TabPanel>
                        <TabPanel value="template">
                            <TemplateBuilder key={this.state.strat.template.name}
                                value={this.state.strat.template}
                                onChange={this.onTemplateChanged} />
                        </TabPanel>
                        <TabPanel value="ce">
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={12} lg={6}>
                                    <CEBuilder label="Servant CE"
                                        value={this.state.strat.servantCe}
                                        onChange={(ce: CraftEssence) => this.handleChange({ strat: { servantCe: { $set: ce } } })} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={12} lg={6}>
                                    <CEBuilder label="Support CE"
                                        value={this.state.strat.supportCe}
                                        onChange={(ce: CraftEssence) => this.handleChange({ strat: { supportCe: { $set: ce } } })} />
                                </Grid>
                            </Grid>
                        </TabPanel>
                        <TabPanel value="node">
                            <Box>
                                <NodeBuilder value={this.state.advancedNode} onChange={node => this.handleChange({ advancedNode: { $set: node } })} />
                            </Box>
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
            let strat = update(this.state.strat, { servant: { $set: servant } });
            this.handleChange({
                strat: { $set: defaultBuffsetHeuristic(strat, strat.template.party.findIndex(s => s.data.name == "<Placeholder>")) },
                basicEnemy: { $set: this.state.basicEnemy.changeClass(getLikelyClassMatchup(servant.data.sClass)) }
            });
        } else {
            this.handleChange({ strat: { servant: { $set: servant } } });
        }
    }

    onTemplateChanged(template: Template) {
        var strat = update(this.state.strat, { template: { $set: template } });
        let clearers = strat.getRealClearers();
        template.buffs.buffs.forEach((buff, turn) => {
            let clearerData = clearers[turn][0].data;
            if (!buff.npCard || !clearerData.getNP(buff.npCard))
                strat = update(strat, { template: { buffs: { buffs: { [turn]: { npCard: { $set: clearerData.getNP().cardType } } } } } });
        });
        strat = update(strat, { servantBuffs: { $set: this.state.strat.servantBuffs.syncNpCard(strat.template.buffs) } });
        this.handleChange({ strat: { $set: strat } });
    }
}

function defaultBuffsetHeuristic(strat: Strat, clearerIndex: number): Strat {
    let clearers = strat.getRealClearers().map(clearer => clearer[0]);

    let isClearerMain = strat.template.clearers.map(c => c == clearerIndex);

    let getNP = function(turn: number): NoblePhantasm {
        return isClearerMain ?
            clearers[turn].data.getNP() :
            clearers[turn].data.getNP(strat.template.buffs.buffs[turn].npCard);
    }

    let skillOrder = strat.servant.data.skills.map(skill => {
        let anySelfBuff = skill.buffs.findIndex(b => b.self) >= 0;
        let turnsToApplyTo = isClearerMain.flatMap((isMain, index) => isMain == anySelfBuff ? [index] : []);
        if (turnsToApplyTo.length == 0) {
            return { buffs: skill.buffs, turn: 0 };
        }
        return { buffs: skill.buffs, turn: turnsToApplyTo.reverse()[0] - Math.min(...skill.buffs.map(b => b.turns)) + 1 };
    }).concat(isClearerMain.map((isMain, turn) => {
        return { buffs: isMain ? getNP(turn).preBuffs : [], turn: turn };
    })).concat(isClearerMain.map((isMain, turn) => {
        return { buffs: isMain ? getNP(turn).postBuffs : [], turn: turn + 1 };
    }));

    let servantBuffs = new BuffMatrix(clearers.map((isMain, turn) => {
        return BuffSet.fromBuffs(skillOrder.flatMap(order => {
            return order.turn <= turn
                ? order.buffs.filter(b => (isMain && b.self) || (!isMain && b.team)).filter(b => order.turn + b.turns > turn)
                : []
            }).concat(strat.servant.data.passives.filter(b => (isMain && b.self) || (!isMain && b.team))),
            getNP(turn).cardType)
    }));

    return update(strat, {
        servantBuffs: { $set: servantBuffs },
        template: { buffs: { $set: strat.template.buffs.syncNpCard(servantBuffs) } }
    });
}

export { StratBuilder }