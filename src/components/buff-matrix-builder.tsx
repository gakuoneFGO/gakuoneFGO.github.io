import { Table, TableCell, TableContainer, TableRow, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Spec } from "immutability-helper";
import { BuffSet, PowerMod } from "../Damage";
import { Trait } from "../Enemy";
import { BuffMatrix } from "../Strat";
import { BaseComponent, BaseProps, PercentInput } from "./common";
import { TransposedTableBody } from "./transposed-table"

class BuffMatrixBuilderProps implements BaseProps<BuffMatrix> {
    constructor(
        readonly value: BuffMatrix,
        readonly onChange: (state: BuffMatrix) => void,
        maxPowerMods?: number) {
        this.maxPowerMods = maxPowerMods ? maxPowerMods : 3;
    }

    readonly maxPowerMods: number;
}

class BuffMatrixBuilder extends BaseComponent<BuffMatrix, BuffMatrixBuilderProps, any, any> {
    render() {
        return (
            <TableContainer>
                <Table>
                    <TransposedTableBody>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Attack Up</TableCell>
                            <TableCell>Card Type Up</TableCell>
                            <TableCell>NP Damage Up</TableCell>
                            {/* TODO: hide this if no NP boosts in kit (this will be a pattern) */}
                            <TableCell>NP Up Boost</TableCell>
                            {Array.from(new Array(this.props.maxPowerMods)).flatMap((_, pIndex) => [
                                <TableCell key={pIndex * 2}>Power Mod{ this.props.maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</TableCell>,
                                <TableCell key={pIndex * 2 + 1}>Trigger{ this.props.maxPowerMods > 1 ? " " + (pIndex + 1).toString() : "" }</TableCell>
                            ])}
                        </TableRow>
                        {this.props.value.buffs.map((buffSet: BuffSet, index: number) => (
                            <TableRow key={index}>
                                <TableCell><strong>T{index + 1}</strong></TableCell>
                                <TableCell><PercentInput value={buffSet.attackUp} onChange={v => { this.handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }); }} /></TableCell>
                                <TableCell><PercentInput value={buffSet.effUp} onChange={ v => { this.handleChange({ buffs : { [index]: { effUp: {$set: v} } } }); } } /></TableCell>
                                <TableCell><PercentInput value={buffSet.npUp} onChange={ v => { this.handleChange({ buffs : { [index]: { npUp: {$set: v} } } }); }} /></TableCell>
                                <TableCell><PercentInput value={buffSet.npBoost} onChange={ v => { this.handleChange({ buffs : { [index]: { npBoost: {$set: v} } } }); }} /></TableCell>
                                {Array.from(new Array(this.props.maxPowerMods)).flatMap((_, pIndex) => [
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