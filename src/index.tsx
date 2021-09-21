import * as React from "react";
import * as ReactDOM from "react-dom";
import NumberFormat from "react-number-format";
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Checkbox, FormControlLabel, Grid, ImageList, ImageListItem, InputAdornment, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import "reflect-metadata";

import { Template, BuffMatrix, Strat, EnemyNode, NodeDamage, Wave } from "./Strat";
import { BuffSet, Calculator, CraftEssence, PowerMod } from "./Damage";
import { Servant, ServantConfig, ServantData, Trigger, CardType, ServantClass, GrowthCurve, ServantAttribute } from "./Servant";
import { allData, Data } from "./Data";
import { ExpandMore } from "@material-ui/icons";
import { Enemy, EnemyAttribute, EnemyClass } from "./Enemy";
import { TransposedTableBody } from "./TransposedTable";

class StateWrapper<S> {
    constructor(readonly _: S) {}
}

interface BaseProps<S> {
    onChange: (state: S) => void;
}

class BaseComponent<P extends BaseProps<S>, S, SS> extends React.Component<P, StateWrapper<S>, SS> {
    constructor(props: P, state?: S) {
        //TODO: setting state in constructor means that you have issues later trying to override the data
        //probable solution is to use keys to force a new instance to be constructed
        super(props);
        if (state) this.state = this.wrap(state);
        this.handleChange = this.handleChange.bind(this);
    }

    wrap(state: S) {
        return new StateWrapper(state);
    }

    handleChange(spec: Spec<Readonly<S>, never>) {
        // console.log(spec);
        let state = update(this.state._, spec)
        this.setState(this.wrap(state));
        if (this.props.onChange) this.props.onChange(state);
    }
}

class StratBuilder extends BaseComponent<any, Strat, any> {
    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        let component = this;
        allData.then(data => {
            let state = new Strat(
                getServantDefaultsFromData("Iskandar", data),
                data.templates.get("Double Oberon + Castoria (0%)") as Template,
                BuffMatrix.create(3),
                new CraftEssence("<None>", 0, BuffSet.empty()),
                new CraftEssence("<None>", 0, BuffSet.empty())
            );
            component.setState(component.wrap(state));
        });

    }

    render() {
        if (!this.state) return null;
        return (
            <Grid container>
                <Grid item md={8}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            3-Turn Template
                        </AccordionSummary>
                        <AccordionDetails>
                            <TemplateBuilder key={this.state._.template.name} template={this.state._.template} onChange={(template: Template) => this.handleChange({ template: { $set: template } })} />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            Servant Details
                        </AccordionSummary>
                        <AccordionDetails>
                            <div>
                                <ServantSelector servant={this.state._.servant} onChange={(servant: Servant) => this.handleChange({ servant: { $set: servant } })} />
                                <BuffMatrixBuilder buffMatrix={this.state._.servantBuffs} onChange={(buffs: BuffMatrix) => this.handleChange({ servantBuffs: { $set: buffs } })} />
                            </div>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            Craft Essence
                        </AccordionSummary>
                        <AccordionDetails>
                            <div>
                                <CEBuilder ce={this.state._.servantCe} onChange={(ce: CraftEssence) => this.handleChange({ servantCe: { $set: ce } })} />
                                <CEBuilder ce={this.state._.supportCe} onChange={(ce: CraftEssence) => this.handleChange({ supportCe: { $set: ce } })} />
                            </div>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
                <Grid item md={4}>
                    <PartyDisplay party={this.state._.template.party} servant={this.state._.servant} />
                    <OutputPanel strat={this.state._} node={this.getNode()} />
                </Grid>
            </Grid>
        );
    }

    //TODO
    getNode(): EnemyNode {
        let enemy = new Enemy(EnemyClass.Neutral, EnemyAttribute.Neutral, [], 0.0);
        let waves = new Array<Wave>(3);
        waves.fill(new Wave([ enemy ]));
        return new EnemyNode(waves);
    }
}

class TemplateBuilder extends BaseComponent<any, Template, any> {
    constructor(props: any) {
        super(props, props.template);
        this.loadTemplate = this.loadTemplate.bind(this);
        this.handleClearerChanged = this.handleClearerChanged.bind(this);
    }

    private templateList?: string[];
    private data?: Data;

    componentDidMount() {
        if (!this.data)
            allData.then(data => {
                this.data = data;
                this.templateList = Array.from(data.templates.keys());
                this.forceUpdate();
            });
    }

