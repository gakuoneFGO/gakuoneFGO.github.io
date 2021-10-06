import { Box, TextField, Autocomplete, Stack, Grid, Card, CardHeader, Typography } from "@mui/material";
import { ArrayBuilder, BaseProps, handleChange, IntegerInput, SaveableSelect, TraitSelect } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";
import { EnemyNode } from "../Strat";
import React from "react";
import { useData } from "../Data";
import update from "immutability-helper";

function EnemyBuilder(props: BaseProps<Enemy> & { showHealth?: Boolean }) {
    return (
        <React.Fragment>
            {props.showHealth ?
                <IntegerInput label="Enemy HP" value={props.value.hitPoints}
                    onChange={ v => { handleChange({ hitPoints: { $set: v } }, props)}} />
            : null}
            <Autocomplete
                options={Object.values(EnemyClass)}
                value={props.value.eClass}
                renderInput={params => <TextField {...params} label="Enemy Class" />}
                onChange={(e, v) => { if (v) handleChange({ $set: props.value.withClass(v) }, props); }} />
            <Autocomplete
                options={Object.values(EnemyAttribute)}
                value={props.value.attribute}
                renderInput={params => <TextField {...params} label="Enemy Attribute" />}
                onChange={(e, v) => { if (v) handleChange({ $set: props.value.withAttribute(v) }, props); }} />
            <TraitSelect
                label="Enemy Traits"
                value={props.value.traits}
                onChange={traits => { handleChange({ $set: props.value.withSpecificTraits(traits) }, props); }} />
        </React.Fragment>
    );
}

function NodeBuilder(props: BaseProps<EnemyNode>) {
    const [ data ] = useData();
    
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <SaveableSelect provider={data.nodes} {...props} label="Select Node" />
            </Grid>
            {props.value.waves.map((wave, index) => (
                <Grid key={index} item xs={12} sm={4} md={12} lg={4}>
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
    );
}

export { EnemyBuilder, NodeBuilder }