import { Save, Settings, Warning } from "@mui/icons-material";
import { Checkbox, TextField, Autocomplete, InputAdornment, IconButton, Popper, FormControlLabel, Stack, Card, CardContent, useTheme, Tooltip, ClickAwayListener } from "@mui/material";
import React, { useCallback } from "react";
import { bindToggle, bindPopper, usePopupState } from 'material-ui-popup-state/hooks';
import { db } from "../Data";
import { AppendLevel, Servant, ServantData } from "../Servant";
import { Props, useHandler, IntegerInput, SmartSelect, useHandler2, Commandable } from "./common";

interface ServantSelectorProps extends Props<Servant> {
    label?: string;
    allowPlaceholder: boolean;
    allowUnspecified: boolean;
}

export function ServantSelector(props: ServantSelectorProps) {
    const popupState = usePopupState({ variant: "popper", popupId: "ServantSelector" });
    const theme = useTheme();

    const onAppendChanged = useHandler2((_, v: AppendLevel) => ({ config: { appendLevel: { $set: v } } }), props);
    const filter = useCallback((servant: ServantData) => (props.allowPlaceholder || !servant.isPlaceholder()) && (props.allowUnspecified || servant.isSpecified()),
        [props.allowPlaceholder, props.allowUnspecified]);

    return (
        <React.Fragment>
            <SmartSelect provider={db.servantData}
                value={props.value.data}
                onChange={useHandler(v => ({ $set: db.getServantDefaults(v.$set.name) }), props)}
                label="Select Servant"
                filter={ props.allowPlaceholder && props.allowUnspecified ? undefined : filter }
                endAdornment={
                    <InputAdornment position="end">
                        {props.value.hasInvalidNpUpgrade() ?
                            <Tooltip title="NP upgrade selected but this servant has no NP upgrade yet. Damage will be calculated using the standard multipliers for an upgraded NP.">
                                <Warning color="warning" />
                            </Tooltip>
                        : null}
                        {props.value.isSpecified() && !props.value.isPlaceholder() ?
                            <IconButton title="Stats" {...bindToggle(popupState)}>
                                <Settings />
                            </IconButton>
                        : null}
                    </InputAdornment>
                } />
            <Popper placement="bottom-end" {...bindPopper(popupState)}>
                <ClickAwayListener onClickAway={() => popupState.setOpen(false)}>
                    <Card sx={{ border: 1, borderColor: theme.palette.divider }}>
                        <CardContent>
                            <Stack justifyContent="space-evenly" spacing={2}>
                                <Autocomplete
                                    options={props.value.data.growthCurve.getValidLevels()}
                                    disableClearable
                                    value={props.value.config.level.toString()}
                                    renderInput={params => <TextField {...params} label="Level" />}
                                    onChange={useHandler2((_, v: string) => ({ config: { level: { $set: Number.parseInt(v) } } }), props)} />
                                <Autocomplete
                                    options={["1", "2", "3", "4", "5"]}
                                    disableClearable
                                    value={props.value.config.npLevel.toString()}
                                    renderInput={renderLevelInput}
                                    onChange={useHandler2((_, v: string) => v ? { config: { npLevel: { $set: Number.parseInt(v) } } } : { $apply: a => a }, props)} />
                                <IntegerInput
                                    label="Fous"
                                    value={props.value.config.attackFou}
                                    onChange={useHandler(v => ({ config: { attackFou: v } }), props)} />
                                {props.value.data.appendTarget.length > 0 ?
                                    <Autocomplete
                                        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as AppendLevel[]}
                                        disableClearable
                                        getOptionLabel={o => o.toString()}
                                        value={props.value.config.appendLevel}
                                        renderInput={renderAppendInput}
                                        onChange={onAppendChanged} />
                                : null}
                                <Stack direction="row" justifyContent="space-between">
                                    <FormControlLabel
                                        label="NP Upgrade"
                                        labelPlacement="end"
                                        control={
                                            <Checkbox checked={props.value.config.isNpUpgraded}
                                                onChange={useHandler2((_, v) => ({ config: { isNpUpgraded: {$set: v } } }), props)} />
                                        } />
                                    <IconButton title="Save as Default"
                                        onClick={useCallback(() => {
                                            db.setServantDefaults(props.value.config);
                                            popupState.setOpen(false);
                                        }, [props.value.config])}>
                                        <Save />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </ClickAwayListener>
            </Popper>
        </React.Fragment>
    );
}

const renderLevelInput = (params: any) => <TextField {...params} label="Level" />;
const renderAppendInput = (params: any) => <TextField {...params} label="Append 3 Level" />;

export const CommandServantSelector = Commandable(ServantSelector, "onChange");