    render() {
        if (!this.templateList) return null;
        return (
            <div>
                <Autocomplete
                    options={this.templateList}
                    value={this.state._.name}
                    renderInput={params => <TextField {...params} label="Select Template" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.loadTemplate(v)}}
                    disableClearable={true} />
                <Grid container>
                    {this.state._.party.map((servant, index) =>(
                        <Grid item md={6} key={index}>
                            <ServantSelector
                                servant={servant}
                                label={"Servant " + (index + 1)}
                                onChange={(s: Servant) => this.handleChange({ party: { [index]: { $set: s } } })} />
                                {/* TODO: reset checkboxes when setting back to unspecified */}
                            <Grid container justifyContent="space-evenly">
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T1"
                                        control={
                                            <Checkbox checked={this.state._.clearers[0].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 0, index)}
                                                disabled={this.state._.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T2"
                                        control={
                                            <Checkbox checked={this.state._.clearers[1].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 1, index)}
                                                disabled={this.state._.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T3"
                                        control={
                                            <Checkbox checked={this.state._.clearers[2].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 2, index)}
                                                disabled={this.state._.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
                <BuffMatrixBuilder buffMatrix={this.state._.buffs} onChange={(buffs: BuffMatrix) => this.handleChange({ buffs: { $set: buffs } })} />
            </div>
        );
    }

    loadTemplate(name: string) {
        //this.setState(this.wrap(this.data?.templates.get(name) as Template));
        this.props.onChange(this.data?.templates.get(name) as Template);
    }

    handleClearerChanged(value: boolean, turnIndex: number, clearerIndex: number) {
        if (value) {
            this.handleChange({ clearers: { [turnIndex]: { $splice: [[ 0, 0, clearerIndex ]] } } });
        } else {
            let index = this.state._.clearers[turnIndex].findIndex(i => i == clearerIndex);
            this.handleChange({ clearers: { [turnIndex]: { $splice: [[ index, 1 ]] } } })
        }
        console.log(JSON.stringify(this.state._.buffs));
    }
}

class ServantSelector extends BaseComponent<any, Servant, any> {
    constructor(props: any) {
        super(props, props.servant);
    }

    private static servantList?: string[];
    private static data?: Data;

    componentDidMount() {
        if (!ServantSelector.data)
            allData.then(data => {
                ServantSelector.data = data;
                ServantSelector.servantList = Array.from(ServantSelector.data.servants.keys()).sort();
                this.forceUpdate();
            });
    }

    render() {
        if (!ServantSelector.servantList) return null;
        return (
            <React.Fragment>
                <Autocomplete
                    options={ServantSelector.servantList as string[]}
                    value={this.state._.data.name}
                    renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ $set: getServantDefaultsFromData(v, ServantSelector.data as Data) }) }}
                    disableClearable={true} />
                <Accordion variant="outlined">
                    <AccordionSummary>
                        Detailed Stats
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container justifyContent="space-evenly">
                            <Grid item>
                                <Autocomplete
                                    options={this.state._.data.growthCurve.getValidLevels()}
                                    value={this.state._.config.level.toString()}
                                    renderInput={params => <TextField {...params} label="Level" variant="outlined" />}
                                    onChange={(e, v) => { if (v) this.handleChange({ config: { level: { $set: Number.parseInt(v) } } })}}
                                    disableClearable={true} />
                            </Grid>
                            <Grid item>
                                <Autocomplete
                                    options={["1", "2", "3", "4", "5"]}
                                    value={this.state._.config.npLevel.toString()}
                                    renderInput={params => <TextField {...params} label="NP Level" variant="outlined" />}
                                    onChange={(e, v) => { if (v) this.handleChange({ config: { npLevel: { $set: Number.parseInt(v) } } })}}
                                    disableClearable={true} />
                            </Grid>
                            <Grid item>
                                <TextField
                                    style={{ width: 80 }}
                                    type="number" variant="outlined"
                                    label="Fous"
                                    value={this.state._.config.attackFou.toString()}
                                    onChange={(e) => { if (e.target.value) this.handleChange({ config: { attackFou: { $set: Number.parseInt(e.target.value) } } })}} />
                            </Grid>
                            <Grid item>
                                <InputLabel>NP Upgrade</InputLabel>
                                <Checkbox checked={this.state._.config.isNpUpgraded} onChange={(e, v) => this.handleChange({ config: { isNpUpgraded: {$set: v } } }) } />
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </React.Fragment>
        );
    }
}

class BuffMatrixBuilder extends BaseComponent<any, BuffMatrix, any> {
    constructor(props: any) {
        super(props, props.buffMatrix);
    }

