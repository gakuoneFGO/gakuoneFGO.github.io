import { Box, TextField, Autocomplete, Stack, Grid, Typography, IconButton, Popover, Card, CardContent, useTheme, Switch, FormControlLabel, Tooltip } from "@mui/material";
import { Props, Commandable, IntegerInput, SaveableSelect, SmartSelect, TraitSelect, useHandler, useHandler2, wasteHandler, CommandArrayBuilder, ArrayBuilder } from "./common";
import { Enemy, EnemyAttribute, EnemyClass } from "../calc/enemy";
import { EnemyNode, Wave } from "../calc/strat";
import React, { useCallback } from "react";
import { db } from "../calc/data";
import { Info, PersonSearch } from "@mui/icons-material";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { Spec } from "immutability-helper";
import { ServantData } from "../calc/servant";
import { theme } from "./style";

export const EnemyBuilder = React.memo(function(props: Props<Enemy> & { showHealth?: Boolean, classAdornment?: () => JSX.Element, onClassChanged?: () => void }) {
    return (
        <>
            {props.showHealth ?
                <IntegerInput label="Enemy HP" value={props.value.hitPoints}
                    onChange={useHandler(v => ({ hitPoints: v }), props)} />
            : wasteHandler()}
            <Autocomplete
                options={Object.values(EnemyClass)}
                value={props.value.eClass}
                forcePopupIcon={!props.classAdornment}
                renderInput={params => <TextField {...params} label="Enemy Class"
                InputProps={{
                    ...params.InputProps,
                    endAdornment: props.classAdornment ? props.classAdornment() : params.InputProps.endAdornment
                }} />}
                onChange={useHandler2((_, v: EnemyClass | null) => {
                    if (props.onClassChanged) props.onClassChanged();
                    return { $apply: (enemy: Enemy) => v ? enemy.withClass(v) : enemy };
                }, props, props.onClassChanged)} />
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
        </>
    );
});

const CommandEnemyBuilder = Commandable(EnemyBuilder, "onChange");

const WaveBuilder = React.memo((props: Props<Wave> & { turn: number }) => {
    const popupState = usePopupState({ variant: "popover", popupId: "NodeBuilder" });
    const onChange = useHandler((enemies: Spec<Enemy[]>) => ({ enemies: enemies }), props);
    const createEnemy = useCallback(() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0), []);
    const renderEnemy = useCallback((enemy: Enemy, index: number, onChange: (arg1: number, arg2: Spec<Enemy, never>) => void) => 
        <Stack spacing={2}>
            <CommandEnemyBuilder value={enemy} showHealth command={index} onCommand={onChange} />
        </Stack>, []);
    return (
        <>
            <Stack direction="column" spacing={2}>
                <ArrayBuilder canCopy value={props.value.enemies}
                    onChange={onChange}
                    createOne={createEnemy}
                    renderOne={renderEnemy}
                    renderHeader={renderHeader(props.turn)}
                    addLabel={<Typography>Add Wave {props.turn + 1} Enemy</Typography>}
                    customButtons={useCallback((enemy, eIndex) => (
                        <IconButton {...bindTrigger(popupState)} title="Fill from Servant"
                            onClick={e => {
                                console.log(e.currentTarget);
                                popupState.setAnchorEl(e.currentTarget);
                                popupState.open();
                                onPopoverChange = servant => {
                                    popupState.close();
                                    props.onChange!({ enemies: { [eIndex]: { $apply: enemy => Enemy.fromServant(servant.$set, enemy.hitPoints) } } });
                                };
                            }}>
                            <PersonSearch />
                        </IconButton>
                    ), [props.onChange, popupState])} />
            </Stack>
            <Popover {...bindPopover(popupState)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}>
                {popupState.isOpen ? popover : null}
            </Popover>
        </>
    )
});

export const NodeBuilder = React.memo(function(props: Props<EnemyNode>) {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={db.nodes} {...props} label="Select Node" saveLabel="NodeName" />
            </Grid>
            {props.value.waves.map((wave, turn) => (
                <Grid key={turn} item xs={12} sm={4} md={12} lg={4}>
                    <WaveBuilder value={wave} turn={turn}
                        onChange={useHandler(wave => ({ waves: { [turn]: wave } }), props)} />
                </Grid>
            ))}
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

let onPopoverChange: (value: { $set: ServantData }) => void;
const popover = (
    <Card sx={{ border: 1, borderColor: theme.palette.divider }}>
        <CardContent>
            <SmartSelect className="autocompleteWidthFix" provider={db.servantData} filter={servantFilter}
                label="Select Enemy Servant" autoFocus
                onChange={v => onPopoverChange(v)} />
        </CardContent>
    </Card>
);