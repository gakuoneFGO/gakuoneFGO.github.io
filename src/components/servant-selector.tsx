import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, InputLabel, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React from "react";
import { allData, Data } from "../Data";
import { Servant } from "../Servant";
import { BaseComponent, BaseProps } from "./common";

interface ServantSelectorProps extends BaseProps<Servant> {
    label?: string;
}

class ServantSelector extends BaseComponent<Servant, ServantSelectorProps, any, any> {
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
                    value={this.props.value.data.name}
                    renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ $set: (ServantSelector.data as Data).getServantDefaults(v) }) }}
                    disableClearable={true} />
                <Accordion variant="outlined">
                    <AccordionSummary>
                        Detailed Stats
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container justifyContent="space-evenly">
                            <Grid item>
                                <Autocomplete
                                    options={this.props.value.data.growthCurve.getValidLevels()}
                                    value={this.props.value.config.level.toString()}
                                    renderInput={params => <TextField {...params} label="Level" variant="outlined" />}
                                    onChange={(e, v) => { if (v) this.handleChange({ config: { level: { $set: Number.parseInt(v) } } })}}
                                    disableClearable={true} />
                            </Grid>
                            <Grid item>
                                <Autocomplete
                                    options={["1", "2", "3", "4", "5"]}
                                    value={this.props.value.config.npLevel.toString()}
                                    renderInput={params => <TextField {...params} label="NP Level" variant="outlined" />}
                                    onChange={(e, v) => { if (v) this.handleChange({ config: { npLevel: { $set: Number.parseInt(v) } } })}}
                                    disableClearable={true} />
                            </Grid>
                            <Grid item>
                                <TextField
                                    style={{ width: 80 }}
                                    type="number" variant="outlined"
                                    label="Fous"
                                    value={this.props.value.config.attackFou.toString()}
                                    onChange={(e) => { if (e.target.value) this.handleChange({ config: { attackFou: { $set: Number.parseInt(e.target.value) } } })}} />
                            </Grid>
                            <Grid item>
                                <InputLabel>NP Upgrade</InputLabel>
                                <Checkbox checked={this.props.value.config.isNpUpgraded} onChange={(e, v) => this.handleChange({ config: { isNpUpgraded: {$set: v } } }) } />
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </React.Fragment>
        );
    }
}

export { ServantSelector }