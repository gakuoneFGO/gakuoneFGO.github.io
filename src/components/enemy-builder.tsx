import { Box, TextField, Autocomplete, Stack, Grid, Typography, IconButton, Popover, Card, CardContent, useTheme, Switch, FormControlLabel, Tooltip } from "@mui/material";
import { Props, Commandable, IntegerInput, SaveableSelect, SmartSelect, TraitSelect, useHandler, useHandler2, wasteHandler, CommandArrayBuilder } from "./common";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyNode } from "../Strat";
import React, { useCallback, useState } from "react";
import { db } from "../Data";
import { Info, PersonSearch } from "@mui/icons-material";
import { bindPopover, bindToggle, usePopupState } from "material-ui-popup-state/hooks";
import { Spec } from "immutability-helper";
import { ServantData } from "../Servant";

export const EnemyBuilder = React.memo(function(props: Props<Enemy> & { showHealth?: Boolean }) {
    return (
        <React.Fragment>
            {props.showHealth ?
                <IntegerInput label="Enemy HP" value={props.value.hitPoints}
                    onChange={useHandler(v => ({ hitPoints: v }), props)} />
            : wasteHandler()}
            <Autocomplete
                options={Object.values(EnemyClass)}
                value={props.value.eClass}
                renderInput={params => <TextField {...params} label="Enemy Class" />}
                onChange={useHandler2((_, v: EnemyClass | null) => ({ $apply: (enemy: Enemy) => v ? enemy.withClass(v) : enemy }), props)} />
            <Autocomplete
                options={Object.values(EnemyAttribute)}
                value={props.value.attribute}
                renderInput={params => <TextField {...params} label="Enemy Attribute" />}
                onChange={useHandler2((_, v: EnemyAttribute | null) => ({ $apply: (enemy: Enemy) => v ? enemy.withAttribute(v) : enemy }), props)} />
            <TraitSelect
                label="Enemy Traits"
                value={props.value.traits}
                onChange={useHandler(traits => ({ $apply: (enemy: Enemy) => enemy.withSpecificTraits(traits.$set) }), props)} />
            {props.showHealth ?
                <FormControlLabel
                    label={
                        <Box display="flex" alignItems="center">
                            <Typography>Special NP Gain Mod&nbsp;</Typography>
                            <Tooltip title="Certain enemies on certain nodes (mainly those with the Undead trait) give 20% more NP when attacked.">
                                <Info />
                            </Tooltip>
                        </Box>
                    }
                    control={
                        <Switch
                            checked={props.value.specialNpGainMod ?? false}
                            onChange={useHandler(e => ({ specialNpGainMod: { $set: e.target.checked } }), props)} />
                    } />
            : null}
        </React.Fragment>
    );
});

const CommandEnemyBuilder = Commandable(EnemyBuilder, "onChange");

export const NodeBuilder = React.memo(function(props: Props<EnemyNode>) {
    const theme = useTheme();
    const popupState = usePopupState({ variant: "popover", popupId: "NodeBuilder" });
    const [ state, setState ] = useState({ waveIndex: 0, enemyIndex: 0 });
    const onChange = useHandler2((wave: number, enemies: Spec<Enemy[]>) => ({ waves: { [wave]: { enemies: enemies } } }), props);
    const createEnemy = useCallback(() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0), []);
    const renderEnemy = useCallback((enemy: Enemy, index: number, onChange: (arg1: number, arg2: Spec<Enemy, never>) => void) => 
        <Stack spacing={2}>
            <CommandEnemyBuilder value={enemy} showHealth command={index} onCommand={onChange} />
        </Stack>, []);
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={db.nodes} {...props} label="Select Node" saveLabel="NodeName" />
            </Grid>
            {props.value.waves.map((wave, index) => (
                <Grid key={index} item xs={12} sm={4} md={12} lg={4}>
                    <Stack direction="column" spacing={2}>
                        <CommandArrayBuilder canCopy value={wave.enemies}
                            command={index}
                            onCommand={onChange}
                            createOne={createEnemy}
                            renderOne={renderEnemy}
                            renderHeader={renderHeader(index)}
                            addLabel={<Typography>Add Wave {index + 1} Enemy</Typography>}
                            customButtons={(enemy, eIndex) => (
                                <IconButton {...bindToggle(popupState)} title="Fill from Servant"
                                    onClick={e => {
                                        popupState.setAnchorEl(e.currentTarget);
                                        popupState.toggle();
                                        setState({ waveIndex: index, enemyIndex: eIndex });
                                    }}>
                                    <PersonSearch />
                                </IconButton>
                            )} />
                    </Stack>
                </Grid>
            ))}
            <Popover {...bindPopover(popupState)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}>
                <Card sx={{ border: 1, borderColor: theme.palette.divider }}>
                    <CardContent>
                        <SmartSelect className="autocompleteWidthFix" provider={db.servantData} filter={servantFilter}
                            label="Select Enemy Servant" autoFocus
                            onChange={useHandler(servant => {
                                popupState.close();
                                return { waves: { [state.waveIndex]: { enemies: { [state.enemyIndex]: { $apply: enemy => Enemy.fromServant(servant.$set, enemy.hitPoints) } } } } };
                            }, props, [state])} />
                    </CardContent>
                </Card>
            </Popover>
        </Grid>
    );
});

const headers: Map<number, (_: any, eIndex: number) => React.ReactNode> = new Map([]);
function renderHeader(turn: number) {
    if (!headers.has(turn))
        headers.set(turn, (_, eIndex) => <Typography>W{turn + 1} E{eIndex + 1}</Typography>);
    return headers.get(turn)!;
}

const servantFilter = (s: ServantData) => s.isSpecified() && !s.isPlaceholder();