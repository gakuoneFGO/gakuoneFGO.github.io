import { Clear, Replay, Warning } from "@mui/icons-material";
import { Table, TableCell, TableContainer, TableRow, TextField, Tooltip, Box, ButtonGroup, Button, Typography, IconButton, Stack } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { useTheme } from "@mui/material";
import { Spec } from "immutability-helper";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffType, CardType, Servant } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseProps, handleChange as commonHandleChange, PercentInput } from "./common";
import { TransposedTableBody } from "./transposed-table"

interface BuffMatrixBuilderProps extends BaseProps<BuffMatrix> {
        readonly servants: Servant[];
        readonly clearers: Servant[];
        readonly maxPowerMods?: number;
        readonly warnOtherNp?: true | undefined;
}

function BuffMatrixBuilder(props: BuffMatrixBuilderProps) {
    let theme = useTheme();

    let handleChange = (spec: Spec<BuffMatrix, never>) => commonHandleChange(spec, props);

    let handlePowerModChange = (spec: Spec<PowerMod, never>, modIndex: number, buffIndex: number) => {
        handleChange({ buffs : { [buffIndex]: { powerMods: { [modIndex]: spec } } } });
    };
    
    let maxPowerMods = props.maxPowerMods ?? 3;
    let showNpBoost = props.servants.flatMap(s => s.data.skills).flatMap(s => s.buffs).some(b => b.type == BuffType.NpBoost);
    let showOc = props.servants
        .flatMap(s => s.data.skills.flatMap(s => s.buffs).concat(s.data.nps.flatMap(np => np.preBuffs)).concat(s.data.nps.flatMap(np => np.postBuffs)))
        .some(b => b.type == BuffType.Overcharge);
    let showCardType = props.servants.some(s => s.data.nps.length > 1);
    let validCardTypes = props.clearers.map(s => s.data.nps.map(np => np.cardType));

    let makeButton = (cardType: CardType, color: string, buffSet: BuffSet, turn: number) => (
        buffSet.npCard == cardType ? 
        <Button variant={"contained"}
            style={{backgroundColor: color}}>
            <Typography variant="button">{cardType}</Typography>
        </Button> :
        <Button variant={"outlined"}
            disabled={!props.servants.includes(props.clearers[turn]) || !validCardTypes[turn].includes(cardType)}
            onClick={_ => handleChange({ buffs: { [turn]: { npCard: { $set: cardType } } } })}>
            <Typography variant="button">{cardType}</Typography>
        </Button>
    );

    return (
        <TableContainer>
            <Table>
                <TransposedTableBody>
                    <TableRow>
                        <TableCell>
                            <Stack direction="row" justifyContent="space-evenly">
                                <IconButton title="Clear All"><Clear /></IconButton>
                                <IconButton title="Reset"><Replay /></IconButton>
                            </Stack>
                        </TableCell>
                        {showCardType ? <TableCell><Typography>NP Type</Typography></TableCell> : null}
                        <TableCell><Typography>Attack Up</Typography></TableCell>
                        <TableCell><Typography>Card Type Up</Typography></TableCell>
                        <TableCell><Typography>NP Damage Up</Typography></TableCell>
                        {showNpBoost ? <TableCell><Typography>NP Up Boost</Typography></TableCell> : null}
                        {showOc ? <TableCell><Typography>Overcharge</Typography></TableCell> : null}
                        {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                            <TableCell key={pIndex * 2}><Typography>Power Mod{ maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</Typography></TableCell>,
                            <TableCell key={pIndex * 2 + 1}><Typography>Trigger{ maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</Typography></TableCell>
                        ])}
                    </TableRow>
                    {props.value.buffs.map((buffSet: BuffSet, index: number) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Typography display="inline">T{index + 1}</Typography>
                                <Box display={ props.warnOtherNp && !props.servants.includes(props.clearers[index]) ? "inline" : "none" }>
                                    &nbsp;
                                    <Tooltip title="Wave is cleared by another servant. Only put team buffs provided by this servant in this column!">
                                        <Warning color="warning" />
                                    </Tooltip>
                                </Box>
                            </TableCell>
                            {showCardType ?
                                <TableCell>
                                    <ButtonGroup>
                                        {makeButton(CardType.Buster, theme.palette.buster.main, buffSet, index)}
                                        {makeButton(CardType.Arts, theme.palette.arts.main, buffSet, index)}
                                        {makeButton(CardType.Quick, theme.palette.quick.main, buffSet, index)}
                                    </ButtonGroup>
                                </TableCell>
                            : null}
                            <TableCell><PercentInput value={buffSet.attackUp} onChange={v => { handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }); }} /></TableCell>
                            <TableCell><PercentInput value={buffSet.cardUp} onChange={ v => { handleChange({ buffs : { [index]: { cardUp: {$set: v} } } }); } } /></TableCell>
                            <TableCell><PercentInput value={buffSet.npUp} onChange={ v => { handleChange({ buffs : { [index]: { npUp: {$set: v} } } }); }} /></TableCell>
                            {showNpBoost ? <TableCell><PercentInput value={buffSet.npBoost} onChange={ v => { handleChange({ buffs : { [index]: { npBoost: {$set: v} } } }); }} /></TableCell> : null}
                            {showOc ? <TableCell><PercentInput value={buffSet.overcharge} onChange={ v => { handleChange({ buffs : { [index]: { overcharge: {$set: v} } } }); }} /></TableCell> : null}
                            {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                                <TableCell key={pIndex * 2}>
                                    <PercentInput
                                        value={buffSet.powerMods[pIndex].modifier}
                                        onChange={ v => { handlePowerModChange({ modifier: {$set: v} }, pIndex, index); }} />
                                </TableCell>,
                                <TableCell key={pIndex * 2 + 1}>
                                    <Autocomplete
                                        options={Object.values(Trait)}
                                        value={buffSet.powerMods[pIndex].trigger}
                                        renderInput={params => <TextField {...params} variant="outlined" />}
                                        onChange={(_, v) => handlePowerModChange({ trigger: {$set: v } }, pIndex, index)}
                                        disableClearable={true} />
                                </TableCell>
                            ])}
                        </TableRow>
                    ))}
                </TransposedTableBody>
            </Table>
        </TableContainer>
    );
}

export { BuffMatrixBuilder }