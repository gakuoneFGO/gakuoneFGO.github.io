import { Box, TextField, Autocomplete, Stack, Grid, Card, CardHeader, Typography, IconButton } from "@mui/material";
import { ArrayBuilder, BaseComponent, BaseProps, handleChange } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";
import { EnemyNode, Wave } from "../Strat";
import React from "react";

function EnemyBuilder(props: BaseProps<Enemy>) {
    return (
        <React.Fragment>
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
    return (
        <Stack direction="row" spacing={2} justifyContent="space-evenly">
            {props.value.waves.map((wave, index) => (
                <Stack direction="column" spacing={2}>
                    <ArrayBuilder value={wave.enemies}
                        onChange={enemies => handleChange({ waves: { [index]: { enemies: { $set: enemies } } } }, props)}
                        createOne={() => new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0)}
                        renderOne={(enemy, props) => <EnemyBuilder value={enemy} {...props} />}
                        addLabel={<Typography>Add Enemy</Typography>} />
                </Stack>
            ))}
        </Stack>
    );
}

export { EnemyBuilder, NodeBuilder }