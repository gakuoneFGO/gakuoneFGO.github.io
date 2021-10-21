import { Box, TextField, Autocomplete, Stack, Grid, Typography, IconButton, Popper, Popover, Card, CardContent, useTheme, Switch, FormGroup, FormControlLabel, Tooltip } from "@mui/material";
import { ArrayBuilder, Props, Commandable, IntegerInput, SaveableSelect, SmartSelect, TraitSelect, useHandler, useHandler2, wasteHandler, CommandProps, ArrayBuilderProps } from "./common";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyNode } from "../Strat";
import React, { useState } from "react";
import { db } from "../Data";
import { Info, PersonSearch } from "@mui/icons-material";
import { bindPopover, bindToggle, usePopupState } from "material-ui-popup-state/hooks";
import { Spec } from "immutability-helper";
import { ServantData } from "../Servant";

function EnemyBuilder(props: Props<Enemy> & { showHealth?: Boolean }) {
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
}

const CommandEnemyBuilder = Commandable(EnemyBuilder, "onChange");
const CommandArrayBuilder: <T, C>(props: ArrayBuilderProps<T> & Props<T[]> & CommandProps<C>) => JSX.Element = Commandable(ArrayBuilder, "onChange") as (props: any) => JSX.Element;

function NodeBuilder(props: Props<EnemyNode>) {
    const theme = useTheme();
    const popupState = usePopupState({ variant: "popover", popupId: "NodeBuilder" });
    const [ state, setState ] = useState({ waveIndex: 0, enemyIndex: 0 });
    const onChange = useHandler2((wave: number, enemies: Spec<Enemy[]>) => ({ waves: { [wave]: { enemies: enemies } } }), props);
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
                            createOne={() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0)}
                            renderOne={(enemy, index, onChange) => 
                                <Stack spacing={2}>
                                    <CommandEnemyBuilder value={enemy} showHealth command={index} onCommand={onChange} />
                                </Stack>
                            }
                            renderHeader={(_, eIndex) => <Typography>W{index + 1} E{eIndex + 1}</Typography>}
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
}

const servantFilter = (s: ServantData) => s.isSpecified() && !s.isPlaceholder();

export { EnemyBuilder, NodeBuilder }