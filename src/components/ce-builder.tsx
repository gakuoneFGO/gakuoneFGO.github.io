import { Card, CardContent, CardHeader, TextField, Autocomplete, Grid, Typography, Stack } from "@mui/material";
import React, { useCallback } from "react";
import { CraftEssence } from "../calc/damage";
import { Buff, BuffType, CardType } from "../calc/servant";
import { PercentInput, ArrayBuilder, TraitSelect, SaveableSelect, IntegerInput, useHandler, useHandler2, Props, Commandable } from "./common";
import { Trait } from "../calc/enemy";
import { db } from "../calc/data";
import { Spec } from "immutability-helper";

export const BuffSelector = React.memo(function(props: Props<Buff>): JSX.Element {
    const handleBuffTypeChanged = useHandler2((_: any, type: BuffType) => {
        const cardType = type == BuffType.CardTypeUp ? CardType.Buster : undefined;
        const trig =
            type == BuffType.PowerMod ? [Trait.Always] :
            type == BuffType.AddTrait ? [] : undefined;
        return { type: {$set: type }, cardType: { $set: cardType }, trig: { $set: trig } };
    }, props);

    const onValueChanged = useHandler((spec: Spec<number>) => ({ val: spec }), props);
    const onCardChanged = useHandler2((_: any, v: CardType) => ({ cardType: { $set: v } }), props);
    const onTrigChanged = useHandler((spec: Spec<Trait[] | undefined>) => ({ trig: spec }), props);

    return (
        <>
            <Autocomplete
                options={Object.values(BuffType)}
                value={props.value.type}
                renderInput={params => <TextField label="Buff Type" {...params} />}
                disableClearable
                onChange={handleBuffTypeChanged} />
            {props.value.type != BuffType.AddTrait && props.value.type != BuffType.DamagePlus ?
                <PercentInput
                    value={props.value.val}
                    onChange={onValueChanged}
                    label="Buff Value" />
            : null}
            {props.value.type == BuffType.DamagePlus ?
                <IntegerInput
                    value={props.value.val}
                    onChange={onValueChanged}
                    label="Buff Value" />
            : null}
            {props.value.type == BuffType.CardTypeUp ?
                <Autocomplete
                    options={Object.values(CardType)}
                    value={props.value.cardType ?? CardType.Extra}
                    renderInput={params => <TextField label="Card Type" {...params} />}
                    disableClearable
                    onChange={onCardChanged} />
            : null}
            {props.value.type == BuffType.PowerMod || props.value.type == BuffType.AddTrait ?
                <TraitSelect
                    label="Buff Trigger"
                    value={props.value.trig ?? []}
                    onChange={onTrigChanged} />
            : null}
        </>
    );
});

const CommandBuffSelector = Commandable(BuffSelector, "onChange");

interface CEBuilderProps extends Props<CraftEssence> {
    label: string;
}

export const CEBuilder = React.memo(function(props: CEBuilderProps) {
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
                                onChange={useHandler(v => ({ attackStat: v }), props)} />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <ArrayBuilder value={props.value.buffs}
                onChange={useHandler(buffs => ({ buffs: buffs }), props)}
                createOne={useCallback(() => new Buff(true, false, BuffType.NpDmgUp, 0, -1), [])}
                renderOne={useCallback((buff: Buff, index, onChange: (index: number, spec: Spec<Buff>) => void) => (
                    <Stack direction="column" spacing={2}>
                        <CommandBuffSelector value={buff} command={index} onCommand={onChange} />
                    </Stack>
                ), [])}
                addLabel={<Typography>Add Buff</Typography>} />
        </Stack>
    );
});