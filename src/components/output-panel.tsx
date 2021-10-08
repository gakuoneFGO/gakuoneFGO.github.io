import React from "react";
import { Divider, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useTheme } from "@mui/material";
import { EnemyNode, Strat } from "../Strat";
import update from "immutability-helper";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";
import { Box } from "@mui/system";
import { Damage } from "../Damage";
import { Warning } from "@mui/icons-material";

interface OutputPanelProps {
    strat: Strat;
    enemy: Enemy;
}

export const OutputPanel = React.memo((props: OutputPanelProps) => {
    const theme = useTheme();
    const output = [ 1, 2, 3, 4, 5 ].map(npLevel => props.strat.setNpLevel(npLevel).run(EnemyNode.uniform(props.enemy)));
    const selectedNpLevels = props.strat.getRealClearers().map(c => c[0].config.npLevel);

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                    <TableCell />
                        {props.strat.template.clearers.map((_, turn) => (
                            <TableCell key={turn}><Typography sx={{textAlign: "center"}}>T{turn + 1}</Typography></TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {output.map((nodeDamage, npIndex) =>
                        <TableRow key={npIndex}>
                            <TableCell><Typography sx={{textAlign: "center"}}>NP{npIndex + 1}</Typography></TableCell>
                            {nodeDamage.damagePerWave.map((waveDamage, turn) =>
                                <TableCell key={turn} sx={selectedNpLevels[turn] == npIndex + 1 ?
                                    {backgroundColor: theme.palette.warning.light, color: theme.palette.warning.contrastText} : {}}>
                                    <Typography variant="body2" sx={{textAlign: "center"}}>
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
    const nps = props.strat.getRealClearers().map((clearer, turn) => clearer[0].data.getNP(props.strat.npCards[turn]));

    const getColor = (enemy: Enemy, damage: Damage) => {
        const remaining = enemy.hitPoints - damage.low;
        if (remaining <= 0) return theme.palette.info;
        if (remaining <= THRESHOLD) return theme.palette.warning;
        return theme.palette.error;
    };
    
    return (
        <React.Fragment>
            <Grid container>
                {props.node.waves.map((wave, turn) =>
                    <Grid item xs={4} lg={4} textAlign="center">
                        {nps[turn].target == "st" && wave.enemies.length > 1 ?
                            <Tooltip title="Single target NP is selected for this wave. Damage is displayed for all enemies but can apply only to one.">
                                <Warning color="warning" />
                            </Tooltip>
                        : null}
                    </Grid>
                )}
            </Grid>
            <Box sx={{ display: "flex", gap: theme.spacing(1), alignItems: "stretch" }}>
                {result.damagePerWave.map((wave, turn) => 
                    <Box key={turn} sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(1), flexGrow: 1 }}>
                        {wave.damagePerEnemy.map((damage, eIndex) => {
                            const enemy = props.node.waves[turn].enemies[eIndex];
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
        </React.Fragment>
    );
}