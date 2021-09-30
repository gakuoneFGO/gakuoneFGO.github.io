import { Box, Grid, Stack, Tab } from "@mui/material";
import React, { useState } from "react";
import { BuffSet, CraftEssence, getLikelyClassMatchup } from "../Damage";
import { useData } from "../Data";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyBuilder, NodeBuilder } from "./enemy-builder";
import { NodeOutputPanel, OutputPanel } from "./output-panel";
import { BuffMatrix, EnemyNode, MainServant, Strat, Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { CEBuilder } from "./ce-builder";
import { PartyDisplay } from "./party-display";
import { ServantSelector } from "./servant-selector";
import { TemplateBuilder } from "./template-builder";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { CardType, NoblePhantasm, Servant, ServantData } from "../Servant";
import { TabContext, TabList, TabPanel } from "@mui/lab";

interface StratBuilderState {
    readonly strat: Strat;
    readonly basicEnemy: Enemy;
    readonly advancedNode: EnemyNode;
    readonly selectedTab: string;
    readonly selectedOutput: string;
}

//TODO: decompose this
function StratBuilder() {
    let [ data, promise ] = useData();
    let [ state, setState ] = useState({} as StratBuilderState);

    //force all data loaded before loading root control
    //this allows descendents to use data freely
    if (!data) {
        promise.then( data => {
            let servant = data.getServantDefaults("Iskandar");
            let template = data.getTemplate("[BUSTER] Double Oberon + Castoria (0%)");
            var strat = new Strat(
                [new MainServant(servant, template.buffs), ...Array(5).fill(undefined)],
                template,
                new CraftEssence("<None>", 0, []),
                new CraftEssence("<None>", 0, []),
                new Array(3).fill(CardType.Buster)
            );
            setState({
                strat: defaultBuffsetHeuristic(strat, 0),
                basicEnemy: new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0.0).changeClass(getLikelyClassMatchup(servant.data.sClass)),
                advancedNode: data.nodes.get("[LANCERS] Nursemas Band-aid Farming"),
                selectedTab: "servant0",
                selectedOutput: "basic"
            });
        });
        return null;
    };

    const handleChange = (spec: Spec<Readonly<StratBuilderState>, never>) => {
        //console.log(spec);
        let newState = update(state, spec);
        setState(newState);
    }

    const onServantChanged = (servant: Servant, index: number) => {
        if (servant.data.name != state.strat.servants[index]!.servant.data.name) {
            let strat = update(state.strat, { servants: { [index]: { servant: { $set: servant } } } });
            strat = fixNpCards(strat);
            handleChange({
                strat: { $set: defaultBuffsetHeuristic(strat, index) },
                basicEnemy: { $set: state.basicEnemy.changeClass(getLikelyClassMatchup(servant.data.sClass)) }
            });
        } else {
            handleChange({ strat: { servants: { [index]: { servant: { $set: servant } } } } });
        }
    }

    //maybe pull from damaging NPs only? nah that's no fun
    //TODO: this is cool but you technically should use the same servant that was selected in the template (including config). only <Unspecified> should trigger random
    //the time for randomness is usually on page load anyway
    const getRandomServant: () => Servant = () => {
        const pool = data.servantData.getAll();
        const rand = Math.floor(Math.random() * pool.length)
        const result = data.getServantDefaults(pool[rand].name)
        return !result.isPlaceholder() && result.isSpecified() ? result : getRandomServant();
    };

    const onTemplateChanged = (template: Template) => {
        //decide servants
        const updates = reconcilePlaceholders(state.strat, template, getRandomServant);
        const servantsReconciled = applyUpdates(state.strat, updates);

        //set template
        const templateUpdated = update(servantsReconciled, { template: { $set: template } });

        //decide which NP
        const npCardsFixed = fixNpCards(templateUpdated);

        //generate buffs
        const buffsGenerated = updates.filter(upd => upd[0] instanceof Servant).reduce((strat, upd) => defaultBuffsetHeuristic(strat, upd[1] as number), npCardsFixed);
        handleChange({ strat: { $set: buffsGenerated } });
    };
    
    return (
        <Grid container direction="row-reverse" spacing={0}>
            <Grid item lg={4} md={5} sm={12} xs={12}>
                <PartyDisplay party={state.strat.getRealParty().map(s => s[0])} />
                <TabContext value={state.selectedOutput}>
                    <Box>
                        <TabList onChange={(_, v) => handleChange({ selectedOutput: { $set: v } })}>
                            <Tab label="Basic" value="basic" />
                            <Tab label="Advanced" value="advanced" />
                        </TabList>
                    </Box>
                    <TabPanel value="basic">
                        <Stack spacing={2}>
                            <OutputPanel strat={state.strat} enemy={state.basicEnemy} />
                            <EnemyBuilder value={state.basicEnemy} onChange={enemy => handleChange({ basicEnemy: { $set: enemy } } )} />
                        </Stack>
                    </TabPanel>
                    <TabPanel value="advanced">
                        <NodeOutputPanel strat={state.strat} node={state.advancedNode} />
                    </TabPanel>
                </TabContext>
            </Grid>
            <Grid item lg={8} md={7} sm={12} xs={12}>
                <TabContext value={state.selectedTab}>
                    <Box>
                        <TabList variant="scrollable" onChange={(_, v) => handleChange({ selectedTab: { $set: v } })}>
                            {state.strat.servants.map((servant, index) => servant ?
                                <Tab key={index} label={`Servant ${(index + 1)}`} value={`servant${index}`} />
                            : null)}
                            <Tab label="Party" value="template" />
                            <Tab label="Craft Essence" value="ce" />
                            <Tab label="Enemies" value="node" />
                        </TabList>
                    </Box>
                    {state.strat.servants.map((servant, index) => servant ?
                        //seems like the TabContext needs to know about even the tabs that aren't selected since I get issues trying to return just the selected one
                        <TabPanel key={index} value={`servant${index}`}>
                            <Box>
                                <ServantSelector value={servant.servant} label="Servant" onChange={(servant: Servant) => onServantChanged(servant, index)} />
                                <BuffMatrixBuilder value={servant.buffs}
                                    maxPowerMods={2}
                                    onChange={buffs => handleChange({ strat: { servants: { [index]: { buffs: { $set: buffs } } } } })}
                                    servants={[servant.servant]}
                                    warnOtherNp
                                    clearers={state.strat.getRealClearers().map(c => c[0])}
                                    npCards={{ value: state.strat.npCards, onChange: v => handleChange({ strat: { npCards: { $set: v } } }) }}
                                    doRefresh={() => handleChange({ strat: { $set: defaultBuffsetHeuristic(state.strat, index) } })} />
                            </Box>
                        </TabPanel>
                    : null)}
                    <TabPanel value="template">
                        <TemplateBuilder key={state.strat.template.name}
                            value={state.strat.template}
                            onChange={onTemplateChanged}
                            npCards={{ value: state.strat.npCards, onChange: v => handleChange({ strat: { npCards: { $set: v } } }) }} />
                    </TabPanel>
                    <TabPanel value="ce">
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={12} lg={6}>
                                <CEBuilder label="Servant CE"
                                    value={state.strat.servantCe}
                                    onChange={(ce: CraftEssence) => handleChange({ strat: { servantCe: { $set: ce } } })} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={12} lg={6}>
                                <CEBuilder label="Support CE"
                                    value={state.strat.supportCe}
                                    onChange={(ce: CraftEssence) => handleChange({ strat: { supportCe: { $set: ce } } })} />
                            </Grid>
                        </Grid>
                    </TabPanel>
                    <TabPanel value="node">
                        <Box>
                            <NodeBuilder value={state.advancedNode} onChange={node => handleChange({ advancedNode: { $set: node } })} />
                        </Box>
                    </TabPanel>
                </TabContext>
            </Grid>
        </Grid>
    );
}

