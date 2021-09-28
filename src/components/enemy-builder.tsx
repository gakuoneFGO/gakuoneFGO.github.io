import { Box, TextField, Autocomplete, Stack, Grid, Card, CardHeader, Typography, IconButton } from "@mui/material";
import { ArrayBuilder, BaseComponent, BaseProps, handleChange } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";
import { EnemyNode, Wave } from "../Strat";
import React from "react";

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
    return (
        <Stack spacing={2}>
            <Autocomplete
                options={nodeNames}
                value={props.value.name}
                renderInput={params => <TextField {...params} label="Select" variant="outlined" />}
                onChange={(e, v) => { if (v) handleChange({ $set: nodeMap.get(v) as EnemyNode }, props) }}
                disableClearable={true} />
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
                                renderHeader={() => <Typography>Wave {index + 1} Enemy</Typography>}
                                addLabel={<Typography>Add Wave {index + 1} Enemy</Typography>} />
                        </Stack>
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}

//TODO: move to json, autopopulate derived traits
let nodeList = [
    new EnemyNode("[LANCERS] Nursemas Band-aid Farming", [
        new Wave([
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 24945),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 33371),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 24526),
        ]),
        new Wave([
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 92001),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 34015),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 27176),
        ]),
        new Wave([
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 31308),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [
                Trait.Divine, Trait.DivineSpirit, Trait.Female, Trait.Humanoid, Trait.Riding, Trait.Servant, Trait.WeakToEnumaElish
            ], 151215),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [], 31869),
        ]),
    ]),
    new EnemyNode("[MIXED] Scatfest Round 1", [
        new Wave([
            new Enemy(EnemyClass.Rider, EnemyAttribute.Earth, [ Trait.Fae, Trait.Demonic, Trait.Humanoid, Trait.Male ], 48936),
            new Enemy(EnemyClass.Rider, EnemyAttribute.Sky, [ Trait.WildBeast ], 29402),
        ]),
        new Wave([
            new Enemy(EnemyClass.Rider, EnemyAttribute.Earth, [ Trait.WildBeast, Trait.Demonic, Trait.SuperLarge ], 101895),
        ]),
        new Wave([
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [
                Trait.BrynhildrsBeloved, Trait.Divine, /* Trait.HominidaeServant, */ Trait.Humanoid, Trait.Male, Trait.Servant, Trait.WeakToEnumaElish
            ], 201722),
            new Enemy(EnemyClass.Lancer, EnemyAttribute.Sky, [
                Trait.CostumeOwning, Trait.Female, /* Trait.HominidaeServant, */ Trait.Humanoid, Trait.King, Trait.Servant, Trait.WeakToEnumaElish
            ], 120082),
        ]),
    ])
];

let nodeNames = nodeList.map(node => node.name).sort();
let nodeMap = new Map<string, EnemyNode>(nodeList.map(node => [ node.name, node ]));

export { EnemyBuilder, NodeBuilder, nodeMap }