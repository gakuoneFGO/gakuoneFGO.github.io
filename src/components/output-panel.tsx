import React from "react";
import { Divider, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { StateWrapper } from "./common";
import { BuffMatrix, EnemyNode, MainServant, NodeDamage, Strat } from "../Strat";
import update from "immutability-helper";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";
import { Box } from "@mui/system";
import { BuffSet, Damage } from "../Damage";
import { TransposedTableBody } from "./transposed-table";

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
        let output = [ 1, 2, 3, 4, 5 ].map(npLevel => {
            const clearers = props.strat.getRealClearers();
            const tempStrat= props.strat.template.clearers.reduce((strat, clearerIndex, turn) => {
                //TODO: fix hack (abusing inappropriate knowledge of getRealClearers implementation)
                const clearer = update(clearers[turn][0], { config: { npLevel: { $set: npLevel } } });
                const buffs = clearers[turn][1] ?? BuffMatrix.create(clearers.length);
                return update(strat, { servants: { [clearerIndex]: { $set: new MainServant(clearer, buffs) } } });
            }, props.strat);
            return tempStrat.run(EnemyNode.uniform(props.enemy));
        });
        return new StateWrapper(output);
    }

    render() {
        return (
            <TableContainer>
                <Table>
                    <TransposedTableBody>
                        <TableRow>
                            <TableCell />
                            {this.state._.map((_, index) =>
                                <TableCell key={index}><Typography variant="body1">NP{index + 1}</Typography></TableCell>
                            )}
                        </TableRow>
                        {this.state._[0].damagePerWave.map((_, waveIndex) =>
                            <TableRow key={waveIndex}>
                                <TableCell><Typography variant="body1">T{waveIndex + 1}</Typography></TableCell>
                                {this.state._.map((nodeDamage, npIndex) =>
                                    <TableCell key={npIndex}>
                                        <Typography variant="body2">
                                            <NumberFormat displayType="text" thousandSeparator=","
                                                value={nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low} />
                                        </Typography>
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TransposedTableBody>
                </Table>
            </TableContainer>
        );
    }
}

function NodeOutputPanel(props: { node: EnemyNode, strat: Strat }) {
    let theme = useTheme();
    const THRESHOLD = 25000;
    let result = props.strat.run(props.node);

    let getColor = (enemy: Enemy, damage: Damage) => {
        let remaining = enemy.hitPoints - damage.low;
        if (remaining <= 0) return theme.palette.info;
        if (remaining <= THRESHOLD) return theme.palette.warning;
        return theme.palette.error;
    };
    
    return (
        <Box sx={{ display: "flex", gap: theme.spacing(1), alignItems: "stretch" }}>
            {result.damagePerWave.map((wave, wIndex) => 
                <Box key={wIndex} sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(1), flexGrow: 1 }}>
                    {wave.damagePerEnemy.map((damage, eIndex) => {
                        let enemy = props.node.waves[wIndex].enemies[eIndex];
                        let color = getColor(enemy, damage);
                        return (
                            <Paper key={eIndex} sx={{ backgroundColor: color.main, color: color.contrastText, flexGrow: 1,
                                display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <Typography textAlign="center">
                                    <NumberFormat displayType="text" thousandSeparator="," value={damage.low} />
                                </Typography>
                                <Divider variant="middle" sx={{ background: color.contrastText }} />
                                <Typography textAlign="center">
                                    <NumberFormat displayType="text" thousandSeparator="," value={enemy.hitPoints} />
                                </Typography>
                            </Paper>
                        );
                    })}
                    <Paper sx={{ background: theme.palette.refund.gradient, color: theme.palette.refund.contrastText, padding: theme.spacing(1) }}>
                        <Typography textAlign="center" fontStyle="italic">
                            <NumberFormat displayType="text" decimalScale={1} fixedDecimalScale suffix="%" value={98.9} />
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}

export { OutputPanel, NodeOutputPanel }