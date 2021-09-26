import { Card, CardContent, CardHeader, IconButton, TextField } from "@material-ui/core";
import { Add, Remove } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import React from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType } from "../Servant";
import { BaseComponent, BaseProps, PercentInput } from "./common";

interface BuffSelectorProps extends BaseProps<Buff> {
    
}

class BuffSelector extends BaseComponent<Buff, BuffSelectorProps, any, any> {
    render() {
        return (
            <React.Fragment>
                <Autocomplete
                    options={Object.values(BuffType)}
                    value={this.props.value.type}
                    renderInput={params => <TextField label="Buff Type" {...params} variant="outlined" />}
                    onChange={(_, v) => this.handleChange({ type: {$set: v as BuffType} })}
                    disableClearable={true} />
                <PercentInput
                    value={this.props.value.val}
                    onChange={ v => { this.handleChange({ val: { $set: v } }); }}
                    label="Buff Value" />
            </React.Fragment>
        );
    }
}

interface CEBuilderProps extends BaseProps<CraftEssence> {
    
}

class CEBuilder extends BaseComponent<CraftEssence, CEBuilderProps, CraftEssence, any> {
    render() {
        return (
            <div>
                <TextField
                    style={{ width: 80 }}
                    type="number" variant="outlined"
                    label="Attack"
                    value={this.props.value.attackStat.toString()}
                    onChange={(e) => { if (e.target.value) this.handleChange({ attackStat: { $set: Number.parseInt(e.target.value) } })}} />
                {this.props.value.buffs.map((buff, index) =>
                    <Card key={JSON.stringify([ index, buff ])}>
                        <CardHeader action={<IconButton onClick={_ => this.handleChange({ buffs: { $splice: [[ index, 1 ]] } })}><Remove /></IconButton>} />
                        <CardContent>
                            <BuffSelector value={buff} onChange={(buff: Buff) => this.handleChange({ buffs: { $splice: [[ index, 1, buff ]] } })} />
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader action={<IconButton onClick={e => this.handleChange({ buffs: { $push: [ new Buff(true, false, BuffType.NpDmgUp, 0, -1) ] } })}><Add /></IconButton>} />
                </Card>
            </div>
        );
    }
}

export { CEBuilder, BuffSelector }