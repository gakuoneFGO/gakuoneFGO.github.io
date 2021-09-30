import { Clear, Replay, Visibility, VisibilityOff, Warning } from "@mui/icons-material";
import { Table, TableCell, TableContainer, TableRow, TextField, Tooltip, Box, ButtonGroup, Button, Typography, IconButton, Stack } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { useTheme } from "@mui/material";
import { Spec } from "immutability-helper";
import { useState } from "react";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffType, CardType, Servant } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseProps, handleChange as commonHandleChange, handleChange, PercentInput } from "./common";
import { TransposedTableBody } from "./transposed-table"

interface BuffMatrixBuilderProps extends BaseProps<BuffMatrix> {
        readonly servants: Servant[];
        readonly clearers: Servant[];
        readonly npCards: BaseProps<CardType[]>;
        readonly doRefresh: () => void;
        readonly maxPowerMods?: number;
        readonly warnOtherNp?: true | undefined;
}

function BuffMatrixBuilder(props: BuffMatrixBuilderProps) {
    const theme = useTheme();
    const [ state, setState ] = useState({ showAll: false });

    const handlePowerModChange = (spec: Spec<PowerMod, never>, modIndex: number, buffIndex: number) => {
        handleChange({ buffs : { [buffIndex]: { powerMods: { [modIndex]: spec } } } }, props);
    };
    
    const maxPowerMods = props.maxPowerMods ?? 3;
    const showNpBoost = state.showAll || props.servants.flatMap(s => s.data.skills).flatMap(s => s.buffs).some(b => b.type == BuffType.NpBoost);
    const showOc = state.showAll || props.servants
        .flatMap(s => s.data.skills.flatMap(s => s.buffs).concat(s.data.nps.flatMap(np => np.preBuffs)).concat(s.data.nps.flatMap(np => np.postBuffs)))
        .some(b => b.type == BuffType.Overcharge);
    const showCardType = state.showAll || props.servants.some(s => s.data.nps.length > 1);
    const validCardTypes = props.clearers.map(s => s.data.nps.map(np => np.cardType));

    //this is just a component without the nice syntax, but ButtonGroup doesn't work when I actually make it a component
    const makeButton = (cardType: CardType, color: string, turn: number) => (
        props.npCards.value[turn] == cardType ? 
        <Button variant={"contained"}
            style={{backgroundColor: color}}>
            <Typography variant="button">{cardType}</Typography>
        </Button> :
        <Button variant={"outlined"}
            disabled={!props.servants.includes(props.clearers[turn]) || !validCardTypes[turn].includes(cardType)}
            onClick={_ => handleChange({ [turn]: { $set: cardType } }, props.npCards)}>
            <Typography variant="button">{cardType}</Typography>
        </Button>
    );

    return (
        <TableContainer>
            <Table>
                <TransposedTableBody>
                    <TableRow>
                        <TableCell>
                            <Stack direction="row" justifyContent="space-between">
                                <IconButton title={state.showAll ? "Hide Extra Buffs" : "Show All Buffs" } onClick={() => setState({ showAll: !state.showAll })}>
                                    {state.showAll ? <VisibilityOff key={"0"} /> : < Visibility key={"0"} />}
                                </IconButton>
                                <IconButton title="Clear All" onClick={() => props.onChange(BuffMatrix.create(props.value.buffs.length))}>
                                    <Clear />
                                </IconButton>
                                <IconButton title="Reset" onClick={props.doRefresh}>
                                    <Replay />
                                </IconButton>
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
                                        {makeButton(CardType.Buster, theme.palette.buster.main, index)}
                                        {makeButton(CardType.Arts, theme.palette.arts.main, index)}
                                        {makeButton(CardType.Quick, theme.palette.quick.main, index)}
                                    </ButtonGroup>
                                </TableCell>
                            : null}
                            <TableCell><PercentInput value={buffSet.attackUp} onChange={v => { handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }, props); }} /></TableCell>
                            <TableCell><PercentInput value={buffSet.cardUp} onChange={ v => { handleChange({ buffs : { [index]: { cardUp: {$set: v} } } }, props); } } /></TableCell>
                            <TableCell><PercentInput value={buffSet.npUp} onChange={ v => { handleChange({ buffs : { [index]: { npUp: {$set: v} } } }, props); }} /></TableCell>
                            {showNpBoost ? <TableCell><PercentInput value={buffSet.npBoost} onChange={ v => { handleChange({ buffs : { [index]: { npBoost: {$set: v} } } }, props); }} /></TableCell> : null}
                            {showOc ? <TableCell><PercentInput value={buffSet.overcharge} onChange={ v => { handleChange({ buffs : { [index]: { overcharge: {$set: v} } } }, props); }} /></TableCell> : null}
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