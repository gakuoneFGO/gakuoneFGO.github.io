import * as React from "react";
import * as ReactDOM from "react-dom";
import NumberFormat from "react-number-format";
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@material-ui/core";
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

class StateWrapper<S> {
    constructor(readonly _: S) {}
}

interface BaseProps<S> {
    onChange: (state: S) => void;
}

class BaseComponent<P extends BaseProps<S>, S, SS> extends React.Component<P, StateWrapper<S>, SS> {
    constructor(props: P, state?: S) {
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
        getServantDefaults("Ereshkigal").then(servant => emptyParty().then(party => {
            let state = new Strat(
                servant,
                new Template("Test Template", BuffMatrix.create(3), party, [0, 0, 0], "Test description", ["do this T1", "do this T2", "do this T3"]),
                BuffMatrix.create(3),
                new CraftEssence("<None>", 0, BuffSet.empty()),
                new CraftEssence("<None>", 0, BuffSet.empty())
            );
            component.setState(component.wrap(state));
        }));

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
                            <TemplateBuilder template={this.state._.template} onChange={(template: Template) => this.handleChange({ template: { $set: template } })} />
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
                </Grid>
                <OutputPanel strat={this.state._} node={this.getNode()} />
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
    }

    render() {
        return (
            <div>
                {this.state._.party.map((servant, index) =>(
                    <ServantSelector key={index}
                        servant={servant}
                        label={"Servant " + (index + 1)}
                        onChange={(s: Servant) => this.handleChange({ party: { [index]: { $set: s } } })} />
                ))}
                <BuffMatrixBuilder buffMatrix={this.state._.buffs} onChange={(buffs: BuffMatrix) => this.handleChange({ buffs: { $set: buffs } })} />
            </div>
        );
    }
}

class ServantSelector extends BaseComponent<any, Servant, any> {
    constructor(props: any) {
        super(props, props.servant);
    }

    private servantList?: string[];
    private data?: Data;

    componentDidMount() {
        if (!this.data)
            allData.then(data => {
                this.data = data;
                this.servantList = Array.from(data.servants.keys());
                this.forceUpdate();
            });
    }

    render() {
        if (!this.servantList) return null;
        return (
            <Autocomplete
                options={this.servantList as string[]}
                value={this.state._.data.name}
                renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                onChange={(e, v) => { if (v) this.handleChange({ $set: getServantDefaultsFromData(v, this.data as Data) }) }}
                disableClearable={true} />
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
                        {this.state._.buffs.map((buffSet: BuffSet, index: number) => (
                            <BuffSetBuilder buffSet={buffSet} key={index} rowLabel={"T" + (index + 1)} onChange={(v: BuffSet) => this.handleChange({ buffs: { [index]: { $set: v } } })} />
                        ))}
                    {/* </TableBody> */}
                </Table>
            </TableContainer>
        )
    }
}

class BuffSetBuilder extends BaseComponent<any, BuffSet, any> {
    constructor(props: any) {
        super(props, props.buffSet);
    }

    render() {
        return (
            <TableRow>
                <TableCell><strong>{this.props.rowLabel}</strong></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.attackUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ attackUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.effUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ effUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.npUp * 100} onValueChange={e => { if (e.floatValue) this.handleChange({ npUp: {$set: e.floatValue / 100} }); }}></NumberFormat></TableCell>
                <TableCell><Checkbox value={this.state._.isDoubleNpUp} onChange={(e, v) => this.handleChange({ isDoubleNpUp: {$set: v } }) } /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.powerMods[0].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100} }, 0); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state._.powerMods[0].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 0)}
                    disableClearable={true} /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.powerMods[1].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100 } }, 1); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state._.powerMods[1].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 1)} 
                    disableClearable={true} /></TableCell>
                <TableCell><NumberFormat suffix={"%"} decimalScale={1} value={this.state._.powerMods[2].modifier * 100} onValueChange={e => { if (e.floatValue) this.handlePowerModChange({ modifier: {$set: e.floatValue / 100 } }, 2); }}></NumberFormat></TableCell>
                <TableCell><Autocomplete
                    options={Object.values(Trigger)}
                    value={this.state._.powerMods[2].trigger}
                    renderInput={params => <TextField {...params} variant="outlined" />}
                    onChange={(e, v) => this.handlePowerModChange({ trigger: {$set: v as Trigger} }, 2)} 
                    disableClearable={true} /></TableCell>
            </TableRow>
        );
    }

    handlePowerModChange(spec: Spec<PowerMod, never>, index: number) {
        this.handleChange({ powerMods: { [index]: spec } });
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
            strat.template.clearers.forEach(clearerIndex => {
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
            <Grid item md={4}>
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
                                        <TableCell key={npIndex}>{nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low}</TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* {JSON.stringify(servantData)} */}
            </Grid>
        );
    }
}