    render() {
        return (
            <TableContainer className="transpose">
                <Table>
                    <TransposedTableBody>
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
                        {this.state._.buffs.map((buffSet: BuffSet, index: number) => (
                            <TableRow key={index}>
                                <TableCell><strong>T{index + 1}</strong></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].attackUp} onChange={v => { this.handleChange({ buffs : { [index]: { attackUp: {$set: v } } } }); }} /></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].effUp} onChange={ v => { this.handleChange({ buffs : { [index]: { effUp: {$set: v} } } }); } } /></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].npUp} onChange={ v => { this.handleChange({ buffs : { [index]: { npUp: {$set: v} } } }); }} /></TableCell>
                                <TableCell><Checkbox checked={this.state._.buffs[index].isDoubleNpUp} onChange={(e, v) => this.handleChange({ buffs : { [index]: { isDoubleNpUp: {$set: v } } } }) } /></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].powerMods[0].modifier} onChange={ v => { this.handlePowerModChange({ modifier: {$set: v} }, 0, index); }} /></TableCell>
                                <TableCell><Autocomplete
                                    options={Object.values(Trigger)}
                                    value={this.state._.buffs[index].powerMods[0].trigger}
                                    renderInput={params => <TextField {...params} variant="outlined" />}
                                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 0, index)}
                                    disableClearable={true} /></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].powerMods[1].modifier} onChange={ v => { this.handlePowerModChange({ modifier: {$set: v } }, 1, index); }} /></TableCell>
                                <TableCell><Autocomplete
                                    options={Object.values(Trigger)}
                                    value={this.state._.buffs[index].powerMods[1].trigger}
                                    renderInput={params => <TextField {...params} variant="outlined" />}
                                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 1, index)} 
                                    disableClearable={true} /></TableCell>
                                <TableCell><PercentInput value={this.state._.buffs[index].powerMods[2].modifier} onChange={ v => { this.handlePowerModChange({ modifier: {$set: v } }, 2, index); }} /></TableCell>
                                <TableCell><Autocomplete
                                    options={Object.values(Trigger)}
                                    value={this.state._.buffs[index].powerMods[2].trigger}
                                    renderInput={params => <TextField {...params} variant="outlined" />}
                                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 2, index)} 
                                    disableClearable={true} /></TableCell>
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

interface PercentInputProps {
    value: number;
    label?: string;
    onChange: (v: number) => void;
}

class PercentInput extends React.Component<PercentInputProps, any, any> {
    constructor(props: PercentInputProps) {
        super(props);
    }
    
    render() {
        return (
            <TextField
                type="number" variant="outlined"
                label={this.props.label}
                value={this.props.value * 100}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                    )
                }}
                onChange={(e) => { if (e.target.value) this.props.onChange(Number.parseFloat(e.target.value) / 100)}} />
        );
    }
}

class CEBuilder extends BaseComponent<any, CraftEssence, any> {
    constructor(props: any) {
        super(props, props.ce);
    }

    render() {
        return (
            <div>
                <TextField
                    style={{ width: 80 }}
                    type="number" variant="outlined"
                    label="Attack"
                    value={this.state._.attackStat.toString()}
                    onChange={(e) => { if (e.target.value) this.handleChange({ attackStat: { $set: Number.parseInt(e.target.value) } })}} />
            </div>
        );
    }
}

class PartyDisplay extends BaseComponent<any, Servant[], any> {
    constructor(props: any) {
        super(props, props.party);
    }

    static getDerivedStateFromProps(props: any, state: StateWrapper<Servant[]>): StateWrapper<Servant[]> {
        return new StateWrapper(replacePlaceholder(props.party, props.servant));
    }

    render() {
        return (
            <ImageList cols={6}>
                {this.state._.map((servant, index) =>
                    <ImageListItem key={index} cols={1}>
                        <img alt={servant.data.name} src={servant.data.cardArtUrl} />
                    </ImageListItem>
                )}
            </ImageList>
        );
    }
}

class OutputPanel extends BaseComponent<any, NodeDamage[], any> {
    constructor(props: any) {
        super(props, []);
    }

