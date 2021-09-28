import { Checkbox, FormControlLabel, Grid, TextField, Autocomplete, Stack, Card, CardContent, Box } from "@mui/material";
import { allData, Data } from "../Data";
import { Template } from "../Strat";
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
            //Stack shifts the servant cards to the right for some reason, hence using column grid
            <Grid container spacing={2} direction="column">
                <Grid item>
                    <Autocomplete
                        options={this.templateList}
                        value={this.props.value.name}
                        renderInput={params => <TextField {...params} label="Select Template" variant="outlined" />}
                        onChange={(e, v) => { if (v) this.loadTemplate(v)}}
                        disableClearable={true} />
                </Grid>
                <Grid item container spacing={2}>
                    {this.props.value.party.map((servant, index) =>(
                        <Grid item xs={12} sm={6} md={12} lg={4} key={index}>
                            <Card>
                                <CardContent>
                                    <ServantSelector
                                        value={servant}
                                        label={"Servant " + (index + 1)}
                                        onChange={s => this.handleChange({ party: { [index]: { $set: s } } })} />
                                        {/* TODO: reset checkboxes when setting back to unspecified */}
                                    <Stack justifyContent="space-evenly" direction="row">
                                        <FormControlLabel
                                            label="NP T1"
                                            labelPlacement="bottom"
                                            control={
                                                <Checkbox checked={this.props.value.clearers[0] == index}
                                                    onChange={(_, v) => this.handleClearerChanged(v, 0, index)}
                                                    disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                            } />
                                        <FormControlLabel
                                            label="NP T2"
                                            labelPlacement="bottom"
                                            control={
                                                <Checkbox checked={this.props.value.clearers[1] == index}
                                                    onChange={(_, v) => this.handleClearerChanged(v, 1, index)}
                                                    disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                            } />
                                        <FormControlLabel
                                            label="NP T3"
                                            labelPlacement="bottom"
                                            control={
                                                <Checkbox checked={this.props.value.clearers[2] == index}
                                                    onChange={(_, v) => this.handleClearerChanged(v, 2, index)}
                                                    disabled={this.props.value.party[index].data.name == "<Unspecified>"} />
                                            } />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                <Grid item>
                    <BuffMatrixBuilder value={this.props.value.buffs}
                        servants={this.props.value.party}
                        onChange={buffs => this.handleChange({ buffs: { $set: buffs } })}
                        clearers={this.props.value.clearers.map(c => this.props.value.party[c])} />
                </Grid>
            </Grid>
        );
    }

    loadTemplate(name: string) {
        this.props.onChange(this.data?.templates.get(name) as Template);
    }

    handleClearerChanged(value: boolean, turnIndex: number, clearerIndex: number) {
        if (!value) return;
        this.handleChange({ clearers: { [turnIndex]: { $set: clearerIndex } } });
    }
}

export { TemplateBuilder }