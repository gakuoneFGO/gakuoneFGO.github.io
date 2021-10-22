import React from "react";
import { Divider, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useTheme } from "@mui/material";
import { EnemyNode, Strat } from "../Strat";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";
import { Box } from "@mui/system";
import { NpResult, Range } from "../Damage";
import { ResetTvOutlined, Warning } from "@mui/icons-material";
import { ClassIcon } from "./icons";

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
                                    {backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText} : {}}>
                                    <Typography variant="body2" sx={{textAlign: "center"}}>
                                        <IntFormat value={waveDamage.damagePerEnemy[0].damage.low} />
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

export const NodeOutputPanel = React.memo(function(props: { node: EnemyNode, strat: Strat, tooltipPlacement: "top" | "bottom" | "left" | "right" }) {
    const theme = useTheme();
    const result = props.strat.run(props.node);
    const nps = props.strat.getRealClearers().map((clearer, turn) => clearer[0].data.getNP(props.strat.npCards[turn]));

    const getColor = (enemy: Enemy, damage: Range<number>) => {
        const remaining = enemy.hitPoints - damage.low;
        if (remaining <= 0) return theme.palette.info;
        if (remaining <= THRESHOLD) return theme.palette.warning;
        return theme.palette.error;
    };
    
    return (
        <React.Fragment>
            <Grid container>
                {props.node.waves.map((wave, turn) =>
                    <Grid key={turn} item xs={4} lg={4} textAlign="center">
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
                        {wave.damagePerEnemy.map((enemyResult, eIndex) => {
                            const enemy = props.node.waves[turn].enemies[eIndex];
                            const color = getColor(enemy, enemyResult.damage);
                            return (
                                <Paper key={eIndex} sx={{ backgroundColor: color.main, color: color.contrastText, flexGrow: 1 }}>
                                    <Tooltip placement={props.tooltipPlacement} arrow title={<EnemyTooltip result={enemyResult} />}>
                                        <Grid container direction="row" alignItems="center" height="100%">
                                            <Grid item xs={3}>
                                                <ClassIcon type={props.node.waves[turn].enemies[eIndex].eClass} style={{width: "100%", height: "100%"}} />
                                            </Grid>
                                            <Grid item xs={9} sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                                <Typography textAlign="center">
                                                    <IntFormat value={enemyResult.damage.low} />
                                                </Typography>
                                                <Divider variant="middle" sx={{ background: color.contrastText }} />
                                                <Typography textAlign="center">
                                                    <IntFormat value={enemy.hitPoints} />
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Tooltip>
                                </Paper>
                            );
                        })}
                        <Paper sx={{ background: theme.palette.refund.gradient, color: theme.palette.refund.contrastText,
                            visibility: turn == props.node.waves.length - 1 ? "hidden" : "initial" }}>
                            <Typography textAlign="center" style={{ textShadow: "1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" }}>
                                <PercentFormat value={wave.refund.low.value()} />
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </Box>
        </React.Fragment>
    );
});

function EnemyTooltip(props: { result: NpResult }) {
    return (
        <Box>
            <Typography>Min Damage: <IntFormat value={props.result.damage.low} /></Typography>
            <Typography>Avg Damage: <IntFormat value={props.result.damage.average} /></Typography>
            <Typography>Max Damage: <IntFormat value={props.result.damage.high} /></Typography>
            {props.result.refund.low.refunded.value() > 0 ? [
                <Typography key={-1}>Min Overkill Hits: {props.result.refund.low.getOverkillHitCount()} / {props.result.refund.low.hpAfterHit.length}</Typography>,
                ...props.result.refund.low.getFacecardThresholds().map((threshold, index) =>
                    <Typography key={index}>Do <IntFormat value={threshold.fcDamage} /> damage with facecards to guarantee <PercentFormat value={threshold.extraRefund.value()} /> additional refund.</Typography>
                )
            ] : null}
        </Box>
    );
}

const IntFormat = React.memo(function(props: {value: number}) {
    return (
        <NumberFormat displayType="text" thousandSeparator="," decimalScale={0} value={props.value} />
    )
});

const PercentFormat = React.memo(function(props: {value: number}) {
    return (
        <NumberFormat displayType="text" decimalScale={2} fixedDecimalScale suffix="%" value={props.value} />
    );
});