function emptyParty(): Promise<Servant[]> {
    let placeholder = getServantDefaults("<Placeholder>");
    let unspecified = getServantDefaults("<Unspecified>");
    return placeholder.then(placeholder => unspecified.then(unspecified => [ placeholder, unspecified, unspecified, unspecified, unspecified, unspecified ]));
}

function getServantDefaults(name: string): Promise<Servant> {
    return allData.then(data => getServantDefaultsFromData(name, data));
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

ReactDOM.render(
    <StratBuilder />,
    document.getElementById("main")
);

function getGrowthCurve(row: string[]): any {
    let curve: { [key: string]: any } = {};
    for(var i = 11; i < row.length; i += 2) {
        let level = row[i];
        if (level == "") continue;
        let attack = Number.parseInt(row[i + 1]);
        curve[level] = attack;
    }
    return { stats: curve };
}

// let servantData = [
//     ['Abby (Summer)','Foreigner','Earth','0.00','0','1','0.30','Avenger','1.50','Never','TmpVitch40','90','11781','100','12986','120','15137','','','','',''],
//     ['Altera','Saber','Man','1.00','0','1','0.30','Foreigner','1.50','Never','TmpCastoria0','90','12343','100','13511','120','15859','','','','',''],
//     ['Amakusa','Ruler','Man','1.00','0','1','0.30','Ruler','1.50','Never','TmpVitch40','90','10972','100','12011','120','14098','','','','',''],
//     ['Arjuna','Archer','Sky','1.00','0','1','0.30','Berserker','1.50','Never','TmpWaver20Backloaded','90','12342','100','13510','120','15858','','','','',''],
//     ['Arjuna (Alter)','Berserker','Sky','0.00','0','1','0.00','Saber','1.50','Never','TmpWaver20','90','11669','100','12773','120','14993','','','','',''],
//     ['Arthur','Saber','Earth','0.00','0','1','0.30','Saber','1.50','Never','TmpWaver20','90','12465','100','13645','120','16016','','','','',''],
//     ['Artoria','Saber','Earth','1.00','0','1','0.30','Rider','1.50','Never','TmpObeVitchVsKnights50','90','11221','100','12283','120','14418','','','','',''],
//     ['Artoria (Alter)','Saber','Man','0.50','0','1','0.30','Rider','1.50','Never','TmpWaver20','80','10248','100','12408','120','14569','','','','',''],
//     ['Artoria (Lancer Alter)','Lancer','Sky','1.00','0','1','0.30','Rider','1.50','Never','TmpWaver20','90','9968','100','12069','120','14171','','','','',''],
//     ['Artoria (Lancer)','Lancer','Sky','0.00','0','1','0.30','Ruler','1.50','Never','TmpObeVitchVsKnights50','90','10995','100','12036','120','14127','','','','',''],
//     ['Artoria (Lily)','Saber','Earth','1.00','0','5','0.30','Caster','1.50','Never','TmpWaver20','80','7726','100','9355','120','10984','','','','',''],
//     ['Artoria (Ruler)','Ruler','Sky','0.00','0','1','0.30','Saber','1.50','Never','TmpVitch40','90','9593','100','10501','120','12326','','','','',''],
//     ['Artoria (Santa Alter)','Rider','Earth','1.50','0','5','0.30','Saber','1.50','Never','TmpCastoria0','80','9258','100','11209','120','16083','','','','',''],
//     ['Avicebron','Caster','Man','1.00','0','5','0.30','Berserker','1.50','Never','TmpVitch40','70','6376','100','8629','120','10135','','','','',''],
//     ['Babbage','Caster','Man','1.00','0','5','0.30','Caster','1.50','Never','TmpCastoria0','70','5996','100','8115','120','9531','','','','',''],
//     ['Barghest','Saber','Earth','0.00','0','1','0.30','AlterEgo','1.50','Never','TmpCastoria0','80','8721','100','10599','120','12398','','','','',''],
//     ['BB (Summer)','MoonCancer','Earth','0.00','0','1','0.30','Foreigner','1.50','Never','TmpVitch40','90','11182','100','12240','120','14367','','','','',''],
//     ['Blackbeard','Rider','Man','1.00','0','5','0.30','Rider','1.50','Never','TmpCastoria0','65','6188','100','8967','120','10561','','','','',''],
//     ['Brynhild (Berserker)','Berserker','Sky','0.00','0','1','0.00','Saber','1.50','Never','TmpWaver20','80','10197','100','12346','120','14496','','','','',''],
//     ['Bunyan','Berserker','Earth','0.00','0','5','0.00','Saber','1.50','Never','TmpCastoria0','60','6044','100','9391','120','11068','','','','',''],
//     ['Caenis','Lancer','Earth','0.00','0','1','0.30','Ruler','1.50','Never','TmpWaver20','80','9896','100','11982','120','14068','','','','',''],
//     ['Caren','Ruler','Sky','0.00','0','1','0.30','Archer','1.50','Never','TmpDoubleSkadi','90','11351','100','12425','120','14585','','','','',''],
//     ['Chacha','Berserker','Man','0.00','0','5','0.00','Saber','1.50','Never','TmpReines10','80','8945','100','10831','120','12717','','','','',''],
//     ['Cleopatra','Assassin','Man','1.00','0','1','0.30','Saber','1.50','Never','TmpReines10','90','11088','100','12138','120','14247','','','','',''],
//     ['Columbus','Rider','Man','1.00','0','5','0.30','Rider','1.50','Never','TmpWaver20','70','6552','100','8867','120','10415','','','','',''],
//     ['Cu (Caster)','Caster','Sky','1.00','0','5','0.30','Foreigner','1.50','Never','TmpCasCuMerlin','70','6580','100','8905','120','10459','','','','',''],
//     ['Danzou','Assassin','Earth','1.00','0','1','0.30','AlterEgo','1.50','Demonic','TmpCastoria0','80','8935','100','10818','120','12702','','','','',''],
//     ['Darius','Berserker','Man','1.00','0','5','0.00','Saber','1.50','Never','TmpCastoria0','70','7608','100','10297','120','12093','','','','',''],
//     ['Drake','Rider','Star','1.00','0','1','0.30','Archer','1.50','Never','TmpVitch40','90','11326','100','12398','120','14553','','','','',''],
//     ['Ereshkigal','Lancer','Earth','1.00','0','1','0.30','Assassin','1.50','Earth','TmpObeVitchVsKnights50Transposed','90','10343','100','11322','120','13290','','','','',''],
//     ['Eric Bloodaxe','Berserker','Man','0.00','0','5','0.30','Saber','1.50','Never','TmpCastoria0','65','6290','100','9115','120','10734','','','','',''],
//     ['Europa','Rider','Sky','0.00','0','1','0.30','Ruler','1.50','Never','TmpWaver20','90','11737','100','12848','120','15081','','','','',''],
//     ['Fergus','Saber','Earth','1.00','0','5','0.30','Rider','1.50','Never','TmpCastoria0','70','7460','100','10086','120','11858','','','','',''],
//     ['Gawain','Saber','Earth','0.00','0','1','0.30','Rider','1.50','Never','TmpWaver20','80','10173','100','12317','120','14462','','','','',''],
//     ['Gilgamesh','Archer','Sky','1.00','0','1','0.30','Rider','1.50','Weak to Enuma Elish','TmpWaver20Backloaded','90','12280','100','13442','120','15779','','','','',''],
//     ['Gilles (Caster)','Caster','Man','0.00','0','5','0.30','Foreigner','1.50','Never','TmpCastoria0','70','6514','100','8816','120','10354','','','','',''],
//     ['Gorgon','Avenger','Earth','1.00','0','1','0.30','Rider','1.50','Never','TmpCastoria0','80','10706','100','12963','120','15220','','','','',''],
//     ['Gray','Assassin','Man','0.00','0','5','0.30','Berserker','1.50','Never','TmpReines10','80','9456','100','11449','120','13443','','','','',''],
//     ['Hektor','Lancer','Man','1.00','0','5','0.30','Rider','1.50','Never','TmpCastoria0','70','6928','100','9376','120','11012','','','','',''],
//     ['Ibuki-Douji','Saber','Sky','0.00','0','1','0.30','Ruler','1.50','Never','TmpObeVitchVsKnights50','90','12709','100','13912','120','16330','','','','',''],
//     ['Ishtar','Archer','Sky','1.00','0','1','0.30','Ruler','1.50','Never','TmpVitch40Backloaded','90','12252','100','13412','120','15742','','','','',''],
//     ['Iskandar','Rider','Man','1.00','0','1','0.30','Lancer','1.50','Never','TmpCastoria0','90','11560','100','12654','120','14853','','','','',''],
//     ['Ivan','Rider','Man','1.00','0','1','0.30','Avenger','1.50','Never','TmpCastoria0','90','11619','100','12719','120','14929','','','','',''],
//     ['Jeanne (Santa Lily Alter)','Lancer','Man','0.00','0','5','0.30','Avenger','1.50','Never','TmpWaver20','80','9261','100','11213','120','13166','','','','',''],
//     ['Karna','Lancer','Sky','1.00','0','1','0.30','Rider','1.50','Divine','TmpWaver20','90','11976','100','13110','120','15388','','','','',''],
//     ['Kid Gil','Archer','Sky','1.00','0','5','0.30','Rider','1.50','Never','TmpCastoria0Backloaded','70','7696','100','10415','120','12233','','','','',''],
//     ['Kingprotea','AlterEgo','Earth','0.00','0','1','0.30','Ruler','1.50','Never','TmpCastoria0','90','12835','100','14050','120','16492','','','','',''],
//     ['Kiyohime','Berserker','Earth','0.00','0','5','0.00','Saber','1.50','Never','TmpCastoria0','70','6644','100','8992','120','10561','','','','',''],
//     ['Koyanskaya','Assassin','Beast','0.00','0','1','0.30','Archer','1.50','Never','TmpVitchMerlinHack','90','11616','100','12715','120','14925','','','','',''],
//     ['Liz','Lancer','Man','1.00','0','1','0.30','AlterEgo','1.50','Never','TmpCastoria0','80','9122','100','11045','120','12968','','','','',''],
//     ['Liz (Halloween)','Caster','Man','0.00','0','5','0.30','Lancer','1.50','Never','TmpCastoria0','80','8616','100','10432','120','12249','','','','',''],
//     ['Maou Nobu','Avenger','Earth','0.00','0','1','0.30','AlterEgo','1.50','Divine','TmpWaver20','90','12641','100','13838','120','16242','','','','',''],
//     ['Martha','Rider','Man','1.00','0','1','0.30','Berserker','1.50','Never','TmpCastoria0','80','8014','100','9703','120','11393','','','','',''],
//     ['Melusine','Lancer','Earth','0.00','0','1','0.30','Lancer','1.50','Never','TmpMelusine','90','12154','100','13304','120','15617','','','','',''],
//     ['Mephistopheles','Caster','Earth','1.00','0','5','0.30','Berserker','1.50','Never','TmpCastoria0','70','6839','100','9255','120','10870','','','','',''],
//     ['Mordred','Saber','Earth','1.00','0','1','0.30','Saber','1.80','Arthur','TmpObeVitchVsKnights50','90','11723','100','12833','120','15063','','','','',''],
//     ['Morgan','Berserker','Earth','0.00','0','1','0.00','Saber','1.50','Man','TmpVitch40','90','12193','100','13347','120','15667','','','','',''],
//     ['Napoleon','Archer','Star','1.00','0','1','0.30','Rider','1.50','Divine','TmpWaver20Backloaded','90','12033','100','13172','120','15461','','','','',''],
//     ['Nero (Caster)','Caster','Man','0.00','0','1','0.30','Ruler','1.50','Never','TmpVitch40','90','10857','100','11885','120','13950','','','','',''],
//     ['Nezha','Lancer','Sky','1.00','0','1','0.30','Caster','1.50','Never','TmpWaver20','80','9284','100','11241','120','13198','','','','',''],
//     ['Nobunaga','Archer','Man','0.00','0','5','0.30','Rider','1.50','Riding','TmpCastoria0Backloaded','80','9494','100','11495','120','16583','','','','',''],
//     ['Oberon','Pretender','Earth','0.00','0','1','0.30','Caster','1.50','Lawful','TmpOberonDPSWithDoubleVitch','90','11810','100','12928','120','15174','','','','',''],
//     ['Okita (Alter)','AlterEgo','Man','0.00','0','1','0.30','Caster','1.50','Never','TmpWaver20','90','12465','100','13645','120','16016','','','','',''],
//     ['Osakabehime (Archer)','Archer','Earth','0.00','0','1','0.30','Assassin','1.50','Never','TmpCastoria0Backloaded','80','8895','100','10770','120','12645','','','','',''],
//     ['Ozymandias','Rider','Sky','2.00','1','1','0.30','Archer','1.50','Never','TmpObeOzy1-1-X','90','11971','100','13104','120','15381','','','','',''],
//     ['Passionlip','AlterEgo','Earth','1.00','0','1','0.30','Assassin','1.50','Never','TmpCastoria0','80','10299','100','12470','120','14641','','','','',''],
//     ['Quetz (Ruler)','Ruler','Sky','0.00','0','5','0.30','Ruler','1.50','Never','TmpCastoria0','80','11306','100','13708','120','16111','','','','',''],
//     ['Raikou','Berserker','Sky','1.00','0','1','0.00','Saber','1.50','Never','TmpCastoria0','90','11556','100','12650','120','14848','','','','',''],
//     ['Romulus','Lancer','Star','1.00','0','5','0.30','Berserker','1.50','Never','TmpWaver20','70','7239','100','9797','120','11506','','','','',''],
//     ['Romulus (Grand)','Lancer','Sky','0.00','0','1','0.30','Ruler','1.20','Roman','TmpWaver20','90','12273','100','13435','120','15770','','','','',''],
//     ['Semiramis','Assassin','Earth','1.00','0','1','0.30','Saber','1.50','Never','TmpReines10','90','11309','100','12379','120','14531','','','','',''],
//     ['Shakespeare','Caster','Man','1.00','0','5','0.30','Caster','1.50','Never','TmpWaver20','65','5798','100','8402','120','9895','','','','',''],
//     ['Siegfried','Saber','Earth','1.00','0','1','0.30','Saber','1.50','Dragon','TmpWaver20','80','8181','100','9905','120','11630','','','','',''],
//     ['Space Ishtar','Avenger','Star','0.00','0','1','0.30','Archer','1.50','Never','TmpVitch40','90','12612','100','13806','120','16205','','','','',''],
//     ['Spartacus','Berserker','Man','1.00','0','5','0.00','Saber','1.50','Never','TmpCraneBronze10','60','5073','100','7883','120','9290','','','','',''],
//     ['Suzuka','Saber','Sky','1.00','0','1','0.30','Ruler','1.50','Never','TmpCastoria0','80','9544','100','11556','120','13568','','','','',''],
//     ['Tesla','Archer','Star','1.00','0','1','0.30','Caster','1.50','Earth or Sky','TmpVitch40Backloaded','90','11781','100','12896','120','15137','','','','',''],
//     ['Touta','Archer','Man','1.00','0','5','0.30','Berserker','1.50','Never','TmpCastoria0Backloaded','70','7032','100','9517','120','11177','','','','',''],
//     ['Yu','Assassin','Earth','0.00','0','1','0.30','Ruler','1.50','Never','TmpReines10','80','7970','100','9650','120','11330','','','','',''],
// ].map(row => {
//     let result: any = {
//         name: row[0],
//         sClass: row[1],
//         attribute: row[2],
//         npUpgrade: Number.parseFloat(row[3]),
//         npMultiplier: [ 3.0, 4.0, 4.5, 4.75, 5.0 ].map(m => m * (1+Number.parseFloat(row[4]))),
//         appendTarget: row[7],
//         extraDamage: [ Number.parseFloat(row[8]), Number.parseFloat(row[8]), Number.parseFloat(row[8]), Number.parseFloat(row[8]), Number.parseFloat(row[8]) ],
//         extraTrigger: row[9],
//         growthCurve: getGrowthCurve(row),
//         chargeProfile: "",
//         iconUrl: "",
//         npType: "Buster",
//     };
//     switch (row[11]) {
//         case "60": result.rarity = 1; break;
//         case "65": result.rarity = 2; break;
//         case "70": result.rarity = 3; break;
//         case "80": result.rarity = 4; break;
//         case "90": result.rarity = 5; break;
//     }
//     switch (result.rarity) {
//         case 1:
//         case 2:
//         case 3:
//             result.f2pCopies = 5; //not accurate but w/e
//             break;
//         case 5:
//             result.f2pCopies = 0;
//             break;
//         case 4:
//             if (row[5] == "1") result.f2pCopies = 0;
//             else result.f2pCopies = 5;
//             break;
//     }
//     return result;
// });