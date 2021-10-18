import { Box, Grid, Stack, Tab, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { BuffSet, CraftEssence, getLikelyClassMatchup } from "../Damage";
import { db } from "../Data";
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
import { BuffType, CardType, Servant } from "../Servant";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useHotkey, useTracker } from "./undo-redo";

interface StratBuilderState {
    readonly strat: Strat;
    readonly basicEnemy: Enemy;
    readonly advancedNode: EnemyNode;
    readonly selectedTab: string;
}

type StateChange = (state: StratBuilderState) => Spec<Readonly<StratBuilderState>, never>;

//TODO: decompose this
export function StratBuilder() {
    const init = () => {
        const servant = db.getServantDefaults("Iskandar");
        const template = db.getTemplate("[BUSTER] Double Oberon + Castoria (0%)");
        const strat = new Strat(
            [new MainServant(servant, template.buffs), ...Array(5).fill(undefined)],
            template,
            new CraftEssence("<None>", 0, []),
            new CraftEssence("<None>", 0, []),
            new Array(3).fill(CardType.Buster)
        );

        return {
            strat: defaultBuffsetHeuristic(strat, 0),
            basicEnemy: new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0.0).withClass(getLikelyClassMatchup(servant.data.sClass)),
            advancedNode: db.nodes.get("2019-11 Nursemas Band-aid Farming [LANCERS]"),
            selectedTab: "servant0"
        } as StratBuilderState;
    };

    const tracker = useTracker(init);
    const state = tracker.tracked.state;
    const [selectedOutput, setSelectedOutput] = useState("basic");
    const theme = useTheme();
    const [ sm, lg ] = [ useMediaQuery(theme.breakpoints.down("md")), useMediaQuery(theme.breakpoints.up("lg")) ];
    const md = !sm && !lg;

    const handleChange = (change: Spec<Readonly<StratBuilderState>, never> | StateChange, skipHistory?: boolean) => {
        console.log(change);
        if (change instanceof Function) {
            //fixes stale closure issue on PartyDisplay swap feature. makes me wonder what else is broken this way
            tracker.handleChange(currentState => update(currentState, (change as StateChange)(currentState)), skipHistory);
        } else {
            const newState = update(state, change);
            tracker.handleChanged(newState, skipHistory);
        }
    }

    const onServantChanged = (servant: Servant, index: number) => {
        if (servant.data.name != state.strat.servants[index]!.servant.data.name) {
            let strat = update(state.strat, { servants: { [index]: { servant: { $set: servant } } } });
            strat = fixNpCards(strat);
            handleChange({
                strat: { $set: defaultBuffsetHeuristic(strat, index) },
                basicEnemy: { $set: state.basicEnemy.withClass(getLikelyClassMatchup(servant.data.sClass)) }
            });
        } else {
            handleChange({ strat: { servants: { [index]: { servant: { $set: servant } } } } });
        }
    }

    //maybe pull from damaging NPs only? nah that's no fun
    //TODO: this is cool but you technically should use the same servant that was selected in the template (including config). only <Unspecified> should trigger random
    //the time for randomness is usually on page load anyway
    const getRandomServant: () => Servant = () => {
        const pool = db.servantData.getAll();
        const rand = Math.floor(Math.random() * pool.length)
        const result = db.getServantDefaults(pool[rand].name)
        return !result.isPlaceholder() && result.isSpecified() ? result : getRandomServant();
    };

    const onTemplateChanged = (template: Template) => {
        //decide servants
        const updates = reconcilePlaceholders(state.strat, template, getRandomServant);
        const servantsReconciled = applyUpdates(state.strat, updates);

        //set template
        const templateUpdated = update(servantsReconciled, { template: { $set: template } });

        //decide which NP
        const clearersFixed = fixClearers(templateUpdated);
        const npCardsFixed = fixNpCards(clearersFixed);

        //generate buffs
        const buffsGenerated = updates.filter(upd => upd[0] instanceof Servant).reduce((strat, upd) => defaultBuffsetHeuristic(strat, upd[1] as number), npCardsFixed);
        handleChange({ strat: { $set: buffsGenerated } });
    };

    const fixTabOnSwap = (slot1: string, slot2: string, currentTab: string) => {
        return currentTab.endsWith(slot1) ?
            currentTab.replace(slot1, slot2) :
            currentTab.replace(slot2, slot1);
    }
    
    return (
        <Box height={sm ? undefined : "98vh"} width="98vw" display="flex" flexDirection={sm ? "column" : "row-reverse"}>
            <Box display="flex" flexDirection="column" height="100%" width={lg ? "33%" : md ? "42%" : "100%"}>
                <Box flexShrink={0}>
                    <PartyDisplay party={state.strat.getRealParty().map(s => s[0])}
                        onClick={(slot) => handleChange((state: StratBuilderState) => ({
                            selectedTab: { $set: state.strat.template.party[slot].isPlaceholder() ? "servant" + slot : "template" }
                        }))}
                        onDrop={(source, target) => handleChange((state: StratBuilderState) => ({
                            strat: { $set: state.strat.swap(source, target) },
                            selectedTab: { $set: fixTabOnSwap(source.toString(), target.toString(), state.selectedTab) }
                        }))} />
                </Box>
                <TabContext value={selectedOutput}>
                    <Box flexShrink={0}>
                        <TabList onChange={(_, v) => setSelectedOutput(v)}>
                            <Tab label="Basic" value="basic" />
                            <Tab label="Advanced" value="advanced" />
                        </TabList>
                    </Box>
                    <TabPanel value="basic" sx={{ overflowY: "scroll", height: "100%" }}>
                        <Stack spacing={2}>
                            <OutputPanel strat={state.strat} enemy={state.basicEnemy} />
                            <EnemyBuilder value={state.basicEnemy} onChange={enemy => handleChange({ basicEnemy: { $set: enemy } } )} />
                        </Stack>
                    </TabPanel>
                    <TabPanel value="advanced" sx={{ overflowY: "scroll", height: "100%" }}>
                        <NodeOutputPanel strat={state.strat} node={state.advancedNode} />
                    </TabPanel>
                </TabContext>
            </Box>
            <Box display="flex" flexDirection="column" height="100%"  width={lg ? "67%" : md ? "58%" : "100%"}>
                <TabContext value={state.selectedTab}>
                    <Box flexShrink={0}>
                        <TabList variant="scrollable" onChange={(_, v) => handleChange({ selectedTab: { $set: v } }, true)}>
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
                        <TabPanel key={index} value={`servant${index}`} sx={{ overflowY: "scroll", height: "100%" }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <ServantSelector value={servant.servant} label="Servant" allowUnspecified={false} allowPlaceholder={false}
                                        onChange={(servant: Servant) => onServantChanged(servant, index)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <BuffMatrixBuilder value={servant.buffs}
                                        maxPowerMods={2}
                                        onChange={buffs => handleChange({ strat: { servants: { [index]: { buffs: { $set: buffs } } } } })}
                                        servants={[servant.servant]}
                                        warnOtherNp
                                        clearers={state.strat.getRealClearers().map(c => c[0])}
                                        npCards={{ value: state.strat.npCards, onChange: v => handleChange({ strat: { npCards: { $set: v } } }) }}
                                        doRefresh={() => handleChange({ strat: { $set: defaultBuffsetHeuristic(state.strat, index) } })} />
                                </Grid>
                            </Grid>
                        </TabPanel>
                    : null)}
                    <TabPanel value="template" sx={{ overflowY: "scroll", height: "100%" }}>
                        <TemplateBuilder
                            value={state.strat.template}
                            onChange={onTemplateChanged}
                            npCards={{ value: state.strat.npCards, onChange: v => handleChange({ strat: { npCards: { $set: v } } }) }} />
                    </TabPanel>
                    <TabPanel value="ce" sx={{ overflowY: "scroll", height: "100%" }}>
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
                    <TabPanel value="node" sx={{ overflowY: "scroll", height: "100%" }}>
                        <Box>
                            <NodeBuilder value={state.advancedNode} onChange={node => handleChange({ advancedNode: { $set: node } })} />
                        </Box>
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
}

