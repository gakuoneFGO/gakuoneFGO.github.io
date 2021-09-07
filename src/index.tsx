import * as React from "react";
import * as ReactDOM from "react-dom";
import NumberFormat from "react-number-format";
import { TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";

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
            <div className="container-fluid bd-content">
                {this.state.party.map((servant, index) =>(
                    <ServantSelector key={index}
                        name={servant.data.name}
                        label={"Servant " + (index + 1)}
                        onChange={(v: string) => { console.log("my onChange - " + v); this.state.party[index] = getServantDefaults(v); }} />
                ))}
                <BuffMatrixBuilder buffMatrix={this.state.buffs}></BuffMatrixBuilder>
            </div>
        );
    }
}

class ServantSelector extends React.Component<any, any, any> {
    render() {
        return (
            <Autocomplete
                options={Array.from(allData.servants.keys())}
                value={this.props.name}
                renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                onChange={(e, v) => this.props.onChange(v)} />
        );
    }
}

class BuffMatrixBuilder extends React.Component<any, BuffMatrix, any> {
    constructor(props: any) {
        super(props);
        this.state = props.buffMatrix;
    }

    render() {
        return (
            <table className="table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Attack Up</th>
                        <th>Card Effectiveness Up</th>
                        <th>NP Damage Up</th>
                        <th>Power Mod 1</th>
                        <th>Trigger 1</th>
                        <th>Power Mod 2</th>
                        <th>Trigger 2</th>
                        <th>Power Mod 3</th>
                        <th>Trigger 3</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.buffs.map((buffSet: BuffSet, index: number) => (
                        <tr key={index}>
                            <td><strong>T{index + 1}</strong></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.attackUp * 100} onValueChange={e => { if (e.floatValue) buffSet.attackUp = e.floatValue } }></NumberFormat></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.effUp * 100} onValueChange={e => { if (e.floatValue) buffSet.effUp = e.floatValue } }></NumberFormat></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.npUp * 100} onValueChange={e => { if (e.floatValue) buffSet.npUp = e.floatValue } }></NumberFormat></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.powerMods[0].modifier * 100} onValueChange={e => { if (e.floatValue) buffSet.powerMods[0].modifier = e.floatValue } }></NumberFormat></td>
                            <td><input type="text" value={buffSet.powerMods[0].trigger} onChange={e => buffSet.powerMods[0].trigger = e.target.value as Trigger}></input></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.powerMods[1].modifier * 100} onValueChange={e => { if (e.floatValue) buffSet.powerMods[1].modifier = e.floatValue } }></NumberFormat></td>
                            <td><input type="text" value={buffSet.powerMods[0].trigger} onChange={e => buffSet.powerMods[0].trigger = e.target.value as Trigger}></input></td>
                            <td><NumberFormat suffix={"%"} decimalScale={1} value={buffSet.powerMods[2].modifier * 100} onValueChange={e => { if (e.floatValue) buffSet.powerMods[2].modifier = e.floatValue } }></NumberFormat></td>
                            <td><input type="text" value={buffSet.powerMods[0].trigger} onChange={e => buffSet.powerMods[0].trigger = e.target.value as Trigger}></input></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
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