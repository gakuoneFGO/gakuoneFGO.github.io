import * as React from "react";
import * as ReactDOM from "react-dom";
import NumberFormat from "react-number-format";
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import update from "immutability-helper";
import { Spec } from "immutability-helper";

import { Template, BuffMatrix, Strat, EnemyNode, NodeDamage, Wave } from "./Strat";
import { BuffSet, Calculator, CraftEssence, PowerMod } from "./Damage";
import { Servant, ServantConfig, ServantData, Trigger, CardType, ServantClass, GrowthCurve, ServantAttribute } from "./Servant";
import { allData } from "./Data";
import { ExpandMore } from "@material-ui/icons";
import { Enemy, EnemyAttribute, EnemyClass } from "./Enemy";

class StratBuilder extends React.Component<any, Strat, any> {
    constructor(props: any) {
        super(props);
        this.state = new Strat(
            getServantDefaults("Ereshkigal"),
            new Template("Test Template", BuffMatrix.create(3), emptyParty(), [1, 0, 0], "Test description", ["do this T1", "do this T2", "do this T3"]),
            BuffMatrix.create(3),
            new CraftEssence("<None>", 0, BuffSet.empty()),
            new CraftEssence("<None>", 0, BuffSet.empty())
        );
        
        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        return (
            <Grid container>
                <Grid item md={8}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            3-Turn Template
                        </AccordionSummary>
                        <AccordionDetails>
                            <TemplateBuilder template={this.state.template} />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            Servant Details
                        </AccordionSummary>
                        <AccordionDetails>
                            <div>
                                <ServantSelector servant={this.state.servant} onChange={(servant: Servant) => this.handleChange({ servant: { $set: servant } })} />
                                <BuffMatrixBuilder buffMatrix={this.state.servantBuffs} onChange={(buffs: BuffMatrix) => this.handleChange({ servantBuffs: { $set: buffs } })} />
                            </div>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
                <OutputPanel strat={this.state} node={this.getNode()} />
            </Grid>
        );
    }

    handleChange(spec: Spec<Readonly<Strat>, never>) {
        console.log("StratBuilder.setState");
        this.setState(update(this.state, spec));
        if (this.props.onChange) this.props.onChange(this.state);
    }

    getNode(): EnemyNode {
        let enemy = new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0.0);
        let waves = new Array<Wave>(3);
        waves.fill(new Wave([ enemy ]));
        return new EnemyNode(waves);
    }
}

class TemplateBuilder extends React.Component<any, Template, any> {
    constructor(props: any) {
        super(props);
        this.state = props.template;
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
                <BuffMatrixBuilder buffMatrix={this.state.buffs} onChange={(buffs: BuffMatrix) => this.handleChange({ buffs: { $set: buffs } })} />
            </div>
        );
    }

    handleChange(spec: Spec<Readonly<Template>, never>) {
        console.log("TemplateBuilder.setState");
        this.setState(update(this.state, spec));
        if (this.props.onChange) this.props.onChange(this.state);
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
                onChange={(e, v) => { if (v) this.handleNameChanged(v) }}
                disableClearable={true} />
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
            <TableContainer className="transpose">
                <Table>
                    {/* <TableHead> */}
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Attack Up</TableCell>
                            <TableCell>Card Type Up</TableCell>
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
        if (this.props.onChange) this.props.onChange(this.state);
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
        this.setState(update(this.state, spec));
        if (this.props.onChange) this.props.onChange(this.state);
    }

    handlePowerModChange(spec: Spec<PowerMod, never>, index: number) {
        this.setState(update(this.state, { powerMods: { [index]: spec } }));
        if (this.props.onChange) this.props.onChange(this.state);
    }
}

class ArrayWrapper<T> {
    constructor(readonly array: T[]) {}
}

class OutputPanel extends React.Component<any, ArrayWrapper<NodeDamage>, any> {
    constructor(props: any) {
        super(props);
        this.state = new ArrayWrapper<NodeDamage>([]); //fixes a react warning
    }

    static getDerivedStateFromProps(props: any, state: ArrayWrapper<NodeDamage>): ArrayWrapper<NodeDamage> {
        console.log(props);
        let strat: Strat = props.strat;
        let node: EnemyNode = props.node;
        let output = [ 1, 2, 3, 4, 5 ].map(npLevel => {
            var tempStrat = update(strat, { servant: { config: { npLevel: { $set: npLevel } } } });
            //could use reduce instead
            strat.template.clearers.forEach(clearerIndex => {
                if (strat.template.party[clearerIndex].data.name != "<Placeholder>") {
                    tempStrat = update(tempStrat, { template: { party: { [clearerIndex]: { config: { npLevel: { $set: npLevel } } } } } });
                }
            });
            return tempStrat.run(node);
        });
        console.log(output);
        return new ArrayWrapper(output);
    }

    render() {
        return (
            <Grid item md={4}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {this.state.array.map((_, index) =>
                                    <TableCell key={index}>NP{index + 1}</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.array[0].damagePerWave.map((_, waveIndex) =>
                                <TableRow key={waveIndex}>
                                    {this.state.array.map((nodeDamage, npIndex) =>
                                        <TableCell key={npIndex}>{nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low}</TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        );
    }
}

function emptyParty(): Servant[] {
    let placeholder = getServantDefaults("<Placeholder>");
    let unspecified = getServantDefaults("<Unspecified>");
    return [ placeholder, unspecified, unspecified, unspecified, unspecified, unspecified ];
}

function getServantDefaults(name: string): Servant {
    let data = lookupServantData(name);
    let config = new ServantConfig(data.name, Math.max(data.f2pCopies, 1), 90, 1000, new PowerMod((data.appendTarget as string) as Trigger, 0.3), data.npUpgrade > 0.0);
    return new Servant(config, data);
}

function lookupServantData(name: string): ServantData {
    return allData.servants.get(name) as ServantData;
}

ReactDOM.render(
    <StratBuilder />,
    document.getElementById("main")
);