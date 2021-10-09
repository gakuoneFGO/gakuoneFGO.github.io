import { Checkbox, FormControlLabel, Grid, Stack, Card, CardContent, Box, useTheme } from "@mui/material";
import { db } from "../Data";
import { Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { BaseProps, handleChange, SaveableSelect } from "./common";
import { ServantSelector } from "./servant-selector";
import { CardType } from "../Servant";

function TemplateBuilder(props: BaseProps<Template> & { npCards: BaseProps<CardType[]> }) {
    function handleClearerChanged(value: boolean, turnIndex: number, clearerIndex: number) {
        if (!value) return;
        handleChange({ clearers: { [turnIndex]: { $set: clearerIndex } } }, props);
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={db.templates}
                    value={props.value.asSaveable()}
                    onChange={template => props.onChange(db.getTemplate(template.name))}
                    label="Select Template"
                    saveLabel="Template Name" />
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
                    doRefresh={() => handleChange({ buffs: { $set: db.getTemplate(props.value.name).buffs } }, props)} />
            </Grid>
        </Grid>
    );
}

export { TemplateBuilder }