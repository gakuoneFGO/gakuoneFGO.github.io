import { Warning } from "@mui/icons-material";
import { Table, TableCell, TableContainer, TableRow, TextField, Tooltip, Box, ButtonGroup, Button, Typography } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { Spec } from "immutability-helper";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffType, CardType, Servant } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseComponent, BaseProps, PercentInput } from "./common";
import { TransposedTableBody } from "./transposed-table"

interface BuffMatrixBuilderProps extends BaseProps<BuffMatrix> {
        readonly servants: Servant[];
        readonly clearers: Servant[];
        readonly maxPowerMods?: number;
        readonly warnOtherNp?: true | undefined;
}

class BuffMatrixBuilder extends BaseComponent<BuffMatrix, BuffMatrixBuilderProps, any, any> {
    render() {
        let maxPowerMods = this.props.maxPowerMods ?? 3;
        let showNpBoost = this.props.servants.flatMap(s => s.data.skills).flatMap(s => s.buffs).some(b => b.type == BuffType.NpBoost);
        let showOc = this.props.servants
            .flatMap(s => s.data.skills.flatMap(s => s.buffs).concat(s.data.nps.flatMap(np => np.preBuffs)).concat(s.data.nps.flatMap(np => np.postBuffs)))
            .some(b => b.type == BuffType.Overcharge);
        let showCardType = this.props.servants.some(s => s.data.nps.length > 1);
        let validCardTypes = this.props.clearers.map(s => s.data.nps.map(np => np.cardType));
        return (
            <TableContainer>
                <Table>
                    <TransposedTableBody>
                        <TableRow>
                            <TableCell></TableCell>
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
                        {this.props.value.buffs.map((buffSet: BuffSet, index: number) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography display="inline">T{index + 1}</Typography>
                                    <Box display={ this.props.warnOtherNp && !this.props.servants.includes(this.props.clearers[index]) ? "inline" : "none" }>
                                        &nbsp;
                                        <Tooltip title="Wave is cleared by support servant. Only put team buffs provided by this servant in this column!">
                                            <Warning color="warning" />
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                {showCardType ?
                                    <TableCell>
                                        <ButtonGroup>
                                            <Button
                                                disabled={buffSet.npCard != CardType.Buster && (!this.props.servants.includes(this.props.clearers[index]) || !validCardTypes[index].includes(CardType.Buster))}
                                                variant={buffSet.npCard == CardType.Buster ? "contained" : "outlined"}
                                                style={buffSet.npCard == CardType.Buster ? {backgroundColor: "red"} : {}}
                                                onClick={_ => this.handleChange({ buffs: { [index]: { npCard: { $set: CardType.Buster } } } })}><Typography variant="button">Buster</Typography></Button>
                                            <Button
                                                disabled={buffSet.npCard != CardType.Arts && (!this.props.servants.includes(this.props.clearers[index]) || !validCardTypes[index].includes(CardType.Arts))}
                                                variant={buffSet.npCard == CardType.Arts ? "contained" : "outlined"}
                                                style={buffSet.npCard == CardType.Arts ? {backgroundColor: "blue"} : {}}
                                                onClick={_ => this.handleChange({ buffs: { [index]: { npCard: { $set: CardType.Arts } } } })}>Arts</Button>
                                            <Button
                                                disabled={buffSet.npCard != CardType.Quick && (!this.props.servants.includes(this.props.clearers[index]) || !validCardTypes[index].includes(CardType.Quick))}
                                                variant={buffSet.npCard == CardType.Quick ? "contained" : "outlined"}
                                                style={buffSet.npCard == CardType.Quick ? {backgroundColor: "green"} : {}}
                                                onClick={_ => this.handleChange({ buffs: { [index]: { npCard: { $set: CardType.Quick } } } })}>Quick</Button>
                                        </ButtonGroup>
                                    </TableCell>
                                : null}
                                <TableCell><PercentInput value={buffSet.attackUp} onChange={v => { this.handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }); }} /></TableCell>
                                <TableCell><PercentInput value={buffSet.cardUp} onChange={ v => { this.handleChange({ buffs : { [index]: { cardUp: {$set: v} } } }); } } /></TableCell>
                                <TableCell><PercentInput value={buffSet.npUp} onChange={ v => { this.handleChange({ buffs : { [index]: { npUp: {$set: v} } } }); }} /></TableCell>
                                {showNpBoost ? <TableCell><PercentInput value={buffSet.npBoost} onChange={ v => { this.handleChange({ buffs : { [index]: { npBoost: {$set: v} } } }); }} /></TableCell> : null}
                                {showOc ? <TableCell><PercentInput value={buffSet.overcharge} onChange={ v => { this.handleChange({ buffs : { [index]: { overcharge: {$set: v} } } }); }} /></TableCell> : null}
                                {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                                    <TableCell key={pIndex * 2}>
                                        <PercentInput
                                            value={buffSet.powerMods[pIndex].modifier}
                                            onChange={ v => { this.handlePowerModChange({ modifier: {$set: v} }, pIndex, index); }} />
                                    </TableCell>,
                                    <TableCell key={pIndex * 2 + 1}>
                                        <Autocomplete
                                            options={Object.values(Trait)}
                                            value={buffSet.powerMods[pIndex].trigger}
                                            renderInput={params => <TextField {...params} variant="outlined" />}
                                            onChange={(_, v) => this.handlePowerModChange({ trigger: {$set: v } }, pIndex, index)}
                                            disableClearable={true} />
                                    </TableCell>
                                ])}
                            </TableRow>
                        ))}
                    </TransposedTableBody>
                </Table>
            </TableContainer>
        )
    }

    handlePowerModChange(spec: Spec<PowerMod, never>, modIndex: number, buffIndex: number) {
        this.handleChange({ buffs : { [buffIndex]: { powerMods: { [modIndex]: spec } } } });
    }
}

export { BuffMatrixBuilder }