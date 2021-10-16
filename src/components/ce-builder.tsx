import { Card, CardContent, CardHeader, TextField, Autocomplete, Grid, Typography, Stack } from "@mui/material";
import React from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType, CardType } from "../Servant";
import { BaseProps, PercentInput, ArrayBuilder, handleChange, TraitSelect, SaveableSelect, IntegerInput } from "./common";
import { Trait } from "../Enemy";
import { db } from "../Data";

function BuffSelector(props: BaseProps<Buff>): JSX.Element {
    const handleBuffTypeChanged = (type: BuffType) => {
        const cardType = type == BuffType.CardTypeUp ? CardType.Buster : undefined;
        const trig =
            type == BuffType.PowerMod ? [Trait.Always] :
            type == BuffType.AddTrait ? [] : undefined;
        handleChange({ type: {$set: type }, cardType: { $set: cardType }, trig: { $set: trig } }, props);
    }

    return (
        <React.Fragment>
            <Autocomplete
                options={Object.values(BuffType)}
                value={props.value.type}
                renderInput={params => <TextField label="Buff Type" {...params} />}
                onChange={(_, v) => handleBuffTypeChanged(v!)} />
            {props.value.type != BuffType.AddTrait && props.value.type != BuffType.DamagePlus ?
                <PercentInput
                    value={props.value.val}
                    onChange={ v => handleChange({ val: { $set: v } }, props)}
                    label="Buff Value" />
            : null}
            {props.value.type == BuffType.DamagePlus ?
                <IntegerInput
                    value={props.value.val}
                    onChange={ v => handleChange({ val: { $set: v } }, props)}
                    label="Buff Value" />
            : null}
            {props.value.type == BuffType.CardTypeUp ?
                <Autocomplete
                    options={Object.values(CardType)}
                    value={props.value.cardType ?? CardType.Extra}
                    renderInput={params => <TextField label="Card Type" {...params} />}
                    onChange={(_, v) => handleChange({ cardType: {$set: v! } }, props)} />
            : null}
            {props.value.type == BuffType.PowerMod || props.value.type == BuffType.AddTrait ?
                <TraitSelect
                    label="Buff Trigger"
                    value={props.value.trig ?? []}
                    onChange={v => handleChange({ trig: {$set: v } }, props)} />
            : null}
        </React.Fragment>
    );
}

interface CEBuilderProps extends BaseProps<CraftEssence> {
    label: string;
}

function CEBuilder(props: CEBuilderProps) {
    return (
        <Stack spacing={2}>
            <Card>
                <CardHeader title={<Typography variant="h6">{props.label}</Typography>} />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={9} sm={12} md={9}>
                            <SaveableSelect provider={db.craftEssences} {...props} label="Select CE" saveLabel="CE Name" />
                        </Grid>
                        <Grid item xs={3} sm={12} md={3}>
                            <IntegerInput label="Attack Stat" value={props.value.attackStat}
                                onChange={v => { handleChange({ attackStat: { $set: v } }, props)}} />
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