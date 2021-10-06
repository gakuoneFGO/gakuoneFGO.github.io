import { Save, Settings } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, InputLabel, TextField, Autocomplete, Typography, InputAdornment, IconButton, Popper, FormControlLabel, Stack, Card, CardContent, useTheme } from "@mui/material";
import React, { useState } from "react";
import { bindToggle, bindPopper, usePopupState } from 'material-ui-popup-state/hooks';
import { useData } from "../Data";
import { Servant, ServantData } from "../Servant";
import { BaseComponent, BaseProps, handleChange, IntegerInput, SmartSelect } from "./common";

interface ServantSelectorProps extends BaseProps<Servant> {
    label?: string;
    allowPlaceholder: boolean;
    allowUnspecified: boolean;
}

function ServantSelector(props: ServantSelectorProps) {
    const [ data ] = useData();
    const popupState = usePopupState({ variant: "popper", popupId: "ServantSelector" });
    let boundToggle = bindToggle(popupState);
    const theme = useTheme();

    return (
        <React.Fragment>
            <SmartSelect provider={data.servantData}
                value={props.value.data}
                onChange={v => props.onChange(data.getServantDefaults(v.name))}
                label="Select Servant"
                filter={
                    props.allowPlaceholder && props.allowUnspecified ?
                        undefined :
                        servant => (props.allowPlaceholder || !servant.isPlaceholder()) && (props.allowUnspecified || servant.isSpecified())
                }
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton title="Stats" {...boundToggle}>
                            <Settings />
                        </IconButton>
                    </InputAdornment>
                } />
            <Popper placement="bottom-end" {...bindPopper(popupState)}>
                <Card sx={{ border: 1, borderColor: theme.palette.divider /* TODO: use same rule as input outlines */ }}>
                    <CardContent>
                        <Stack justifyContent="space-evenly" spacing={2}>
                            <Autocomplete
                                options={props.value.data.growthCurve.getValidLevels()}
                                value={props.value.config.level.toString()}
                                renderInput={params => <TextField {...params} label="Level" />}
                                onChange={(e, v) => { if (v) handleChange({ config: { level: { $set: Number.parseInt(v) } } }, props)}} />
                            <Autocomplete
                                options={["1", "2", "3", "4", "5"]}
                                value={props.value.config.npLevel.toString()}
                                renderInput={params => <TextField {...params} label="NP Level" />}
                                onChange={(e, v) => { if (v) handleChange({ config: { npLevel: { $set: Number.parseInt(v) } } }, props)}} />
                            <IntegerInput
                                label="Fous"
                                value={props.value.config.attackFou}
                                onChange={v => { handleChange({ config: { attackFou: { $set: v } } }, props)}} />
                            <Stack direction="row" justifyContent="space-between">
                                <FormControlLabel
                                    label="NP Upgrade"
                                    labelPlacement="end"
                                    control={
                                        <Checkbox checked={props.value.config.isNpUpgraded}
                                        onChange={(e, v) => handleChange({ config: { isNpUpgraded: {$set: v } } }, props) } />
                                    } />
                                <IconButton title="Save as Default"
                                    onClick={(e) => {
                                        data.setServantDefaults(props.value.config);
                                        boundToggle.onClick(e);
                                    }}>
                                    <Save />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Popper>
        </React.Fragment>
    );
}

export { ServantSelector }