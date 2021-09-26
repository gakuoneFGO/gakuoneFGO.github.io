import { Checkbox, FormControlLabel, Grid, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { allData, Data } from "../Data";
import { Servant } from "../Servant";
import { BuffMatrix, Template } from "../Strat";
import { BuffMatrixBuilder } from "./buff-matrix-builder";
import { BaseComponent, BaseProps } from "./common";
import { ServantSelector } from "./servant-selector";

interface TemplateBuilderProps extends BaseProps<Template> {
    
}

class TemplateBuilder extends BaseComponent<Template, TemplateBuilderProps, any, any> {
    constructor(props: TemplateBuilderProps) {
        super(props);
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
                    value={this.props.value.name}
                    renderInput={params => <TextField {...params} label="Select Template" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.loadTemplate(v)}}
                    disableClearable={true} />
                <Grid container>
                    {this.props.value.party.map((servant, index) =>(
                        <Grid item lg={4} md={6} sm={12} key={index}>
                            <ServantSelector
                                value={servant}
                                label={"Servant " + (index + 1)}
                                onChange={s => this.handleChange({ party: { [index]: { $set: s } } })} />
                                {/* TODO: reset checkboxes when setting back to unspecified */}
                            <Grid container justifyContent="space-evenly">
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T1"
                                        control={
                                            <Checkbox checked={this.props.value.clearers[0].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 0, index)}
                                                disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T2"
                                        control={
                                            <Checkbox checked={this.props.value.clearers[1].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 1, index)}
                                                disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                                <Grid item md={4}>
                                    <FormControlLabel
                                        label="NP T3"
                                        control={
                                            <Checkbox checked={this.props.value.clearers[2].includes(index)}
                                                onChange={(_, v) => this.handleClearerChanged(v, 2, index)}
                                                disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                        } />
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
                <BuffMatrixBuilder value={this.props.value.buffs} maxPowerMods={3} onChange={buffs => this.handleChange({ buffs: { $set: buffs } })} />
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
            let index = this.props.value.clearers[turnIndex].findIndex(i => i == clearerIndex);
            this.handleChange({ clearers: { [turnIndex]: { $splice: [[ index, 1 ]] } } })
        }
        console.log(JSON.stringify(this.props.value.buffs));
    }
}

export { TemplateBuilder }