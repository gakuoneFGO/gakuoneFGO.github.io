import { Box, Grid, Stack, Tab, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useState } from "react";
import { BuffSet, getLikelyClassMatchup } from "../Damage";
import { db } from "../Data";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyBuilder, NodeBuilder } from "./enemy-builder";
import { NodeOutputPanel, OutputPanel } from "./output-panel";
import { BuffMatrix, EnemyNode, MainServant, Strat, Template } from "../Strat";
import { CommandBuffMatrixBuilder } from "./buff-matrix-builder";
import { CEBuilder } from "./ce-builder";
import { PartyDisplay } from "./party-display";
import { CommandServantSelector } from "./servant-selector";
import { TemplateBuilder } from "./template-builder";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { Buff, BuffType, CardType, NoblePhantasm, Servant } from "../Servant";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useTracker } from "./undo-redo";
import { useHandler, useHandler0, useHandler2 } from "./common";

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
        const ce = db.craftEssences.get("<None>");
        const strat = new Strat(
            [new MainServant(servant, template.buffs), ...Array(5).fill(undefined)],
            template,
            ce,
            ce,
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

    const handlest = {
        onChange: useCallback((spec: Spec<StratBuilderState>) => tracker.handleChange(s => update(s, spec)), [])
    };

    const noTrack = {
        onChange: useCallback((spec: Spec<StratBuilderState>) => tracker.handleChange(s => update(s, spec), true), [])
    };

    const onServantChanged = useHandler2((slot: number, spec: Spec<Servant>) => ({ $apply: (state: StratBuilderState) => {
        const servant = update(state.strat.servants[slot]?.servant!, spec);
        if (servant.data.name != state.strat.servants[slot]!.servant.data.name) {
            let strat = update(state.strat, { servants: { [slot]: { servant: { $set: servant } } } });
            strat = fixNpCards(strat);
            return update(state, {
                strat: { $set: defaultBuffsetHeuristic(strat, slot) },
                basicEnemy: { $set: state.basicEnemy.withClass(getLikelyClassMatchup(servant.data.sClass)) }
            });
        } else {
            return update(state, { strat: { servants: { [slot]: { servant: { $set: servant } } } } });
        }
    }}), handlest);

    const onTemplateChanged = useHandler((spec: Spec<Template>) => ({ $apply: state => {
        const template = update(state.strat.template, spec);

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
        return update(state, { strat: { $set: buffsGenerated } });
    }}), handlest);

    const matrixHandlers = {
        onChange: useHandler2((slot: number, buffs: Spec<BuffMatrix>) => ({ strat: { servants: { [slot]: { buffs: buffs } } } }), handlest),
        onNpCardsChange: useHandler((v: Spec<CardType[]>) => ({ strat: { npCards: v } }), handlest),
        doRefresh: useHandler0(() => ({ $apply: (state: StratBuilderState) => {
            //the Commandable jank I wrote only works if there is a single event to handle
            //fortunately we have this hack to get the slot number from the tab the user is on so I don't have to fix it
            const slot = Number.parseInt(state.selectedTab.charAt(state.selectedTab.length - 1))
            return update(state, { strat: { $set: defaultBuffsetHeuristic(state.strat, slot) } });
        }}), handlest)
    }
    
    return (
        <Box height={sm ? undefined : "98vh"} width="98vw" display="flex" flexDirection={sm ? "column" : "row-reverse"}>
            <Box display="flex" flexDirection="column" height="100%" width={lg ? "33%" : md ? "42%" : "100%"}>
                <Box flexShrink={0}>
                    <PartyDisplay party={state.strat.getRealParty().map(s => s[0])}
                        onClick={useHandler((slot) => ({ $apply: state => update(state, {
                            selectedTab: { $set: state.strat.template.party[slot].isPlaceholder() ? "servant" + slot : "template" }
                        })}), handlest)}
                        onDrop={useHandler2((source, target) => ({ $apply: state => update(state, {
                            strat: { $set: state.strat.swap(source, target) },
                            selectedTab: { $set: fixTabOnSwap(source.toString(), target.toString(), state.selectedTab) }
                        })}), handlest)} />
                </Box>
                <TabContext value={selectedOutput}>
                    <TabPanel value="basic" sx={{ overflowY: "scroll", height: "100%" }}>
                        <Stack spacing={2}>
                            <OutputPanel strat={state.strat} enemy={state.basicEnemy} />
                            <EnemyBuilder value={state.basicEnemy} onChange={useHandler(enemy => ({ basicEnemy: enemy }), handlest)} />
                        </Stack>
                    </TabPanel>
                    <TabPanel value="advanced" sx={{ overflowY: "scroll", height: "100%" }}>
                        <NodeOutputPanel strat={state.strat} node={state.advancedNode} tooltipPlacement={sm ? "bottom" : "left"} />
                    </TabPanel>
                    <Box flexShrink={0}>
                        <TabList onChange={(_, v) => setSelectedOutput(v)}>
                            <Tab label="Basic" value="basic" />
                            <Tab label="Advanced" value="advanced" />
                        </TabList>
                    </Box>
                </TabContext>
            </Box>
            <Box display="flex" flexDirection="column" height="100%"  width={lg ? "67%" : md ? "58%" : "100%"}>
                <TabContext value={state.selectedTab}>
                    <Box flexShrink={0}>
                        <TabList variant="scrollable" onChange={useHandler2((_, v) => ({ selectedTab: { $set: v } }), noTrack)}>
                            {state.strat.servants.map((servant, slot) => servant ?
                                <Tab key={slot} label={`Servant ${(slot + 1)}`} value={`servant${slot}`} />
                            : null)}
                            <Tab label="Party" value="template" />
                            <Tab label="Craft Essence" value="ce" />
                            <Tab label="Enemies" value="node" />
                        </TabList>
                    </Box>
                    {state.strat.servants.map((servant, slot) => servant ?
                        <TabPanel key={slot} value={`servant${slot}`} sx={{ overflowY: "scroll", height: "100%" }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <CommandServantSelector value={servant.servant} label="Servant" allowUnspecified={false} allowPlaceholder={false}
                                        command={slot} onCommand={onServantChanged} />
                                </Grid>
                                <Grid item xs={12}>
                                    <CommandBuffMatrixBuilder value={servant.buffs}
                                        maxPowerMods={2}
                                        command={slot}
                                        onCommand={matrixHandlers.onChange}
                                        servants={[servant.servant]}
                                        warnOtherNp
                                        clearers={state.strat.getRealClearers().map(c => c[0])}
                                        npCards={{ value: state.strat.npCards, onChange: matrixHandlers.onNpCardsChange }}
                                        doRefresh={matrixHandlers.doRefresh} />
                                </Grid>
                            </Grid>
                        </TabPanel>
                    : null)}
                    <TabPanel value="template" sx={{ overflowY: "scroll", height: "100%" }}>
                        <TemplateBuilder
                            value={state.strat.template}
                            onChange={onTemplateChanged}
                            npCards={{ value: state.strat.npCards, onChange: useHandler(v => ({ strat: { npCards: v } }), handlest) }} />
                    </TabPanel>
                    <TabPanel value="ce" sx={{ overflowY: "scroll", height: "100%" }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={12} lg={6}>
                                <CEBuilder label="Servant CE"
                                    value={state.strat.servantCe}
                                    onChange={useHandler(ce => ({ strat: { servantCe: ce } }), handlest)} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={12} lg={6}>
                                <CEBuilder label="Support CE"
                                    value={state.strat.supportCe}
                                    onChange={useHandler(ce => ({ strat: { supportCe: ce } }), handlest)} />
                            </Grid>
                        </Grid>
                    </TabPanel>
                    <TabPanel value="node" sx={{ overflowY: "scroll", height: "100%" }}>
                        <Box>
                            <NodeBuilder value={state.advancedNode} onChange={useHandler(node => ({ advancedNode: node }), handlest)} />
                        </Box>
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
}

//there are still corner cases not handled but whatever
function defaultBuffsetHeuristic(strat: Strat, clearerIndex: number): Strat {
    const clearers = strat.getRealClearers().map(clearer => clearer[0]);
    const isClearerSelf = strat.template.clearers.map(c => c == clearerIndex);
    const servant = strat.servants[clearerIndex]!.servant;

    const getNP = (turn: number) => clearers[turn].data.getNP(strat.npCards[turn]);

    const skillOrder = servant.data.skills.map(skill => {
        const turnsToApplyTo = isClearerSelf.flatMap((isSelf, turn) => skill.buffs.some(b => canApply(isSelf, b) && isUseful(b, clearers, turn, getNP)) ? [turn] : []);
        if (turnsToApplyTo.length == 0) {
            return { buffs: skill.buffs, turn: 0 };
        }
        const optimizedTurn = turnsToApplyTo.reverse()[0] - Math.min(...skill.buffs.map(b => b.turns)) + 1;
        return { buffs: skill.buffs, turn: Math.max(optimizedTurn, 0) };
    }).concat(isClearerSelf.map((isSelf, turn) => {
        return { buffs: isSelf ? getNP(turn).preBuffs : [], turn: turn };
    })).concat(isClearerSelf.map((isSelf, turn) => {
        return { buffs: isSelf ? getNP(turn).postBuffs : [], turn: turn + 1 };
    }));

    const servantBuffs = new BuffMatrix(isClearerSelf.map((isSelf, turn) => {
        return BuffSet.fromBuffs(skillOrder.flatMap(order => {
            return order.turn <= turn
                ? order.buffs
                    .filter(b => canApply(isSelf, b))
                    .filter(b => order.turn + b.turns > turn &&
                        //HACK: all current OC buffs are single use but I don't want to actually model "X times" constraints
                        (b.type != BuffType.Overcharge || isFirstUseOfBuff(turn, order.turn, clearers)))
                : []
            }).concat(servant.data.passives.filter(b => canApply(isSelf, b))),
            getNP(turn).cardType)
    }));

    return update(strat, { servants: { [clearerIndex]: { buffs: { $set: servantBuffs } } } });
}

function canApply(isSelf: boolean, buff: Buff): boolean {
    return (isSelf && buff.self) || (!isSelf && buff.team);
}

function isUseful(buff: Buff, clearers: Servant[], turn: number, getNP: (turn: number) => NoblePhantasm): boolean {
    //assumes canApply is already checked
    switch (buff.type) {
        case BuffType.CardTypeUp:
            return getNP(turn).cardType == buff.cardType;
        case BuffType.NpGain:
            return getNP(turn).cardType != CardType.Buster && clearers.some((clearer, otherTurn) => otherTurn > turn && clearer == clearers[turn]);
        default:
            return true;
    }
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

const fixTabOnSwap = (slot1: string, slot2: string, currentTab: string) => {
    return currentTab.endsWith(slot1) ?
        currentTab.replace(slot1, slot2) :
        currentTab.replace(slot2, slot1);
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