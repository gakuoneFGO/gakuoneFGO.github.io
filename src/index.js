
import { Template, BuffMatrix } from "./Strat.js";
import { BuffSet, PowerMod } from "./Damage.js";
import { Servant, Trigger } from "./Servant.js";
import { allData } from "./Data.js";
class TemplateBuilder extends React.Component {
    constructor(props) {
        super(props);
        this.state = new Template("Test Template", emptyBuffMatrix(), emptyParty(), [1, 0, 0], "Test description", ["do this T1", "do this T2", "do this T3"]);
    }
    render() {
        return (React.createElement("div", { className: "container-fluid bd-content" },
            this.state.party.map((servant, index) => (React.createElement(ServantSelector, { key: index, name: servant.data.name, label: "Servant " + (index + 1), onChange: (v) => this.state.party[index] = getServantDefaults(v) }))),
            React.createElement(BuffMatrixBuilder, { buffMatrix: this.state.buffs })));
    }
}
class ServantSelector extends React.Component {
    render() {
        return (React.createElement(Autocomplete, { options: Array.from(allData.servants.keys()), value: this.props.name, renderInput: params => React.createElement(TextField, Object.assign({}, params, { label: this.props.label, variant: "outlined", onChange: e => this.props.onChange(e.target.value) })) }));
    }
}
class BuffMatrixBuilder extends React.Component {
    constructor(props) {
        super(props);
        this.state = props.buffMatrix;
    }
    render() {
        return (React.createElement("table", { className: "table" },
            React.createElement("thead", null,
                React.createElement("tr", null,
                    React.createElement("th", null),
                    React.createElement("th", null, "Attack Up"),
                    React.createElement("th", null, "Card Effectiveness Up"),
                    React.createElement("th", null, "NP Damage Up"),
                    React.createElement("th", null, "Power Mod 1"),
                    React.createElement("th", null, "Trigger 1"),
                    React.createElement("th", null, "Power Mod 2"),
                    React.createElement("th", null, "Trigger 2"),
                    React.createElement("th", null, "Power Mod 3"),
                    React.createElement("th", null, "Trigger 3"))),
            React.createElement("tbody", null, this.state.buffs.map((buffSet, index) => (React.createElement("tr", { key: index },
                React.createElement("td", null,
                    React.createElement("strong", null,
                        "T",
                        index + 1)),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.attackUp * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.attackUp = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.effUp * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.effUp = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.npUp * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.npUp = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.powerMods[0].modifier * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.powerMods[0].modifier = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement("input", { type: "text", value: buffSet.powerMods[0].trigger, onChange: e => buffSet.powerMods[0].trigger = e.target.value })),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.powerMods[1].modifier * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.powerMods[1].modifier = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement("input", { type: "text", value: buffSet.powerMods[0].trigger, onChange: e => buffSet.powerMods[0].trigger = e.target.value })),
                React.createElement("td", null,
                    React.createElement(NumberFormat, { suffix: "%", decimalScale: 1, value: buffSet.powerMods[2].modifier * 100, onValueChange: e => { if (e.floatValue)
                            buffSet.powerMods[2].modifier = e.floatValue; } })),
                React.createElement("td", null,
                    React.createElement("input", { type: "text", value: buffSet.powerMods[0].trigger, onChange: e => buffSet.powerMods[0].trigger = e.target.value }))))))));
    }
}
function emptyBuffMatrix() {
    return new BuffMatrix([emptyBuffSet(), emptyBuffSet(), emptyBuffSet()]);
}
function emptyBuffSet() {
    return new BuffSet(0.0, 0.0, 0.0, false, [emptyPowerMod(), emptyPowerMod(), emptyPowerMod()], 0);
}
function emptyPowerMod() {
    return new PowerMod(Trigger.Always, 0.0);
}
function emptyParty() {
    let placeholder = getServantDefaults("<Placeholder>");
    let unspecified = getServantDefaults("<Unspecified>");
    return [placeholder, unspecified, unspecified, unspecified, unspecified, unspecified];
}
function getServantDefaults(name) {
    let data = lookupServantData(name);
    return new Servant(data, Math.max(data.f2pCopies, 1), 90, 1000, new PowerMod(data.appendTarget, 0.3), data.npUpgrade > 0.0);
}
function lookupServantData(name) {
    return allData.servants.get(name);
}
ReactDOM.render(React.createElement(TemplateBuilder, null), document.getElementById("template-builder"));
//# sourceMappingURL=index.js.map