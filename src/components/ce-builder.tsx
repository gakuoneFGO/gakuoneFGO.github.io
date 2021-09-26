import { Card, CardContent, CardHeader, IconButton, TextField } from "@material-ui/core";
import { Add, Remove } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import React from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType } from "../Servant";
import { BaseComponent, BaseProps, PercentInput, StateWrapper, KeyTracker } from "./common";
import update from "immutability-helper";

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

class CEBuilder extends BaseComponent<CraftEssence, CEBuilderProps, StateWrapper<KeyTracker<Buff>>, any> {
    constructor(props: CEBuilderProps) {
        super(props);
        this.state = new StateWrapper(KeyTracker.fromSource<Buff>(props.value.buffs));
        this.addBuff = this.addBuff.bind(this);
        this.removeBuff = this.removeBuff.bind(this);
    }

    static getDerivedStateFromProps(props: CEBuilderProps, state: StateWrapper<KeyTracker<Buff>>): StateWrapper<KeyTracker<Buff>> {
        return new StateWrapper(state._.reconcile(props.value.buffs));
    }

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
                    <Card key={this.state._.getKey(index)}>
                        <CardHeader action={<IconButton onClick={_ => this.removeBuff(index)}><Remove /></IconButton>} />
                        <CardContent>
                            <BuffSelector value={buff} onChange={(buff: Buff) => this.handleChange({ buffs: { $splice: [[ index, 1, buff ]] } })} />
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader action={<IconButton onClick={this.addBuff}><Add /></IconButton>} />
                </Card>
            </div>
        );
    }

    addBuff() {
        this.setState(new StateWrapper(this.state._.onPush()));
        this.handleChange({ buffs: { $push: [ new Buff(true, false, BuffType.NpDmgUp, 0, -1) ] } });
    }

    removeBuff(index: number) {
        this.setState(new StateWrapper(this.state._.onRemove(index)));
        this.handleChange({ buffs: { $splice: [[ index, 1 ]] } })
    }
}

export { CEBuilder, BuffSelector }