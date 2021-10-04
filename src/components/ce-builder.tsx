import { Box, Card, CardContent, CardHeader, TextField, Autocomplete, Grid, Typography, Stack, InputAdornment, IconButton, Popover, Paper, useTheme } from "@mui/material";
import React, { useState } from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType, CardType } from "../Servant";
import { BaseComponent, BaseProps, PercentInput, ArrayBuilder, handleChange, SmartSelect, TraitSelect } from "./common";
import { Trait } from "../Enemy";
import { useData } from "../Data";
import { Save } from "@mui/icons-material";
import { bindPopover, usePopupState, bindTrigger, bindToggle } from "material-ui-popup-state/hooks";
import update from "immutability-helper";

interface BuffSelectorProps extends BaseProps<Buff> {
    
}

class BuffSelector extends BaseComponent<Buff, BuffSelectorProps, any, any> {
    render() {
        return (
            <React.Fragment>
                <Autocomplete
                    options={Object.values(BuffType)}
                    value={this.props.value.type}
                    renderInput={params => <TextField label="Buff Type" {...params} />}
                    onChange={(_, v) => this.handleBuffTypeChanged(v!)} />
                {this.props.value.type != BuffType.AddTrait ?
                    <PercentInput
                        value={this.props.value.val}
                        onChange={ v => { this.handleChange({ val: { $set: v } }); }}
                        label="Buff Value" />
                : null}
                {this.props.value.type == BuffType.CardTypeUp ?
                    <Autocomplete
                        options={Object.values(CardType)}
                        value={this.props.value.cardType ?? CardType.Extra}
                        renderInput={params => <TextField label="Card Type" {...params} />}
                        onChange={(_, v) => this.handleChange({ cardType: {$set: v! } })} />
                : null}
                {this.props.value.type == BuffType.PowerMod || this.props.value.type == BuffType.AddTrait ?
                    <TraitSelect
                        label="Buff Trigger"
                        value={this.props.value.trig ?? []}
                        onChange={v => this.handleChange({ trig: {$set: v } })} />
                : null}
            </React.Fragment>
        );
    }

    handleBuffTypeChanged(type: BuffType) {
        const cardType = type == BuffType.CardTypeUp ? CardType.Buster : undefined;
        const trig = type == BuffType.PowerMod ? [Trait.Always] : undefined;
        this.handleChange({ type: {$set: type }, cardType: { $set: cardType }, trig: { $set: trig } });
    }
}

interface CEBuilderProps extends BaseProps<CraftEssence> {
    label: string;
}

function CEBuilder(props: CEBuilderProps) {
    const [ data ] = useData();
    const popupState = usePopupState({ variant: "popover", popupId: "ServantSelector" });
    const theme = useTheme();
    const [ state, setState ] = useState({ newName: "" });

    return (
        <Stack spacing={2}>
            <Card>
                <CardHeader title={<Typography variant="h6">{props.label}</Typography>} />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={9} sm={12} md={9}>
                            <SmartSelect provider={data.craftEssences} {...props} label="Select CE"
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
                                            <TextField autoFocus label="CE Name" value={state.newName} onChange={e => setState({ newName: e.target.value })} />
                                            <IconButton title="Save"
                                                onClick={() => {
                                                    if (state.newName){
                                                        const ce = update(props.value, { name: { $set: "* " + state.newName } })
                                                        data.craftEssences.put(ce);
                                                        props.onChange(ce);
                                                        popupState.setOpen(false);
                                                    }
                                                }}>
                                                <Save />
                                            </IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Popover>
                        </Grid>
                        <Grid item xs={3} sm={12} md={3}>
                            <TextField type="number"
                                label="Attack Stat" value={props.value.attackStat.toString()}
                                onChange={(e) => { if (e.target.value) handleChange({ attackStat: { $set: Number.parseInt(e.target.value) } }, props)}} />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <ArrayBuilder value={props.value.buffs}
                onChange={buffs => handleChange({ buffs: { $set: buffs } } , props)}
                createOne={() => new Buff(true, false, BuffType.NpDmgUp, 0, -1)}
                renderOne={(buff, props) => (
                    <Stack direction="column" spacing={2}>
                        <BuffSelector value={buff} {...props} />
                    </Stack>
                )}
                addLabel={<Typography>Add Buff</Typography>} />
        </Stack>
    );
}

export { CEBuilder, BuffSelector }