import { Settings } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, InputLabel, TextField, Autocomplete, Typography, InputAdornment, IconButton, Popper, FormControlLabel, Stack, Card, CardContent, useTheme } from "@mui/material";
import React, { useState } from "react";
import { bindToggle, bindPopper, usePopupState } from 'material-ui-popup-state/hooks';
import { allData, Data } from "../Data";
import { Servant } from "../Servant";
import { BaseComponent, BaseProps, handleChange } from "./common";

interface ServantSelectorProps extends BaseProps<Servant> {
    label?: string;
}

var servantList: string[] | undefined;
var data: Data | undefined;

function ServantSelector(props: ServantSelectorProps) {
    const [ , setState ] = useState({});
    const popupState = usePopupState({ variant: "popper", popupId: "ServantSelector" });
    let theme = useTheme();

    if (!data) {
        allData.then(receivedData => {
            data = receivedData;
            servantList = Array.from(receivedData.servants.keys()).sort();
            setState({}); //only need state to replace forceUpdate()
        });
        return null;
    }

    return (
        <React.Fragment>
            <Autocomplete
                options={servantList as string[]}
                value={props.value.data.name}
                renderInput={params => <TextField {...params} label={props.label} variant="outlined" InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton {...bindToggle(popupState)}>
                                <Settings />
                            </IconButton>
                        </InputAdornment>
                    )
                }} />}
                onChange={(e, v) => { if (v) handleChange({ $set: (data as Data).getServantDefaults(v) }, props) }}
                disableClearable={true}
                forcePopupIcon={false} />
            <Popper placement="bottom-end" {...bindPopper(popupState)}>
                <Card sx={{ border: 1, borderColor: theme.palette.text.disabled /* TODO: use same rule as input outlines */ }}>
                    <CardContent>
                        <Stack justifyContent="space-evenly" spacing={2}>
                            <Autocomplete
                                options={props.value.data.growthCurve.getValidLevels()}
                                value={props.value.config.level.toString()}
                                renderInput={params => <TextField {...params} label="Level" variant="outlined" fullWidth />}
                                onChange={(e, v) => { if (v) handleChange({ config: { level: { $set: Number.parseInt(v) } } }, props)}}
                                disableClearable={true} />
                            <Autocomplete
                                options={["1", "2", "3", "4", "5"]}
                                value={props.value.config.npLevel.toString()}
                                renderInput={params => <TextField {...params} label="NP Level" variant="outlined" fullWidth />}
                                onChange={(e, v) => { if (v) handleChange({ config: { npLevel: { $set: Number.parseInt(v) } } }, props)}}
                                disableClearable={true} />
                            <TextField
                                type="number" variant="outlined" fullWidth
                                label="Fous"
                                value={props.value.config.attackFou.toString()}
                                onChange={(e) => { if (e.target.value) handleChange({ config: { attackFou: { $set: Number.parseInt(e.target.value) } } }, props)}} />
                            <FormControlLabel
                                label="NP Upgrade"
                                labelPlacement="end"
                                control={
                                    <Checkbox checked={props.value.config.isNpUpgraded}
                                    onChange={(e, v) => handleChange({ config: { isNpUpgraded: {$set: v } } }, props) } />
                                } />
                        </Stack>
                    </CardContent>
                </Card>
            </Popper>
        </React.Fragment>
    );
}

export { ServantSelector }