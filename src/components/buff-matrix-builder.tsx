import { Table, TableCell, TableContainer, TableRow, TextField, Tooltip, Box } from "@material-ui/core";
import { Warning } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import { Spec } from "immutability-helper";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffType, Servant } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseComponent, BaseProps, PercentInput, showIf } from "./common";
import { TransposedTableBody } from "./transposed-table"

interface BuffMatrixBuilderProps extends BaseProps<BuffMatrix> {
        readonly servants: Servant[];
        readonly maxPowerMods?: number;
        readonly warningTurns?: number[];
}

class BuffMatrixBuilder extends BaseComponent<BuffMatrix, BuffMatrixBuilderProps, any, any> {
    render() {
        let maxPowerMods = this.props.maxPowerMods ?? 3;
        let showNpBoost = this.props.servants.flatMap(s => s.data.skills).flatMap(s => s.buffs).some(b => b.type == BuffType.NpBoost);
        let showOc = this.props.servants
            .flatMap(s => s.data.skills.flatMap(s => s.buffs).concat(s.data.np.preBuffs).concat(s.data.np.postBuffs))
            .some(b => b.type == BuffType.Overcharge);
        return (
            <TableContainer>
                <Table>
                    <TransposedTableBody>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Attack Up</TableCell>
                            <TableCell>Card Type Up</TableCell>
                            <TableCell>NP Damage Up</TableCell>
                            {showIf(showNpBoost, <TableCell key={0}>NP Up Boost</TableCell>)}
                            {showIf(showOc, <TableCell key={0}>Overcharge</TableCell>)}
                            {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                                <TableCell key={pIndex * 2}>Power Mod{ maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</TableCell>,
                                <TableCell key={pIndex * 2 + 1}>Trigger{ maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</TableCell>
                            ])}
                        </TableRow>
                        {this.props.value.buffs.map((buffSet: BuffSet, index: number) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <strong>T{index + 1}</strong>
                                    <Box display={ this.props.warningTurns && this.props.warningTurns.some(t => t == index) ? "inline" : "none" }>
                                        &nbsp;
                                        <Tooltip title="Wave is cleared by support servant. Only put team buffs provided by this servant in this column!">
                                            <Warning />
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell><PercentInput value={buffSet.attackUp} onChange={v => { this.handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }); }} /></TableCell>
                                <TableCell><PercentInput value={buffSet.effUp} onChange={ v => { this.handleChange({ buffs : { [index]: { effUp: {$set: v} } } }); } } /></TableCell>
                                <TableCell><PercentInput value={buffSet.npUp} onChange={ v => { this.handleChange({ buffs : { [index]: { npUp: {$set: v} } } }); }} /></TableCell>
                                {showIf(showNpBoost, <TableCell key={0}><PercentInput value={buffSet.npBoost} onChange={ v => { this.handleChange({ buffs : { [index]: { npBoost: {$set: v} } } }); }} /></TableCell>)}
                                {showIf(showOc, <TableCell><PercentInput value={buffSet.overcharge} onChange={ v => { this.handleChange({ buffs : { [index]: { overcharge: {$set: v} } } }); }} /></TableCell>)}
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