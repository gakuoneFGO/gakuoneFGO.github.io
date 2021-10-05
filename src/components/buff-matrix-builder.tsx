import { Clear, Replay, Visibility, VisibilityOff, Warning } from "@mui/icons-material";
import { Table, TableCell, TableContainer, TableRow, TextField, Tooltip, Box, ButtonGroup, Button, Typography, IconButton, Stack, useMediaQuery, capitalize } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { useTheme } from "@mui/material";
import { Spec } from "immutability-helper";
import { useState } from "react";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffType, CardType, Servant } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseProps, handleChange as commonHandleChange, handleChange, PercentInput, TraitSelect } from "./common";
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
    //can't short circuit with hooks
    const compressed = [useMediaQuery(theme.breakpoints.only("xs")), useMediaQuery(theme.breakpoints.only("md"))].reduce((a, b) => a || b);
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
        <Button variant={"contained"} title={capitalize(cardType)}
            style={{backgroundColor: color}}>
            <Typography variant="button">{cardType[0]}</Typography>
        </Button> :
        <Button variant={"outlined"} title={capitalize(cardType)}
            disabled={!props.servants.includes(props.clearers[turn]) || !validCardTypes[turn].includes(cardType)}
            onClick={_ => handleChange({ [turn]: { $set: cardType } }, props.npCards)}>
            <Typography variant="button">{cardType[0]}</Typography>
        </Button>
    );

    return (
        <TableContainer>
            <Table>
                <TransposedTableBody>
                    <TableRow>
                        <TableCell>
                            <Stack direction={{ xs: "column", sm: "row", md: "column", lg: "row" }} justifyContent="space-between">
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
                        {showCardType ?
                            <TableCell>
                                <Tooltip title="NP type, for servants such as Space Ishtar that conditionally change NP type.">
                                    <img src="images/buffs/npTypeChange.png" />
                                </Tooltip>
                            </TableCell>
                        : null}
                        <TableCell>
                            <Tooltip title="Attack up buffs, plus defense down debuffs on enemies.">
                                <img src="images/buffs/attackUp.png" />
                            </Tooltip>
                        </TableCell>
                        <TableCell>
                            <Tooltip title="Card effectiveness up buffs, plus card resistance down debuffs on enemies. Make sure that the card being buffed matches the NP type for that turn.">
                                <Stack direction={{ xs: "column", sm: "row", md: "column", lg: "row" }} justifyContent="space-between">
                                    <img src="images/buffs/busterUp.png" />
                                    <img src="images/buffs/artsUp.png" />
                                    <img src="images/buffs/quickUp.png" />
                                </Stack>
                            </Tooltip>
                        </TableCell>
                        <TableCell>
                            <Tooltip title="NP damage up buffs.">
                                <img src="images/buffs/npDmgUp.png" />
                            </Tooltip>
                        </TableCell>
                        {showNpBoost ?
                            <TableCell>
                                <Tooltip title="NP damage effectiveness boost provided by Oberon's third skill. This does not stack, so don't enter a value higher than 100%!">
                                    <img src="images/buffs/npBoost.png" />
                                </Tooltip>
                            </TableCell>
                        : null}
                        {showOc ?
                            <TableCell>
                                <Tooltip title="Additional overcharge level beyond 100%. This is used to calculate supereffective damage (AKA extra damage), as well as Arash and Chen Gong's multipliers. Other overcharge effects will NOT be accounted for; please enter such buffs manually.">
                                    <img src="images/buffs/ocUp.png" />
                                </Tooltip>
                            </TableCell>
                        : null}
                        {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                            <TableCell key={pIndex * 2}>
                                <Tooltip title="Power mod buffs. This generally includes event damage bonuses and buffs worded as 'apply Special Attack [X]', but not 'deal heavy Special Attack [X]'. Rule of thumb: if it's an NP effect that doesn't specify a certain number of turns/times, then it's NOT a power mod.">
                                    <img src="images/buffs/powerMod.png" />
                                </Tooltip>
                            </TableCell>,
                            <TableCell key={pIndex * 2 + 1}>
                                <Tooltip title='Trait(s) that triggers the power mod above to apply. "Always" can be entered to force it to be included in the calculation. Note that there is a difference between one buff with two triggers (e.g. Morgan) and two buffs with two different triggers (e.g. Lancer Artoria).'>
                                    <img src="images/buffs/trigger.png" />
                                </Tooltip>
                            </TableCell>
                        ])}
                        <TableCell>
                            <Tooltip title="Traits forcefully applied to enemies on each turn, such as Romulus=Quirinus' Roman trait debuff or Summer Kama's charm.">
                                <img src="images/buffs/individuality.png" />
                            </Tooltip>
                        </TableCell>
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
                                    <ButtonGroup orientation={compressed ? "vertical" : "horizontal"}>
                                        {makeButton(CardType.Buster, theme.palette.buster.main, index)}
                                        {makeButton(CardType.Arts, theme.palette.arts.main, index)}
                                        {makeButton(CardType.Quick, theme.palette.quick.main, index)}
                                    </ButtonGroup>
                                </TableCell>
                            : null}
                            <TableCell><PercentInput label="Attack Up" value={buffSet.attackUp} onChange={v => { handleChange({ buffs: { [index]: { attackUp: { $set: v } } } }, props); }} /></TableCell>
                            <TableCell><PercentInput label="Card Type Up" value={buffSet.cardUp} onChange={ v => { handleChange({ buffs: { [index]: { cardUp: { $set: v } } } }, props); } } /></TableCell>
                            <TableCell><PercentInput label="NP Damage Up" value={buffSet.npUp} onChange={ v => { handleChange({ buffs: { [index]: { npUp: { $set: v } } } }, props); }} /></TableCell>
                            {showNpBoost ? <TableCell><PercentInput label="NP Up Boost" value={buffSet.npBoost} onChange={ v => { handleChange({ buffs : { [index]: { npBoost: { $set: v } } } }, props); }} /></TableCell> : null}
                            {showOc ? <TableCell><PercentInput label="Overcharge" value={buffSet.overcharge} onChange={ v => { handleChange({ buffs : { [index]: { overcharge: { $set: v } } } }, props); }} /></TableCell> : null}
                            {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                                <TableCell key={pIndex * 2}>
                                    <PercentInput label={`Power Mod ${pIndex + 1}`}
                                        value={buffSet.powerMods[pIndex].modifier}
                                        onChange={ v => { handlePowerModChange({ modifier: {$set: v} }, pIndex, index); }} />
                                </TableCell>,
                                <TableCell key={pIndex * 2 + 1}>
                                    <TraitSelect label={`Trigger ${pIndex + 1}`}
                                        value={buffSet.powerMods[pIndex].trigger}
                                        onChange={v => handlePowerModChange({ trigger: {$set: v } }, pIndex, index)} />
                                </TableCell>
                            ])}
                            <TableCell>
                                <TraitSelect label="Add Enemy Traits"
                                    value={buffSet.applyTraits}
                                    onChange={v => handleChange({ buffs: { [index]: { applyTraits: { $set: v } } } }, props)} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TransposedTableBody>
            </Table>
        </TableContainer>
    );
}

export { BuffMatrixBuilder }