//TODO: seems to be messed up when servant doesn't NP (frontloads instead of backloading)
function defaultBuffsetHeuristic(strat: Strat, clearerIndex: number): Strat {
    const clearers = strat.getRealClearers().map(clearer => clearer[0]);
    const isClearerMain = strat.template.clearers.map(c => c == clearerIndex);
    const servant = strat.servants[clearerIndex]!.servant;

    let getNP = function(turn: number): NoblePhantasm {
        return clearers[turn].data.getNP(strat.npCards[turn]);
    }

    let skillOrder = servant.data.skills.map(skill => {
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
            }).concat(servant.data.passives.filter(b => (isMain && b.self) || (!isMain && b.team))),
            getNP(turn).cardType)
    }));

    return update(strat, {
        servants: { [clearerIndex]: { buffs: { $set: servantBuffs } } }
    });
}

type ServantUpdate = [ number | Servant, number | undefined ];

function fixNpCards(strat: Strat): Strat {
    //assumes selected servants are up to date
    const clearers = strat.getRealClearers();
    if (!clearers.some((clearer, turn) => !clearer[0].data.hasNP(strat.npCards[turn]))) {
        return strat;
    }
    let cards = clearers.map((clearer, turn) => clearer[0].data.hasNP(strat.npCards[turn]) ? strat.npCards[turn] : clearer[0].data.getNP().cardType);
    return update(strat, { npCards: { $set: cards } });
}

function reconcilePlaceholders(strat: Strat, newTemplate: Template, genServant: () => Servant): ServantUpdate[] {
    const oldPlaceholders = strat.template.party.flatMap((servant, slot) => servant.isPlaceholder() ? [slot] : []);
    const newPlaceholders = newTemplate.party.flatMap((servant, slot) => servant.isPlaceholder() ? [slot] : []);
    //main rule: if user changes a placeholder to a non-placeholder, keep all other placeholders as-is
    const locked = oldPlaceholders.filter(slot => newPlaceholders.includes(slot));

    //fill remaining slots in order
    const needsHome = oldPlaceholders.filter(slot => !locked.includes(slot));
    const openSlots = newPlaceholders.filter(slot => !locked.includes(slot));
    //fill slots left to right and delete any servants there is no space for
    const movesAndDeletes = needsHome.map((slot, index) => [slot, openSlots[index]]) as [number, number | undefined][];

    const adds = openSlots.slice(needsHome.length).map(slot => [genServant(), slot]) as [Servant, number][];

    return [...movesAndDeletes, ...adds];
}

function applyUpdates(strat: Strat, updates: ServantUpdate[]): Strat {
    const newServants = updates.reduce((tmpServants, upd) => applyUpdate(strat.servants, tmpServants, upd, strat.template.buffs), strat.servants);
    return update(strat, { servants: { $set: newServants } });
}

function applyUpdate(origServants: (MainServant | undefined)[], targetServants: (MainServant | undefined)[], upd: ServantUpdate, matrix: BuffMatrix): (MainServant | undefined)[] {
    const [ source, target ] = upd;
    if (target == undefined) {
        if (source instanceof Servant) return targetServants;
        //delete
        return origServants[source] == targetServants[source] ?
            update(targetServants, { [source]: { $set: undefined } }) :
            targetServants;
    } else if (source instanceof Servant) {
        //add
        return update(targetServants, { [target]: { $set: new MainServant(source, matrix) } });
    } else {
        //move
        return origServants[source] == targetServants[source] ?
            update(targetServants, { [target]: { $set: origServants[source] }, [source]: { $set: undefined } }) :
            update(targetServants, { [target]: { $set: origServants[source] } });
    }
}

export { StratBuilder }