//TODO: seems to be messed up when servant doesn't NP (frontloads instead of backloading)
function defaultBuffsetHeuristic(strat: Strat, clearerIndex: number): Strat {
    const clearers = strat.getRealClearers().map(clearer => clearer[0]);
    const isClearerMain = strat.template.clearers.map(c => c == clearerIndex);
    const servant = strat.servants[clearerIndex]!.servant;

    let getNP = (turn: number) => clearers[turn].data.getNP(strat.npCards[turn]);

    let skillOrder = servant.data.skills.map(skill => {
        let anySelfBuff = skill.buffs.findIndex(b => b.self) >= 0;
        let turnsToApplyTo = isClearerMain.flatMap((isMain, index) => isMain == anySelfBuff ? [index] : []);
        if (turnsToApplyTo.length == 0) {
            return { buffs: skill.buffs, turn: 0 };
        }
        const optimizedTurn = turnsToApplyTo.reverse()[0] - Math.min(...skill.buffs.map(b => b.turns)) + 1;
        return { buffs: skill.buffs, turn: Math.max(optimizedTurn, 0) };
    }).concat(isClearerMain.map((isMain, turn) => {
        return { buffs: isMain ? getNP(turn).preBuffs : [], turn: turn };
    })).concat(isClearerMain.map((isMain, turn) => {
        return { buffs: isMain ? getNP(turn).postBuffs : [], turn: turn + 1 };
    }));

    let servantBuffs = new BuffMatrix(isClearerMain.map((isMain, turn) => {
        return BuffSet.fromBuffs(skillOrder.flatMap(order => {
            return order.turn <= turn
                ? order.buffs
                    .filter(b => (isMain && b.self) || (!isMain && b.team))
                    .filter(b => order.turn + b.turns > turn &&
                        //HACK: all current OC buffs are single use but I don't want to actually model "X times" constraints
                        (b.type != BuffType.Overcharge || isFirstUseOfBuff(turn, order.turn, clearers)))
                : []
            }).concat(servant.data.passives.filter(b => (isMain && b.self) || (!isMain && b.team))),
            getNP(turn).cardType)
    }));

    return update(strat, { servants: { [clearerIndex]: { buffs: { $set: servantBuffs } } } });
}

