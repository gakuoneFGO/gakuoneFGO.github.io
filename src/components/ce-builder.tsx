import { Box, Card, CardContent, CardHeader, IconButton, TextField } from "@material-ui/core";
import { Add, Remove } from "@material-ui/icons";
import { Autocomplete } from "@material-ui/lab";
import React from "react";
import { CraftEssence } from "../Damage";
import { Buff, BuffType, CardType } from "../Servant";
import { BaseComponent, BaseProps, PercentInput, StateWrapper, KeyTracker } from "./common";
import update from "immutability-helper";
import { Trait } from "../Enemy";

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
                    onChange={(_, v) => this.handleBuffTypeChanged(v)}
                    disableClearable={true} />
                <PercentInput
                    value={this.props.value.val}
                    onChange={ v => { this.handleChange({ val: { $set: v } }); }}
                    label="Buff Value" />
                <Box display={ this.props.value.type == BuffType.CardTypeUp ? undefined : "none" }>
                    <Autocomplete
                        options={Object.values(CardType)}
                        value={this.props.value.cardType ?? CardType.Extra}
                        renderInput={params => <TextField label="Card Type" {...params} variant="outlined" />}
                        onChange={(_, v) => this.handleChange({ cardType: {$set: v } })}
                        disableClearable={true} />
                </Box>
                <Box display={this.props.value.type == BuffType.PowerMod ? undefined : "none" }>
                    <Autocomplete
                        options={Object.values(Trait)}
                        value={this.props.value.trig ?? Trait.Never}
                        renderInput={params => <TextField label="Trigger" {...params} variant="outlined" />}
                        onChange={(_, v) => this.handleChange({ trig: {$set: v } })}
                        disableClearable={true} />
                </Box>
            </React.Fragment>
        );
    }

    handleBuffTypeChanged(type: BuffType) {
        var cardType: CardType | undefined = undefined;
        var trig: Trait | undefined = undefined;
        switch (type) {
            case BuffType.CardTypeUp:
                cardType = CardType.Buster;//TODO
                break;
            case BuffType.PowerMod:
                trig = Trait.Always;
                break;
        }
        this.handleChange({ type: {$set: type }, cardType: { $set: cardType }, trig: { $set: trig } });
    }
}

interface CEBuilderProps extends BaseProps<CraftEssence> {
    label?: string;
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
                <Autocomplete
                    options={ceNames}
                    value={this.props.value.name}
                    renderInput={params => <TextField {...params} label={this.props.label} variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ $set: ceMap.get(v) as CraftEssence }) }}
                    disableClearable={true} />
                <TextField
                    style={{ width: 80 }}
                    type="number" variant="outlined"
                    label="Attack Stat"
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

let ceList = [
    new CraftEssence("<None>", 0, []),
    new CraftEssence("Event Damage (+100%)", 0, [ new Buff(true, false, BuffType.PowerMod, 1, -1, undefined, Trait.Always) ]),
    new CraftEssence("Event Damage (MLB +200%)", 0, [ new Buff(true, false, BuffType.PowerMod, 2, -1, undefined, Trait.Always) ]),
    new CraftEssence("The Black Grail (Lvl 100)", 2400, [ new Buff(true, false, BuffType.NpDmgUp, .8, -1) ]),
    new CraftEssence("The Black Grail (Lvl 20)", 980, [ new Buff(true, false, BuffType.NpDmgUp, .6, -1) ]),
];

let ceNames = ceList.map(ce => ce.name).sort();
let ceMap = new Map<string, CraftEssence>(ceList.map(ce => [ ce.name, ce ]));

export { CEBuilder, BuffSelector }