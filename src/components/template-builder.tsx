import { Checkbox, FormControlLabel, Grid, Stack, Card, CardContent, Box, IconButton, Modal, Typography, List, ListItem, CardHeader, ListItemText, ListItemIcon } from "@mui/material";
import { db } from "../Data";
import { Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { Commandable, memoized, Props, SaveableSelect, useHandler, useHandler0, useHandler2, useHandler3 } from "./common";
import { CommandServantSelector, ServantSelector } from "./servant-selector";
import { CardType, Servant } from "../Servant";
import { Close, Info } from "@mui/icons-material";
import { useCallback, useState } from "react";
import { Spec } from "immutability-helper";

export function TemplateBuilder(props: Props<Template> & { npCards: Props<CardType[]> }) {
    const [open, setOpen] = useState(false);

    const onClearerChanged = useHandler3((command: { turn: number, slot: number }, _: any, value: boolean) =>
        value ? { clearers: { [command.turn]: { $set: command.slot } } } : { $apply: a => a }
    , props);

    const onServantChanged = useHandler2((slot: number, spec: Spec<Servant>) => ({ party: { [slot]: spec } }), props);
    const showInstruction = useCallback(() => setOpen(true), []);
    const hideInstruction = useCallback(() => setOpen(false), []);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={db.templates}
                    value={props.value.asSaveable()}
                    onChange={useHandler(template => ({ $set: db.getTemplate(template.$set.name) }), props)}
                    label="Select Template"
                    saveLabel="Template Name"
                    customButtons={props.value.description ?
                        <IconButton title="Template Info" onClick={showInstruction}>
                            <Info />
                        </IconButton>
                    : undefined} />
                <Modal open={open} onClose={hideInstruction}>
                    <Card sx={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxHeight: "100vh", overflowY: "auto"}}>
                        <CardHeader title="Template Info" action={<IconButton title="close" onClick={hideInstruction}><Close /></IconButton>} />
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
            {props.value.party.map((servant, slot) =>(
                <Grid item xs={12} sm={6} md={12} lg={4} key={slot}>
                    <Card>
                        <CardContent>
                            <CommandServantSelector
                                allowPlaceholder={true}
                                allowUnspecified={slot > 2} //first 3 slots are always filled
                                value={servant}
                                label={"Servant " + (slot + 1)}
                                command={slot}
                                onCommand={onServantChanged} />
                            <Stack justifyContent="space-evenly" direction="row">
                                {props.value.clearers.map((clearer, turn) =>
                                    <FormControlLabel key={turn}
                                        label={"NP T" + (turn + 1)}
                                        labelPlacement="bottom"
                                        control={
                                            <CommandCheckBox checked={clearer == slot}
                                                command={memoized({ turn, slot })}
                                                onCommand={onClearerChanged}
                                                disabled={!props.value.party[slot].data.isSpecified()} />
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
                    onChange={useHandler(buffs => ({ buffs: buffs }), props)}
                    clearers={props.value.clearers.map(c => props.value.party[c])}
                    npCards={props.npCards}
                    doRefresh={useHandler0(() => ({ buffs: { $set: db.getTemplate(props.value.name).buffs } }), props)} />
            </Grid>
        </Grid>
    );
}

const CommandCheckBox = Commandable(Checkbox, "onChange");