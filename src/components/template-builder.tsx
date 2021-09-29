import { Checkbox, FormControlLabel, Grid, TextField, Autocomplete, Stack, Card, CardContent, Box, Select } from "@mui/material";
import { useData } from "../Data";
import { Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { BaseComponent, BaseProps, handleChange, SmartSelect } from "./common";
import { ServantSelector } from "./servant-selector";

function TemplateBuilder(props: BaseProps<Template>) {
    const [ data ] = useData();

    function handleClearerChanged(value: boolean, turnIndex: number, clearerIndex: number) {
        if (!value) return;
        handleChange({ clearers: { [turnIndex]: { $set: clearerIndex } } }, props);
    }

    return (
        //Stack shifts the servant cards to the right for some reason, hence using column grid
        <Grid container spacing={2} direction="column">
            <Grid item>
                <SmartSelect provider={data.templates}
                    value={data.templates.get(props.value.name)}
                    onChange={v => props.onChange(data.getTemplate(v.name))}
                    label="Select Template" />
            </Grid>
            <Grid item container spacing={2}>
                {props.value.party.map((servant, index) =>(
                    <Grid item xs={12} sm={6} md={12} lg={4} key={index}>
                        <Card>
                            <CardContent>
                                <ServantSelector
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
            </Grid>
            <Grid item>
                <BuffMatrixBuilder value={props.value.buffs}
                    servants={props.value.party}
                    onChange={buffs => handleChange({ buffs: { $set: buffs } }, props)}
                    clearers={props.value.clearers.map(c => props.value.party[c])} />
            </Grid>
        </Grid>
    );
}

export { TemplateBuilder }