import { Box, TextField, Autocomplete, Stack, Grid, Card, CardHeader, Typography, IconButton, Popover, CardContent, useTheme, InputAdornment } from "@mui/material";
import { ArrayBuilder, BaseComponent, BaseProps, handleChange, SmartSelect } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";
import { EnemyNode, Wave } from "../Strat";
import React, { useState } from "react";
import { useData } from "../Data";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import update from "immutability-helper";
import { Save } from "@mui/icons-material";

function EnemyBuilder(props: BaseProps<Enemy> & { showHealth?: Boolean }) {
    return (
        <React.Fragment>
            {props.showHealth ?
                <TextField type="number" variant="outlined" fullWidth
                    label="Enemy HP" value={props.value.hitPoints.toString()}
                    onChange={(e) => { if (e.target.value) handleChange({ hitPoints: { $set: Number.parseInt(e.target.value) } }, props)}} />
            : null}
            <Autocomplete
                options={Object.values(EnemyClass)}
                value={props.value.eClass}
                renderInput={params => <TextField {...params} label="Enemy Class" variant="outlined" />}
                onChange={(e, v) => { if (v) handleChange({ $set: props.value.changeClass(v) }, props); }}
                disableClearable={true} />
            <Autocomplete
                options={Object.values(EnemyAttribute)}
                value={props.value.attribute}
                renderInput={params => <TextField {...params} label="Enemy Attribute" variant="outlined" />}
                onChange={(e, v) => { if (v) handleChange({ $set: props.value.changeAttribute(v) }, props); }}
                disableClearable={true} />
            <Autocomplete multiple
                options={Object.values(Trait).filter(t => t != Trait.Always && t != Trait.Never).sort()}
                value={props.value.traits}
                renderInput={params => <TextField {...params} label="Enemy Traits" variant="outlined" />}
                onChange={(e, v) => { if (v) handleChange({ traits: { $set: v as Trait[] } }, props); }} />
        </React.Fragment>
    );
}

function NodeBuilder(props: BaseProps<EnemyNode>) {
    const [ data ] = useData();
    const popupState = usePopupState({ variant: "popover", popupId: "ServantSelector" });
    const theme = useTheme();
    const [ state, setState ] = useState({ newName: "" });
    
    return (
        <Stack spacing={2}>
            <SmartSelect provider={data.nodes} {...props} label="Select Node"
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton {...bindTrigger(popupState)}>
                            <Save />
                        </IconButton>
                    </InputAdornment>
                } />
            <Popover {...bindPopover(popupState)}>
                <Card sx={{ border: 1, borderColor: theme.palette.divider /* TODO: use same rule as input outlines */ }}>
                    <CardContent>
                        <Stack justifyContent="space-evenly" spacing={2} direction="row">
                            <TextField variant="outlined" fullWidth label="Node Name" value={state.newName} onChange={e => setState({ newName: e.target.value })} />
                            <IconButton onClick={() => {
                                    if (state.newName){
                                        const node = update(props.value, { name: { $set: "*" + state.newName } })
                                        data.nodes.put(node);
                                        props.onChange(node);
                                        popupState.setOpen(false);
                                    }
                                }}>
                                <Save />
                            </IconButton>
                        </Stack>
                    </CardContent>
                </Card>
            </Popover>
            <Grid container spacing={2}>
                {props.value.waves.map((wave, index) => (
                    <Grid item xs={12} sm={4} md={12} lg={4}>
                        <Stack direction="column" spacing={2}>
                            <ArrayBuilder value={wave.enemies}
                                onChange={enemies => handleChange({ waves: { [index]: { enemies: { $set: enemies } } } }, props)}
                                createOne={() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0)}
                                renderOne={(enemy, props) => 
                                    <Stack spacing={2}>
                                        <EnemyBuilder value={enemy} showHealth {...props} />
                                    </Stack>
                                }
                                renderHeader={(_, eIndex) => <Typography>Wave {index + 1} Enemy {eIndex + 1}</Typography>}
                                addLabel={<Typography>Add Wave {index + 1} Enemy</Typography>} />
                        </Stack>
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}

export { EnemyBuilder, NodeBuilder }