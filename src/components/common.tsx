import * as React from "react";
import * as ReactDOM from "react-dom";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { Autocomplete, AutocompleteRenderInputParams, Card, CardContent, CardHeader, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { JsxElement } from "typescript";
import { Persistor } from "../Data";
import { CacheProvider } from "@emotion/react";

interface BaseProps<V> {
    value: V;
    onChange: (state: V) => void;
}

/**
 * Base class for components which provide a user interface for updating data owned by a parent component.
 */
class BaseComponent<V, P extends BaseProps<V>, S, SS> extends React.Component<P, S, SS> {
    constructor(props: P) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(spec: Spec<Readonly<V>, never>) {
        handleChange(spec, this.props);
    }
}

function handleChange<V>(spec: Spec<Readonly<V>, never>, props: BaseProps<V>) {
    //console.log(spec);
    if (props.onChange) {
        let newValue = update(props.value, spec);
        props.onChange(newValue);
    };
}

/**
 * Wrapping state in a POJO fixes two problems with React state objects:
 * 1. State is not allowed to be an array.
 * 2. State objects may not maintain the inheritance hierarchy (prototype can be "reassigned", causing methods to be missing at runtime).
 */
class StateWrapper<S> {
    constructor(readonly _: S) {}
}

interface PercentInputProps extends BaseProps<number> {
    label?: string;
}

interface PercentInputState {
    value: number;
    displayValue: string;
}

class PercentInput extends BaseComponent<number, PercentInputProps, PercentInputState, any> {
    constructor(props: PercentInputProps) {
        super(props);
        this.state = PercentInput.getDisplayValue(props.value);
    }

    static getDerivedStateFromProps(props: any, state: PercentInputState): PercentInputState {
        if (Math.abs(state.value - props.value) < 0.00005) return state;
        return PercentInput.getDisplayValue(props.value);
    }
    
    render() {
        return (
            <TextField
                type="number"
                label={this.props.label}
                value={this.state.displayValue}
                placeholder="0"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                    )
                }}
                onChange={e => { this.onChange(e.target.value) }} />
        );
    }

    static getDisplayValue(value: number): PercentInputState {
        if (value == 0) return { value: value, displayValue: "" };
        let displayValue = (value * 100).toFixed(2).replace(/(0|\.00)$/, "");
        return { value: value, displayValue: displayValue };
    }

    onChange(stringValue: string) {
        //TODO: validate input (mostly just prevent excess precision)
        let value = stringValue == "" ? 0 : Number.parseFloat(stringValue) / 100;
        this.setState({ value: value, displayValue: stringValue });
        this.handleChange({ $set: value });
    }
}

interface ArrayBuilderProps<T> {
    createOne: () => T;
    renderOne: (item: T, props: ArrayBuilderRenderProps<T>, index: number) => any;
    renderHeader?: (item: T, index: number) => any;
    addLabel: React.ReactNode;
}

interface ArrayBuilderRenderProps<T> {
    onChange: (item: T) => void;
}

function ArrayBuilder<T>(props: ArrayBuilderProps<T> & BaseProps<T[]>) {
    return (
        <React.Fragment>
            {props.value.map((item, index) =>
                <Card key={index}>
                    <CardHeader title={props.renderHeader ? props.renderHeader(item, index) : undefined} action={<IconButton onClick={_ => handleChange({ $splice: [[ index, 1 ]] }, props)}><Remove /></IconButton>} />
                    <CardContent>
                        {props.renderOne(item, { onChange: item => handleChange({ $splice: [[ index, 1, item ]] }, props) }, index)}
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader title={props.addLabel}
                    action={<IconButton onClick={_ => handleChange({ $push: [ props.createOne() ] }, props)}><Add /></IconButton>} />
            </Card>
        </React.Fragment>
    );
}

interface SelectProps<T extends { name: string }> {
    provider: Persistor<T>;
    label: string;
    endAdornment: React.ReactNode;
}

//TODO: there is nothing smart about this but I can't think of a good name to distinguish it from a regular autocomplete
//TODO: template tab got a little laggy when I added this and caching getServantDefaults didn't completely fix it, so I think there's some issue with populating the autocomplete this way
function SmartSelect<T extends { name: string }>(props: SelectProps<T> & BaseProps<T>) {
    return (
        <Autocomplete
            options={props.provider.getAll()}
            value={props.value!}
            isOptionEqualToValue={(a, b) => a.name == b.name}
            getOptionLabel={v => v.name}
            renderInput={params =>
                <TextField {...params} label={props.label}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: props.endAdornment
                    }} />
            }
            onChange={(_, v) => { if (v) props.onChange(v as T) }}
            forcePopupIcon={!props.endAdornment} />
    );
}

export { BaseComponent, PercentInput, StateWrapper, handleChange, ArrayBuilder, SmartSelect };
export type { BaseProps };