    static getDerivedStateFromProps(props: any, state: StateWrapper<NodeDamage[]>): StateWrapper<NodeDamage[]> {
        let strat: Strat = props.strat;
        let node: EnemyNode = props.node;
        let output = [ 1, 2, 3, 4, 5 ].map(npLevel => {
            var tempStrat = update(strat, { servant: { config: { npLevel: { $set: npLevel } } } });
            //TODO: could use reduce instead. probably define a helper function then do that
            strat.template.clearers.flatMap(c => c).forEach(clearerIndex => {
                if (strat.template.party[clearerIndex].data.name != "<Placeholder>") {
                    tempStrat = update(tempStrat, { template: { party: { [clearerIndex]: { config: { npLevel: { $set: npLevel } } } } } });
                }
            });
            return tempStrat.run(node);
        });
        return new StateWrapper(output);
    }

    render() {
        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            {this.state._.map((_, index) =>
                                <TableCell key={index}>NP{index + 1}</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state._[0].damagePerWave.map((_, waveIndex) =>
                            <TableRow key={waveIndex}>
                                <TableCell><strong>T{waveIndex + 1}</strong></TableCell>
                                {this.state._.map((nodeDamage, npIndex) =>
                                    <TableCell key={npIndex}><NumberFormat value={nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low} displayType="text" thousandSeparator=","/></TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

async function emptyParty(): Promise<Servant[]> {
    const placeholder = await getServantDefaults("<Placeholder>");
    const unspecified = await getServantDefaults("<Unspecified>");
    return [placeholder, unspecified, unspecified, unspecified, unspecified, unspecified];
}

async function getServantDefaults(name: string): Promise<Servant> {
    const data = await allData;
    return getServantDefaultsFromData(name, data);
}

function getServantDefaultsFromData(name: string, data: Data): Servant {
    let servantData = data.servants.get(name) as ServantData;
    let config = new ServantConfig(servantData.name, Math.max(servantData.f2pCopies, 1), getMaxLevel(servantData.rarity), 1000, new PowerMod((servantData.appendTarget as string) as Trigger, 0.3), servantData.npUpgrade > 0.0);
    return new Servant(config, servantData);
}

function getMaxLevel(rarity: number): number {
    switch (rarity) {
        case 1: return 60;
        case 2: return 65;
        case 3: return 70;
        case 4: return 80;
        case 5: return 90;
    }
    return 0;
}

function replacePlaceholder(party: Servant[], servant: Servant): Servant[] {
    return party.reduce<Servant[]>((prev: Servant[], cur, i) => cur.data.name == "<Placeholder>" ? update(prev, { [i]: { $set: servant } }) : prev, party);
}

ReactDOM.render(
    <StratBuilder />,
    document.getElementById("main")
);

// var templateData: any;
// allData.then(data => {
//     templateData = [
//         ["TmpCastoria0","Arash","Castoria","Oberon","Oberon","","Arash","5","Sup","Main","Main","1","0","1","Any servant that doesn't kill themselves can do this. Needs 10% append and 20% on Arash.","Castoria skills on DPS. Swap for Oberon and S1+S3. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpReines10","Arash","Reines","Oberon","Oberon","","Arash","5","Sup","Main","Main","1","0","1","Servants which self charge 10% can use Reines. This is not usually recommended since her attack buff is targeted","Reines provides 30% each to Arash and DPS. Swap for Oberon and S1+S3. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpWaver20","Arash","Waver","Oberon","Oberon","","Arash","5","Sup","Main","Main","1","0","1","Servants which provide 20-30% self gauge by T2 will usually prefer Waver over other options.","Waver skills on Arash. Swap for Oberon and S1+S3. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpVitch40","Arash","Oberon","Koyanskaya","Oberon","","Arash","5","Sup","Main","Main","1","0","1","Servant provides 40% charge T2 or 50% charge T3.","Oberon skills on Arash, then swap for Oberon and S1","Use Vitch buffs, charge to 100% with skills and NP","Charge again with remaining skills"],
//         ["TmpObeVitchVsKnights50","Oberon","Koyanskaya","Oberon","","","Oberon","2","Sup","Main","Main","1","0","1","Oberon can clear wave 1 if the main servant can provide 50% gauge T3 (this includes refunders like Artoria).","Vitch skills on DPS. Swap for Oberon. Use both Oberon S1s. One Oberon uses S2+S3 on self and NPs","NP with DPS, who is already at 100%","Oberon S2 + servant's own skills to refill"],
//         ["TmpCastoria0Backloaded","Arash","Castoria","Oberon","Oberon","","Arash","5","Sup","Main","Main","0","0","1","Any servant that doesn't kill themselves can do this. Needs 10% append and 20% on Arash. Uses Both Oberon S3 on T3 for cases where Arash doesn't need it T1.","Castoria skills on DPS. Swap for Oberon and S1. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpReines10Backloaded","Arash","Reines","Oberon","Oberon","","Arash","5","Sup","Main","Main","0","0","1","Servants which self charge 10% can use Reines. This is not usually recommended since her attack buff is targeted. Uses Both Oberon S3 on T3 for cases where Arash doesn't need it T1.","Reines provides 30% each to Arash and DPS. Swap for Oberon and S1+S3. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpWaver20Backloaded","Arash","Waver","Oberon","Oberon","","Arash","5","Sup","Main","Main","0","0","1","Servants which provide 20-30% self gauge by T2 will usually prefer Waver over other options. Uses Both Oberon S3 on T3 for cases where Arash doesn't need it T1.","Waver skills on Arash. Swap for Oberon and S1. NP with Arash","Second Oberon uses S1 to fill DPS to 100%","Both Oberon use S2 to fill gauge again. Apply remaining buffs and NP"],
//         ["TmpVitch40Backloaded","Arash","Koyanskaya","Oberon","Oberon","","Arash","5","Sup","Main","Main","0","0","1","Servant provides 50% charge T3. Uses Both Oberon S3 on T3 for cases where Arash doesn't need it T1.","Vitch skills on DPS, then swap for Oberon and S1 + S2 Arash","Use the next Oberon's S1 and NP","Charge again with remaining skills"],
//         ["TmpObeVitchVsKnights50Transposed","Oberon","Koyanskaya","Oberon","","","Oberon","2","Main","Sup","Main","0","1","1","Transposed version of the other template (Oberon clears wave 2 instead of 1). Optimized for Eresh mainly, since her NP provides team attack up.","Vitch skills on DPS. Swap for Oberon. Use both Oberon S1s. NP with DPS","One Oberon uses S2 + S3 on himself and NPs","Oberon S2 + servant's own skills to refill"],
//         ["TmpVitchMerlinHack","Arash","Merlin","Oberon","Oberon","","Arash","5","Main","Sup","Main","0","1","1","Vitch can use Merlin as long as Arash can clear wave 2.","Merlin applies buffs since Oberon is not on the field yet. Swap for Oberon, use his S1, use Vitch's skills on herself and NP with her.","Arash should be at 70% gauge after Vitch's NP, so use his S3 and Oberon's S3, then NP","Use the remaining skills to refill and NP"],
//         ["TmpDoubleVitchDPS","Koyanskaya","Waver","Oberon","","","Koyanskaya","2","Sup","Main","Main","0","0","1","Can use double Vitch + Waver to simulate Merlin if Arash can't clear wave 2 or if your friend has a high NP level.","Vitch #1 applies S3 (and optionally S2) to self. Waver applies all skills to Vitch #1. Swap in Oberon and S1 + S2 on Vitch #2, then NP with Vitch #2","Apply Vitch #2 skills to Vitch #1 and NP with Vitch #1.","Use both Vitch S1 on Vitch #1. Reapply her S2 and S3, use plugsuit buff, NP"],
//         ["TmpMelusine","Koyanskaya","Koyanskaya","Oberon","","","Koyanskaya","2","Main","Main","Main","0","0","1","The infamous Melusine combo.","Melusine S1 + S3 into NP","Refill with both Vitch S1s","Swap in Oberon. Use his skills along with Melusine's (which are off cooldown)"],
//         ["TmpFriendMelusine","Koyanskaya","Waver","Oberon","","","Koyanskaya","2","Main","Main","Main","0","0","1","The fact that Melusine's S3 gives 100% gauge instead of 50% means that you can sub in a 50% charger for one Vitch at the expense of some stats.","Melusine S3 into NP","Refill with both supports","Swap in Oberon. Use his skills along with Melusine's (which are off cooldown)"],
//         ["TmpOberonDPSWithDoubleVitch","Waver","Koyanskaya","Koyanskaya","","","Waver","2","Main","Main","Main","0","0","1","Oberon can loop with double Vitch and a split charger.","Use Vitch buffs, charge with Waver S3 and Oberon S1 + S2","Use Vitch S1, swap in the other Vitch and use all her skills","Use Waver's first skill and all of Oberon's skills"],
//         ["TmpCasCu","Koyanskaya","Koyanskaya","Oberon","","","Koyanskaya","2","Main","Main","Main","0","0","1","Cu can loop with double Vitch without Oberon, but we're swapping him in for damage anyway.","Use Cu's S1 and S3, both Vitch buffs and one Vitch charge skill. Swap in Oberon and use S1","Use the other Vitch charge skill and reapply Cu's S3","Oberon S2 + S3"],
//         ["TmpCasCuMerlin","Arash","Merlin","Oberon","Oberon","","Arash","5","Sup","Main","Main","1","0","1","You can use Arash to sneak Merlin into a double Oberon team as long as the DPS gives 20% gauge T2 and 50% T3 (i.e. CasCu only).","Merlin buffs Cu, swap for Oberon, Oberon buffs Arash","Support Oberon comes in and uses S1. Use Cu S1 and S3","Oberon S2 + S3, plugsuit buff"],
//         ["TmpCraneBronze10","Arash","Oberon","Oberon","Koyanskaya","Miss Crane","Arash","6","Sup","Main","Main","1","0","1","With a party cost limit of 114, you can squeeze Miss Crane in as long as your DPS is a 1-star unit with a 10% battery (i.e. Spartacus).","Use Oberon's skills on Arash. Swap in Crane, charge her NP, then NP with Crane and Arash. (DPS must be in the front position.)","Use Oberon's S2 and Vitch's damage skills. Charge the last 10% using the DPS's skills and NP","Vitch and Oberon provide 50% each"],
//         ["TmpObeOzy1-1-X","Oberon","Koyanskaya","Oberon","","","Oberon","2","Main","Main","Sup","0","0","1","Ozy clears the first two waves in a 1-1-X node, then Oberon clears the last.","Ozy uses all skills, Vitch charges Ozy and buffs Obe, Obe uses S1, Ozy NPs","Swap Oberon for another support if you didn't do that T1 (options are Oberon, Waver, or Castoria). Fill Ozy to full with their skills + Oberon S2 and then NP again with Ozy","Ozy's skills are now off CD, so use S1 + S3 to fill the last 20% of Obe's gauge and then NP"],
//         ["TmpDoubleCastoria","Castoria","Castoria","Oberon","","","Castoria","5","Main","Main","Main","0","0","1","Best case double-Castoria setup (for comparison purposes). Space Ishtar can sometimes get enough refund on X-2-X here.","Apply Castoria S1s and S3s. Use one S2 on your whale friend's NP5 Castoria, then NP with her and the looper","Apply the other Castoria S2 to the damage dealer. Swap in Oberon and S1. Refill gauge with the looper's skills if needed, then NP with Castoria and the looper","Oberon S2 + S3"],
//         ["TmpDoubleSkadi","Skadi","Skadi","Oberon","","","Skadi","2","Main","Main","Main","0","0","1","Dual Skadi for reference. Only Caren and maybe Voyager can realistically use this for 2-2-X. Instructions below for Caren.","Use friend Skadi S1 + S3 and your own Skadi's S1. (If friend Skadi doesn't have the append skill, use S2 and swap for Oberon). Use Caren's S1 + S2 and NP","Got 10% refund and 20% from Caren's S1. Use Oberon's S1 and Skadi's S3 and NP again","Starting from 30% again, so use Oberon's S2 + S3 and Caren's S3"],
//         ["TmpDoubleVitch50","Arash","Oberon","Koyanskaya","Koyanskaya","","Arash","5","Sup","Main","Main","0","0","1","Servant provides 10% charge T1-T2 and then 50% on T3 (meaning the CD must be 6T at most). This usually just reduces T1 damage in favor of maybe increasing T2/T3 damage, depending on the servant's kit.","Use any skills with 6T cooldowns. Oberon charges up Arash and Arash NPs. (Don't use Oberon's S3 unless it's not needod T3.)","Use Vitch's skills, swap for the other Vitch and use S2 + S3","Refill with servant's own charge skill (now off CD) and Vitch's S1"],
//     ].map(row => {
//         let result: any = {
//             name: row[0],
//             buffs: BuffMatrix.create(3),
//             party: row.slice(0, 6).map((name, index) => {
//                 if (index == 0) {
//                     name = "<Placeholder>";
//                 } else if (name == "") {
//                     name = "<Unspecified>";
//                 }
//                 return name;
//             }),
//             clearers: [
//                 row[8] == "Main" ? [0] : [1],
//                 row[9] == "Main" ? [0] : [1],
//                 row[10] == "Main" ? [0] : [1],
//             ],
//             description: row[14],
//             instructions: [
//                 row[15],
//                 row[16],
//                 row[17],
//             ]
//         };
//         return result;
//     });
//     console.log(JSON.stringify(templateData));
// });