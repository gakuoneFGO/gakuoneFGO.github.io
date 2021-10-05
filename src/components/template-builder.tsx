import { Checkbox, FormControlLabel, Grid, TextField, Stack, Card, CardContent, Box, InputAdornment, IconButton, useTheme, Popover } from "@mui/material";
import { useData } from "../Data";
import { Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { BaseProps, handleChange, SmartSelect } from "./common";
import { ServantSelector } from "./servant-selector";
import { bindPopover, usePopupState, bindTrigger } from "material-ui-popup-state/hooks";
import { useState } from "react";
import update from "immutability-helper";
import { Save } from "@mui/icons-material";
import { CardType } from "../Servant";

function TemplateBuilder(props: BaseProps<Template> & { npCards: BaseProps<CardType[]> }) {
    const [ data ] = useData();
    const popupState = usePopupState({ variant: "popover", popupId: "ServantSelector" });
    const theme = useTheme();
    const [ state, setState ] = useState({ newName: "" });

    function handleClearerChanged(value: boolean, turnIndex: number, clearerIndex: number) {
        if (!value) return;
        handleChange({ clearers: { [turnIndex]: { $set: clearerIndex } } }, props);
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SmartSelect provider={data.templates}
                    value={data.templates.get(props.value.name)}
                    onChange={v => props.onChange(data.getTemplate(v.name))}
                    label="Select Template"
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton title="Save" {...bindTrigger(popupState)}>
                                <Save />
                            </IconButton>
                        </InputAdornment>
                    } />
                <Popover {...bindPopover(popupState)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    transformOrigin={{ vertical: "top", horizontal: "center" }}>
                    <Card sx={{ border: 1, borderColor: theme.palette.divider /* TODO: use same rule as input outlines */ }}>
                        <CardContent>
                            <Stack justifyContent="space-evenly" spacing={2} direction="row">
                                <TextField autoFocus label="Template Name" value={state.newName} onChange={e => setState({ newName: e.target.value })} />
                                <IconButton title="Save"
                                    onClick={() => {
                                        if (state.newName){
                                            const item = update(props.value, { name: { $set: "* " + state.newName } })
                                            data.setTemplate(item);
                                            props.onChange(item);
                                            popupState.setOpen(false);
                                        } else console.log(JSON.stringify(props.value.buffs.buffs));
                                    }}>
                                    <Save />
                                </IconButton>
                            </Stack>
                        </CardContent>
                    </Card>
                </Popover>
            </Grid>
            {props.value.party.map((servant, index) =>(
                <Grid item xs={12} sm={6} md={12} lg={4} key={index}>
                    <Card>
                        <CardContent>
                            <ServantSelector
                                allowPlaceholder={true}
                                allowUnspecified={index > 2} //first 3 slots are always filled
                                value={servant}
                                label={"Servant " + (index + 1)}
                                onChange={s => handleChange({ party: { [index]: { $set: s } } }, props)} />
                                {/* TODO: reset checkboxes when setting back to unspecified */}
                            <Stack justifyContent="space-evenly" direction="row">
                                <FormControlLabel
                                    label="NP T1"
                                    labelPlacement="bottom"
                                    control={
                                        <Checkbox checked={props.value.clearers[0] == index}
                                            onChange={(_, v) => handleClearerChanged(v, 0, index)}
                                            disabled={props.value.party[index].data.name == "<Unspecified>"} />
                                    } />
                                <FormControlLabel
                                    label="NP T2"
                                    labelPlacement="bottom"
                                    control={
                                        <Checkbox checked={props.value.clearers[1] == index}
                                            onChange={(_, v) => handleClearerChanged(v, 1, index)}
                                            disabled={props.value.party[index].data.name == "<Unspecified>"} />
                                    } />
                                <FormControlLabel
                                    label="NP T3"
                                    labelPlacement="bottom"
                                    control={
                                        <Checkbox checked={props.value.clearers[2] == index}
                                            onChange={(_, v) => handleClearerChanged(v, 2, index)}
                                            disabled={props.value.party[index].data.name == "<Unspecified>"} />
                                    } />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
            <Grid item xs={12}>
                <BuffMatrixBuilder value={props.value.buffs}
                    servants={props.value.party}
                    onChange={buffs => handleChange({ buffs: { $set: buffs } }, props)}
                    clearers={props.value.clearers.map(c => props.value.party[c])}
                    npCards={props.npCards}
                    doRefresh={() => handleChange({ buffs: { $set: data.getTemplate(props.value.name).buffs } }, props)} />
            </Grid>
        </Grid>
    );
}

export { TemplateBuilder }