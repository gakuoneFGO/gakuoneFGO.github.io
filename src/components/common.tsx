import * as React from "react";
import * as ReactDOM from "react-dom";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { Autocomplete, AutocompleteRenderInputParams, Card, CardContent, CardHeader, IconButton, InputAdornment, Popover, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Add, Delete, Remove, Save } from "@mui/icons-material";
import { JsxElement } from "typescript";
import { Named, Persistor } from "../Data";
import { useState } from "react";
import { Trait } from "../Enemy";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";

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

interface NumberInputProps extends BaseProps<number> {
    label?: string;
}

interface NumberInputState {
    value: number;
    displayValue: string;
}

export function PercentInput(props: NumberInputProps) {
    const getDisplayValue = (value: number): NumberInputState => {
        if (value == 0) return { value: value, displayValue: "" };
        let displayValue = (value * 100).toFixed(2).replace(/(0|\.00)$/, "");
        return { value: value, displayValue: displayValue };
    }

    const [ state, setState ] = useState(getDisplayValue(props.value));

    if (Math.abs(state.value - props.value) >= 0.00005) {
        setState(getDisplayValue(props.value));
    }

    const onChange = (stringValue: string) => {
        //TODO: validate input (mostly just prevent excess precision)
        let value = stringValue == "" ? 0 : Number.parseFloat(stringValue) / 100;
        setState({ value: value, displayValue: stringValue });
        handleChange({ $set: value }, props);
    }

    return (
        <TextField
            type="number"
            label={props.label}
            value={state.displayValue}
            placeholder="0"
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                )
            }}
            onChange={e => { onChange(e.target.value) }} />
    );
}

export function IntegerInput(props: NumberInputProps) {
    const getDisplayValue = (value: number): NumberInputState => {
        return { value: value, displayValue: value == 0 ? "" : value.toString() };
    }

    const [ state, setState ] = useState(getDisplayValue(props.value));

    if (state.value != props.value) {
        setState(getDisplayValue(props.value));
    }

    const onChange = (stringValue: string) => {
        //TODO: validate input
        let value = stringValue == "" ? 0 : Number.parseInt(stringValue);
        setState({ value: value, displayValue: stringValue });
        handleChange({ $set: value }, props);
    }

    return (
        <TextField
            type="number"
            label={props.label}
            value={state.displayValue}
            onKeyPress={e => { if ([".", "e"].includes(e.key)) e.preventDefault(); }}
            placeholder="0"
            onChange={e => { onChange(e.target.value) }} />
    );
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

interface SmartSelectProps<T extends { name: string }> {
    provider: Persistor<T>;
    label: string;
    endAdornment: React.ReactNode;
    filter?: (t: T) => boolean;
}

//TODO: there is nothing smart about this but I can't think of a good name to distinguish it from a regular autocomplete
export function SmartSelect<T extends { name: string }>(props: SmartSelectProps<T> & BaseProps<T>) {
    return (
        <Autocomplete
            options={props.filter ? props.provider.getAll().filter(props.filter) : props.provider.getAll()}
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

export interface SaveableSelectProps<T extends { name: string }> {
    provider: Persistor<T>;
    label: string;
    filter?: (t: T) => boolean;
}

export function SaveableSelect<T extends Named>(props: SaveableSelectProps<T> & BaseProps<T>) {
    const theme = useTheme();
    const popupState = usePopupState({ variant: "popover", popupId: "ServantSelector" });
    const [ state, setState ] = useState({ newName: "" });

    const doSave = () => {
        if (state.newName){
            const newItem = update(props.value as Named, { name: { $set: "* " + state.newName } }) as T;
            props.provider.put(newItem);
            props.onChange(newItem);
            popupState.setOpen(false);
        } else console.log(JSON.stringify(props.value));
    }

    return (
        <React.Fragment>
            <SmartSelect {...props} endAdornment={
                    <InputAdornment position="end">
                        {props.provider.isCustom(props.value) ?
                            <IconButton title="Delete"
                                onClick={() => {
                                    props.provider.delete(props.value);
                                    const allItems = props.provider.getAll();
                                    const newSelected =
                                        allItems.find(item => item.name.localeCompare(props.value.name) > 0) ??
                                        allItems[allItems.length - 1];
                                    props.onChange(newSelected);
                                }}>
                                <Delete />
                            </IconButton>
                        : null}
                        <IconButton title="Save" {...bindTrigger(popupState)}>
                            <Save />
                        </IconButton>
                    </InputAdornment>
                } />
            <Popover {...bindPopover(popupState)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}>
                <Card sx={{ border: 1, borderColor: theme.palette.divider /* TODO: use same rule as input outlines */ }}>
                    <CardContent>
                        <Stack justifyContent="space-evenly" spacing={2} direction="row">
                            <TextField autoFocus label="Node Name" value={state.newName} onChange={e => setState({ newName: e.target.value })}
                                onKeyPress={e => { if (e.code == "Enter") doSave() }} />
                            <IconButton title="Save"
                                onClick={doSave}>
                                <Save />
                            </IconButton>
                        </Stack>
                    </CardContent>
                </Card>
            </Popover>
        </React.Fragment>
    );
}

export function TraitSelect(props: BaseProps<Trait[]> & { label?: string }) {
    return (
        <Autocomplete multiple disableClearable={false}
            options={Object.values(Trait)}
            value={props.value}
            onChange={(_, v) => { if(v) props.onChange(v) }}
            renderInput={params => <TextField {...params} label={props.label} />} />
    );
}

export { BaseComponent, StateWrapper, handleChange, ArrayBuilder };
export type { BaseProps };