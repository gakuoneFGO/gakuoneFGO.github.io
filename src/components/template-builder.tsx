import { Checkbox, FormControlLabel, Grid, Stack, Card, CardContent, Box, IconButton, Modal, Typography, List, ListItem, CardHeader, ListItemText, ListItemIcon } from "@mui/material";
import { db } from "../Data";
import { Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { BaseProps, handleChange, SaveableSelect } from "./common";
import { ServantSelector } from "./servant-selector";
import { CardType } from "../Servant";
import { Close, Info } from "@mui/icons-material";
import { useState } from "react";

function TemplateBuilder(props: BaseProps<Template> & { npCards: BaseProps<CardType[]> }) {
    const [open, setOpen] = useState(false);

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
                    saveLabel="Template Name"
                    customButtons={props.value.description ?
                        <IconButton title="Template Info" onClick={() => setOpen(true)}>
                            <Info />
                        </IconButton>
                    : undefined} />
                <Modal open={open} onClose={() => setOpen(false)}>
                    <Card sx={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxHeight: "100vh", overflowY: "auto"}}>
                        <CardHeader title="Template Info" action={<IconButton title="close" onClick={() => setOpen(false)}><Close /></IconButton>} />
                        <CardContent>
                            <Typography>{props.value.description}</Typography>
                            <List>
                                {props.value.instructions.map((instruction, turn) =>
                                    <ListItem key={turn}>
                                        <ListItemIcon>
                                            T{turn + 1}
                                        </ListItemIcon>
                                        <ListItemText primary={instruction} />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Modal>
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
                            <Stack justifyContent="space-evenly" direction="row">
                                {props.value.clearers.map((clearer, turn) =>
                                    <FormControlLabel key={turn}
                                        label={"NP T" + (turn + 1)}
                                        labelPlacement="bottom"
                                        control={
                                            <Checkbox checked={clearer == index}
                                                onChange={(_, v) => handleClearerChanged(v, turn, index)}
                                                disabled={!props.value.party[index].data.isSpecified()} />
                                        } />
                                )}
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