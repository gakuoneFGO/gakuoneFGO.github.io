import React from "react";
import { Divider, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { EnemyNode, Strat } from "../Strat";
import update from "immutability-helper";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";
import { Box } from "@mui/system";
import { Damage } from "../Damage";

interface OutputPanelProps {
    strat: Strat;
    enemy: Enemy;
}

export const OutputPanel = React.memo((props: OutputPanelProps) => {
    const output = [ 1, 2, 3, 4, 5 ].map(npLevel => props.strat.setNpLevel(npLevel).run(EnemyNode.uniform(props.enemy)));

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                    <TableCell />
                        {props.strat.template.clearers.map((_, turn) => (
                            <TableCell key={turn}><Typography>T{turn + 1}</Typography></TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {output.map((nodeDamage, npIndex) =>
                        <TableRow key={npIndex}>
                            <TableCell><Typography>NP{npIndex + 1}</Typography></TableCell>
                            {nodeDamage.damagePerWave.map((waveDamage, turn) =>
                                <TableCell key={turn}>
                                    <Typography variant="body2">
                                        <NumberFormat displayType="text" thousandSeparator=","
                                            value={waveDamage.damagePerEnemy[0].low} />
                                    </Typography>
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

const THRESHOLD = 25000;

export function NodeOutputPanel(props: { node: EnemyNode, strat: Strat }) {
    const theme = useTheme();
    const result = props.strat.run(props.node);

    const getColor = (enemy: Enemy, damage: Damage) => {
        const remaining = enemy.hitPoints - damage.low;
        if (remaining <= 0) return theme.palette.info;
        if (remaining <= THRESHOLD) return theme.palette.warning;
        return theme.palette.error;
    };
    
    return (
        <Box sx={{ display: "flex", gap: theme.spacing(1), alignItems: "stretch" }}>
            {result.damagePerWave.map((wave, wIndex) => 
                <Box key={wIndex} sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(1), flexGrow: 1 }}>
                    {wave.damagePerEnemy.map((damage, eIndex) => {
                        const enemy = props.node.waves[wIndex].enemies[eIndex];
                        const color = getColor(enemy, damage);
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
                    <Paper sx={{ background: theme.palette.refund.gradient, color: theme.palette.refund.contrastText }}>
                        <Typography textAlign="center" style={{ textShadow: "1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" }}>
                            <NumberFormat displayType="text" decimalScale={1} fixedDecimalScale suffix="%" value={98.9} />
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}