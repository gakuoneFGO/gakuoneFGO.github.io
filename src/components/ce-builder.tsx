import { Box, Card, CardContent, CardHeader, TextField, Autocomplete, Grid, Typography, Stack } from "@mui/material";
import React from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType, CardType } from "../Servant";
import { BaseComponent, BaseProps, PercentInput, ArrayBuilder, handleChange } from "./common";
import { Trait } from "../Enemy";

interface BuffSelectorProps extends BaseProps<Buff> {
    
}

class BuffSelector extends BaseComponent<Buff, BuffSelectorProps, any, any> {
    render() {
        return (
            <React.Fragment>
                <Autocomplete
                    options={Object.values(BuffType)}
                    value={this.props.value.type}
                    renderInput={params => <TextField label="Buff Type" {...params} variant="outlined" />}
                    onChange={(_, v) => this.handleBuffTypeChanged(v)}
                    disableClearable={true} />
                <PercentInput
                    value={this.props.value.val}
                    onChange={ v => { this.handleChange({ val: { $set: v } }); }}
                    label="Buff Value" />
                {this.props.value.type == BuffType.CardTypeUp ?
                    <Autocomplete
                        options={Object.values(CardType)}
                        value={this.props.value.cardType ?? CardType.Extra}
                        renderInput={params => <TextField label="Card Type" {...params} variant="outlined" />}
                        onChange={(_, v) => this.handleChange({ cardType: {$set: v } })}
                        disableClearable={true} />
                : null}
                {this.props.value.type == BuffType.PowerMod ?
                    <Autocomplete
                        options={Object.values(Trait)}
                        value={this.props.value.trig ?? Trait.Never}
                        renderInput={params => <TextField label="Trigger" {...params} variant="outlined" />}
                        onChange={(_, v) => this.handleChange({ trig: {$set: v } })}
                        disableClearable={true} />
                : null}
            </React.Fragment>
        );
    }

    handleBuffTypeChanged(type: BuffType) {
        var cardType: CardType | undefined = undefined;
        var trig: Trait | undefined = undefined;
        switch (type) {
            case BuffType.CardTypeUp:
                cardType = CardType.Buster;//TODO
                break;
            case BuffType.PowerMod:
                trig = Trait.Always;
                break;
        }
        this.handleChange({ type: {$set: type }, cardType: { $set: cardType }, trig: { $set: trig } });
    }
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
                            <Autocomplete
                                options={ceNames}
                                value={props.value.name}
                                renderInput={params => <TextField {...params} label="Select" variant="outlined" />}
                                onChange={(e, v) => { if (v) handleChange({ $set: ceMap.get(v) as CraftEssence }, props) }}
                                disableClearable={true} />
                        </Grid>
                        <Grid item xs={3} sm={12} md={3}>
                            <TextField
                                type="number" variant="outlined" fullWidth
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
                addLabel={<Typography>Add Enemy</Typography>} />
        </Stack>
    );
}

let ceList = [
    new CraftEssence("<None>", 0, []),
    new CraftEssence("Event Damage (+100%)", 0, [ new Buff(true, false, BuffType.PowerMod, 1, -1, undefined, Trait.Always) ]),
    new CraftEssence("Event Damage (MLB +200%)", 0, [ new Buff(true, false, BuffType.PowerMod, 2, -1, undefined, Trait.Always) ]),
    new CraftEssence("The Black Grail (Lvl 100)", 2400, [ new Buff(true, false, BuffType.NpDmgUp, .8, -1) ]),
    new CraftEssence("The Black Grail (Lvl 20)", 980, [ new Buff(true, false, BuffType.NpDmgUp, .6, -1) ]),
];

let ceNames = ceList.map(ce => ce.name).sort();
let ceMap = new Map<string, CraftEssence>(ceList.map(ce => [ ce.name, ce ]));

export { CEBuilder, BuffSelector }