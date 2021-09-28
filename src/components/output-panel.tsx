import React from "react";
import { Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { StateWrapper } from "./common";
import { EnemyNode, NodeDamage, Strat } from "../Strat";
import update from "immutability-helper";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";
import { Box } from "@mui/system";
import { Damage } from "../Damage";

interface OutputPanelProps {
    strat: Strat;
    enemy: Enemy;
}

class OutputPanel extends React.Component<OutputPanelProps, StateWrapper<NodeDamage[]>, any> {
    constructor(props: OutputPanelProps) {
        super(props);
        this.state = new StateWrapper<NodeDamage[]>([]);
    }

    static getDerivedStateFromProps(props: OutputPanelProps): StateWrapper<NodeDamage[]> {
        let strat: Strat = props.strat;
        let output = [ 1, 2, 3, 4, 5 ].map(npLevel => {
            var tempStrat = update(strat, { servant: { config: { npLevel: { $set: npLevel } } } });
            //TODO: could use reduce instead. probably define a helper function then do that
            strat.template.clearers.flatMap(c => c).forEach(clearerIndex => {
                if (strat.template.party[clearerIndex].data.name != "<Placeholder>") {
                    tempStrat = update(tempStrat, { template: { party: { [clearerIndex]: { config: { npLevel: { $set: npLevel } } } } } });
                }
            });
            return tempStrat.run(EnemyNode.uniform(props.enemy));
        });
        return new StateWrapper(output);
    }

    render() {
        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            {this.state._.map((_, index) =>
                                <TableCell key={index}>NP{index + 1}</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state._[0].damagePerWave.map((_, waveIndex) =>
                            <TableRow key={waveIndex}>
                                <TableCell><strong>T{waveIndex + 1}</strong></TableCell>
                                {this.state._.map((nodeDamage, npIndex) =>
                                    <TableCell key={npIndex}>
                                        <NumberFormat displayType="text" thousandSeparator=","
                                            value={nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low} />
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

function NodeOutputPanel(props: { node: EnemyNode, strat: Strat }) {
    let theme = useTheme();
    const THRESHOLD = 25000;
    let result = props.strat.run(props.node);
    let getEnemy = (wIndex: number, eIndex: number) => props.node.waves[wIndex].enemies[eIndex];
    let getColor = (enemy: Enemy, damage: Damage) => {
        let remaining = enemy.hitPoints - damage.low;
        if (remaining <= 0) return theme.palette.info;
        if (remaining <= THRESHOLD) return theme.palette.warning;
        return theme.palette.error;
    };
    return (
        <Grid container direction="column" spacing={1}>
            {result.damagePerWave.map((wave, wIndex) => 
                <Grid item container spacing={1} columns={wave.damagePerEnemy.length}>
                    {wave.damagePerEnemy.map((damage, eIndex) =>
                        <Grid item md={1}>
                            {(() => {
                                let enemy = getEnemy(wIndex, eIndex);
                                let color = getColor(enemy, damage);
                                return (
                                    <Paper sx={{ backgroundColor: color.main, color: color.contrastText}}>
                                        <Typography textAlign="center">
                                            <NumberFormat displayType="text" thousandSeparator="," value={damage.low} />
                                            &nbsp;/&nbsp;
                                            <NumberFormat displayType="text" thousandSeparator="," value={enemy.hitPoints} />
                                        </Typography>
                                    </Paper>
                                );
                            })()}
                            
                        </Grid>
                    )}
                </Grid>
            )}
        </Grid>
    );
}

export { OutputPanel, NodeOutputPanel }