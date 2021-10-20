import { Box, TextField, Autocomplete, Stack, Grid, Typography, IconButton, Popper, Popover, Card, CardContent, useTheme, Switch, FormGroup, FormControlLabel, Tooltip } from "@mui/material";
import { ArrayBuilder, BaseProps, handleChange, IntegerInput, SaveableSelect, SmartSelect, TraitSelect } from "./common";
import { Enemy, EnemyAttribute, EnemyClass } from "../Enemy";
import { EnemyNode } from "../Strat";
import React, { useState } from "react";
import { db } from "../Data";
import { Info, PersonSearch } from "@mui/icons-material";
import { bindPopover, bindToggle, usePopupState } from "material-ui-popup-state/hooks";

function EnemyBuilder(props: BaseProps<Enemy> & { showHealth?: Boolean }) {
    return (
        <React.Fragment>
            {props.showHealth ?
                <IntegerInput label="Enemy HP" value={props.value.hitPoints}
                    onChange={ v => { handleChange({ hitPoints: { $set: v } }, props)}} />
            : null}
            <Autocomplete
                options={Object.values(EnemyClass)}
                value={props.value.eClass}
                renderInput={params => <TextField {...params} label="Enemy Class" />}
                onChange={(e, v) => { if (v) handleChange({ $set: props.value.withClass(v) }, props); }} />
            <Autocomplete
                options={Object.values(EnemyAttribute)}
                value={props.value.attribute}
                renderInput={params => <TextField {...params} label="Enemy Attribute" />}
                onChange={(_, v) => { if (v) handleChange({ $set: props.value.withAttribute(v) }, props); }} />
            <TraitSelect
                label="Enemy Traits"
                value={props.value.traits}
                onChange={traits => handleChange({ $set: props.value.withSpecificTraits(traits) }, props) } />
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
                            onChange={e => handleChange({ specialNpGainMod: { $set: e.target.checked } }, props)} />
                    } />
            : null}
        </React.Fragment>
    );
}

function NodeBuilder(props: BaseProps<EnemyNode>) {
    const theme = useTheme();
    const popupState = usePopupState({ variant: "popover", popupId: "NodeBuilder" });
    const [state, setState] = useState({ waveIndex: 0, enemyIndex: 0, hp: 0 });
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={db.nodes} {...props} label="Select Node" saveLabel="NodeName" />
            </Grid>
            {props.value.waves.map((wave, index) => (
                <Grid key={index} item xs={12} sm={4} md={12} lg={4}>
                    <Stack direction="column" spacing={2}>
                        <ArrayBuilder canCopy value={wave.enemies}
                            onChange={enemies => handleChange({ waves: { [index]: { enemies: { $set: enemies } } } }, props)}
                            createOne={() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0)}
                            renderOne={(enemy, props) => 
                                <Stack spacing={2}>
                                    <EnemyBuilder value={enemy} showHealth {...props} />
                                </Stack>
                            }
                            renderHeader={(_, eIndex) => <Typography>W{index + 1} E{eIndex + 1}</Typography>}
                            addLabel={<Typography>Add Wave {index + 1} Enemy</Typography>}
                            customButtons={(enemy, eIndex) => (
                                <IconButton {...bindToggle(popupState)} title="Fill from Servant"
                                    onClick={e => {
                                        popupState.setAnchorEl(e.currentTarget);
                                        popupState.toggle();
                                        setState({ waveIndex: index, enemyIndex: eIndex, hp: enemy.hitPoints });
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
                        <SmartSelect className="autocompleteWidthFix" provider={db.servantData} filter={s => s.isSpecified() && !s.isPlaceholder()}
                            label="Select Enemy Servant" autoFocus
                            onChange={servant => {
                                handleChange({ waves: { [state.waveIndex]: { enemies: { [state.enemyIndex]: { $set: Enemy.fromServant(servant, state.hp) } } } } }, props);
                                popupState.close();
                            }} />
                    </CardContent>
                </Card>
            </Popover>
        </Grid>
    );
}

export { EnemyBuilder, NodeBuilder }