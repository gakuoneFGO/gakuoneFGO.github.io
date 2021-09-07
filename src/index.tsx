import * as React from "react";
import * as ReactDOM from "react-dom";
import NumberFormat from "react-number-format";
import { Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import update from "immutability-helper";
import { Spec } from "immutability-helper";

import { Template, BuffMatrix } from "./Strat";
import { BuffSet, PowerMod } from "./Damage";
import { Servant, ServantData, Trigger, CardType, ServantClass, GrowthCurve, ServantAttribute } from "./Servant";
import { allData } from "./Data";

class TemplateBuilder extends React.Component<any, Template, any> {
    constructor(props: any) {
        super(props);
        this.state = new Template("Test Template", emptyBuffMatrix(), emptyParty(), [1, 0, 0], "Test description", ["do this T1", "do this T2", "do this T3"]);
    }

    render() {
        return (
            <div>
                {this.state.party.map((servant, index) =>(
                    <ServantSelector key={index}
                        servant={servant}
                        label={"Servant " + (index + 1)}
                        onChange={(s: Servant) => this.setState(update(this.state, { party: { [index]: { $set: s } } }))} />
                ))}
                <BuffMatrixBuilder buffMatrix={this.state.buffs}></BuffMatrixBuilder>
            </div>
        );
    }
}

class ServantSelector extends React.Component<any, Servant, any> {
    constructor(props: any) {
        super(props);
        this.state = props.servant;
        this.handleNameChanged = this.handleNameChanged.bind(this);
    }

    render() {
        return (
            <Autocomplete
                options={Array.from(allData.servants.keys())}
                value={this.state.data.name}
                renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                onChange={(e, v) => { if (v) this.handleNameChanged(v) }} />
        );
    }

    handleNameChanged(name: string) {
        this.setState(getServantDefaults(name));
        if (this.props.onChange) this.props.onChange(this.state);
    }
}

class BuffMatrixBuilder extends React.Component<any, BuffMatrix, any> {
    constructor(props: any) {
        super(props);
        this.state = props.buffMatrix;
    }

    render() {
        return (
            <TableContainer>
                <Table>
                    {/* <TableHead> */}
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Attack Up</TableCell>
                            <TableCell>Card Effectiveness Up</TableCell>
                            <TableCell>NP Damage Up</TableCell>
                            <TableCell>2x NP Dmg Up</TableCell>
                            <TableCell>Power Mod 1</TableCell>
                            <TableCell>Trigger 1</TableCell>
                            <TableCell>Power Mod 2</TableCell>
                            <TableCell>Trigger 2</TableCell>
                            <TableCell>Power Mod 3</TableCell>
                            <TableCell>Trigger 3</TableCell>
                        </TableRow>
                    {/* </TableHead>
                    <TableBody> */}
                        {this.state.buffs.map((buffSet: BuffSet, index: number) => (
                            <BuffSetBuilder buffSet={buffSet} key={index} rowLabel={"T" + (index + 1)} onChange={(v: BuffSet) => this.handleChange(v, index)} />
                        ))}
                    {/* </TableBody> */}
                </Table>
            </TableContainer>
        )
    }

    handleChange(buffSet: BuffSet, index: number) {
        this.setState(update(this.state, { buffs: { [index]: { $set: buffSet } } }));
    }
}

class BuffSetBuilder extends React.Component<any, BuffSet, any> {
    constructor(props: any) {
        super(props);
        this.state = props.buffSet;
        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        return (
            <TableRow>
                <TableCell><strong>{this.props.rowLabel}</strong></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.attackUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ attackUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.effUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ effUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.npUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ npUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><Checkbox value={this.state.isDoubleNpUp} onChange={(e, v) => this.handleChange({ isDoubleNpUp: {$set: v } }) } /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.powerMods[0].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100} }, 0); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state.powerMods[0].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 0)}
                    disableClearable={true} /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.powerMods[1].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100 } }, 1); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state.powerMods[1].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 1)} 
                    disableClearable={true} /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state.powerMods[2].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100 } }, 2); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state.powerMods[2].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 2)} 
                    disableClearable={true} /></TableCell>
            </TableRow>
        );
    }

    handleChange(spec: Spec<Readonly<BuffSet>, never>) {
        console.log(spec);
        this.setState(update(this.state, spec));
        if (this.props.onChange) this.props.onChange(this.state);
    }

    handlePowerModChange(spec: Spec<PowerMod, never>, index: number) {
        this.setState(update(this.state, { powerMods: { [index]: spec } }));
        if (this.props.onChange) this.props.onChange(this.state);
    }
}

function emptyBuffMatrix(): BuffMatrix {
    return new BuffMatrix([emptyBuffSet(), emptyBuffSet(), emptyBuffSet()]);
}

function emptyBuffSet(): BuffSet {
    return new BuffSet(0.0, 0.0, 0.0, false, [emptyPowerMod(), emptyPowerMod(), emptyPowerMod()], 0);
}

function emptyPowerMod(): PowerMod {
    return new PowerMod(Trigger.Always, 0.0);
}

function emptyParty(): Servant[] {
    let placeholder = getServantDefaults("<Placeholder>");
    let unspecified = getServantDefaults("<Unspecified>");
    return [ placeholder, unspecified, unspecified, unspecified, unspecified, unspecified ];
}

function getServantDefaults(name: string): Servant {
    let data = lookupServantData(name);
    return new Servant(data, Math.max(data.f2pCopies, 1), 90, 1000, new PowerMod((data.appendTarget as string) as Trigger, 0.3), data.npUpgrade > 0.0)
}

function lookupServantData(name: string): ServantData {
    return allData.servants.get(name) as ServantData;
}

ReactDOM.render(
    <TemplateBuilder />,
    document.getElementById("template-builder")
);