function isFirstUseOfBuff(currentTurn: number, turnApplied: number, clearers: Servant[]): boolean {
    return currentTurn == turnApplied ||
        !clearers.slice(0, currentTurn).includes(clearers[currentTurn])
}

type ServantUpdate = [ number | Servant, number | undefined ];

function fixClearers(strat: Strat): Strat {
    const validClearers = strat.template.clearers.map(c => strat.template.party[c].isSpecified() ? c : 0);
    return update(strat, { template: { clearers: { $set: validClearers } } });
}

function fixNpCards(strat: Strat): Strat {
    //assumes selected servants are up to date
    const clearers = strat.getRealClearers();
    if (!clearers.some((clearer, turn) => !clearer[0].data.hasNP(strat.npCards[turn]))) {
        return strat;
    }
    const cards = clearers.map((clearer, turn) => clearer[0].data.hasNP(strat.npCards[turn]) ? strat.npCards[turn] : clearer[0].data.getNP().cardType);
    return update(strat, { npCards: { $set: cards } });
}

function reconcilePlaceholders(strat: Strat, newTemplate: Template, genServant: () => Servant): ServantUpdate[] {
    const oldPlaceholders = strat.template.party.flatMap((servant, slot) => servant.isPlaceholder() ? [slot] : []);
    const newPlaceholders = newTemplate.party.flatMap((servant, slot) => servant.isPlaceholder() ? [slot] : []);
    //main rule: if user changes a placeholder to a non-placeholder, keep all other placeholders as-is
    const locked = oldPlaceholders.filter(slot => newPlaceholders.includes(slot));

    const needsHome = oldPlaceholders.filter(slot => !locked.includes(slot));
    const openSlots = newPlaceholders.filter(slot => !locked.includes(slot));
    //fill remaining slots left to right and delete any servants there is no space for
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