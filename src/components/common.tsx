import * as React from "react";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { Autocomplete, Box, Card, CardContent, CardHeader, Chip, IconButton, InputAdornment, Popover, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Add, ContentCopy, Delete, Remove, Save } from "@mui/icons-material";
import { Named, Persistor } from "../Data";
import { useState, useCallback } from "react";
import { Trait } from "../Enemy";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";

export type Changeable<V> = { onChange?: (value: V) => void }
export type Settable<V> = Changeable<{ $set: V }>;
export type Updateable<V> = Changeable<Spec<V>>;
export type Valued<V> = { value: V };
export type Props<V> = Valued<V> & Updateable<V>;
export type AtomicProps<V> = Valued<V> & Settable<V>;

//variadic type parameters are inadequate. maybe there is some way to combine these using Parameters<F> but I haven't had any luck getting that to do anything useful
export function useHandler0<P>(handle: () => P, props: Changeable<P>, ...otherDependencies: any): () => void {
    const handler = () => {
        if (props.onChange) props.onChange(handle());
    };
    return useCallback(handler, [props.onChange, ...otherDependencies]);
}

export function useHandler<P, V>(adapt: (args: V) => P, props: Changeable<P>, ...otherDependencies: any): (args: V) => void {
    const handler = (args: V) => {
        if (props.onChange) props.onChange(adapt(args));
    };
    return useCallback(handler, [props.onChange, ...otherDependencies]);
}

export function useHandler2<P, V1, V2>(adapt: (arg1: V1, arg2: V2) => P, props: Changeable<P>, ...otherDependencies: any): (arg1: V1, arg2: V2) => void {
    const handler = (arg1: V1, arg2: V2) => {
        if (props.onChange) props.onChange(adapt(arg1, arg2));
    };
    return useCallback(handler, [props.onChange, ...otherDependencies]);
}

export function useHandler3<P, V1, V2, V3>(adapt: (arg1: V1, arg2: V2, arg3: V3) => P, props: Changeable<P>, ...otherDependencies: any): (arg1: V1, arg2: V2, arg3: V3) => void {
    const handler = (arg1: V1, arg2: V2, arg3: V3) => {
        if (props.onChange) props.onChange(adapt(arg1, arg2, arg3));
    };
    return useCallback(handler, [props.onChange, ...otherDependencies]);
}

export function wasteHandler() {
    useCallback(() => {}, []);
    return null;
}

interface NumberInputProps extends AtomicProps<number> {
    label?: string;
}

interface NumberInputState {
    value: number;
    displayValue: string;
}

export const PercentInput = React.memo(function(props: NumberInputProps) {
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
        const value = stringValue == "" ? 0 : Number.parseFloat(stringValue) / 100;
        setState({ value: value, displayValue: stringValue });
        return { $set: value };
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
            onChange={useHandler(e => onChange(e.target.value), props)} />
    );
});

export const IntegerInput = React.memo(function(props: NumberInputProps) {
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
        return { $set: value };
    }

    return (
        <TextField
            type="number"
            label={props.label}
            value={state.displayValue}
            onKeyPress={e => { if ([".", "e"].includes(e.key)) e.preventDefault(); }}
            placeholder="0"
            onChange={useHandler(e => onChange(e.target.value), props)} />
    );
});

export interface CommandProps<C> {
    command: C;
    onCommand: (command: C, ...args: any[]) => void;
}

//hacks the react runtime to assign arbitrary data to a component which can be accessed from a callback without having to inject that data into the actual DOM
//I pretty much just use this to insert array indices into callback argument lists so each iterated node uses the same callback identity
export const Commandable = <Component extends React.ComponentType<any>>(
    component: Component,
    event: keyof React.ComponentProps<Component>
) => {
    return React.memo(function<C>(props: CommandProps<C> & React.ComponentProps<Component>) {
        const callback = useCallback((...args) => props.onCommand(props.command, ...args), [props.command, props.onCommand]);
        //TODO: unset the extra args since Button is complaining about them
        //const spec: Spec<CommandProps<C> & React.ComponentProps<Component>, never> = { $unset: ["command", "onCommand"] };
        //const cleansed = update(props, spec);
        return React.createElement(component, { ...props, command: undefined, onCommand: undefined, [event]:  callback}, props.children);
    }) as <C>(props: CommandProps<C> & React.ComponentProps<Component>) => JSX.Element;
}

export const CommandIconButton = Commandable(IconButton, "onClick");

export interface ArrayBuilderProps<T> {
    createOne: () => T;
    renderOne: (item: T, index: number, onChange: (index: number, args: Spec<T>) => void) => JSX.Element;
    renderHeader?: (item: T, index: number) => any;
    addLabel: React.ReactNode;
    canCopy?: boolean;
    customButtons?: (item: T, index: number) => JSX.Element;
}

export const ArrayBuilder: <T>(props: ArrayBuilderProps<T> & Props<T[]>) => JSX.Element = React.memo(function<T>(props: ArrayBuilderProps<T> & Props<T[]>) {
    const createOne = useHandler(_ => ({ $push: [ props.createOne() ] }), props);
    const copy = useHandler((index: number) => ({ $apply: (items: T[]) => items.concat([items[index]])}), props);
    const remove = useHandler((index: number) => ({ $splice: [[ index, 1 ] as [number, number]] }), props);
    const update = useHandler2((index: number, args: Spec<T>) => ({ [index]: args }), props)
    return (
        <React.Fragment>
            <Card>
                <CardHeader title={props.addLabel}
                    action={<IconButton title="Add" onClick={createOne}><Add /></IconButton>} />
            </Card>
            {props.value.map((item, index) =>
                <Card key={index}>
                    <CardHeader title={props.renderHeader ? props.renderHeader(item, index) : undefined}
                        action={
                            <Box>
                                {props.customButtons ? props.customButtons(item, index) : null}
                                {props.canCopy ? <CommandIconButton title="Copy" command={index} onCommand={copy}><ContentCopy /></CommandIconButton> : null}
                                <CommandIconButton title="Remove" command={index} onCommand={remove}><Remove /></CommandIconButton>
                            </Box>} />
                    <CardContent>
                        {props.renderOne(item, index, update)}
                    </CardContent>
                </Card>
            )}
        </React.Fragment>
    );
}) as any;

export const CommandArrayBuilder: <T, C>(props: ArrayBuilderProps<T> & Props<T[]> & CommandProps<C>) => JSX.Element = Commandable(ArrayBuilder, "onChange") as (props: any) => JSX.Element;

type SmartSelectProps<T extends Named> = Settable<T> & {
    value?: T;
    provider: Persistor<T>;
    label: string;
    endAdornment?: React.ReactNode;
    filter?: (t: T) => boolean;
    autoFocus?: boolean | undefined;
    className?: string;
}

//there is nothing smart about this but I can't think of a good name to distinguish it from a regular autocomplete
export const SmartSelect: <T extends Named>(props: SmartSelectProps<T>) => JSX.Element = React.memo(function<T extends Named>(props: SmartSelectProps<T>) {
    return (
        <Autocomplete
            options={props.filter ? props.provider.getAll().filter(props.filter) : props.provider.getAll()}
            value={props.value}
            isOptionEqualToValue={(a, b) => a.name == b.name}
            getOptionLabel={v => v.name}
            renderInput={params =>
                <TextField {...params} label={props.label} autoFocus={props.autoFocus}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: props.endAdornment ?? params.InputProps.endAdornment
                    }} />
            }
            onChange={useHandler2((_, v: T | null) => ({ $set: v! }), props)}
            forcePopupIcon={!props.endAdornment}
            className={props.className} />
    );
}) as any;

export type SaveableSelectProps<T extends Named> = {
    provider: Persistor<T>;
    label: string;
    saveLabel: string;
    filter?: (t: T) => boolean;
    customButtons?: JSX.Element;
} & AtomicProps<T>;

export const SaveableSelect: <T extends Named>(props: SaveableSelectProps<T>) => JSX.Element =
React.memo(function<T extends Named>(props: SaveableSelectProps<T>) {
    const theme = useTheme();
    const popupState = usePopupState({ variant: "popover", popupId: "SaveableSelect" });
    //TODO: make this populate correctly again
    const [ newName, setNewName ] = useState(props.provider.getCustomName(props.value));

    const onSelect = useHandler((x: { $set: T }) => {
        setNewName(props.provider.getCustomName(x.$set));
        return x;
    }, props);

    const doSave = useCallback(() => {
        if (newName) {
            const newItem = props.provider.asCustom(props.value, newName);
            props.provider.put(newItem);
            if (props.onChange) props.onChange({ $set: newItem });
            popupState.setOpen(false);
        } else console.log(JSON.stringify(props.value));
    }, [props.onChange, props.value, newName]);

    const doDelete = useHandler(_ => {
        props.provider.delete(props.value);
        const allItems = props.provider.getAll();
        const newSelected =
            allItems.find(item => item.name.localeCompare(props.value.name) > 0) ??
            allItems[allItems.length - 1];
        return { $set: newSelected };
    }, props, props.value);

    return (
        <React.Fragment>
            <SmartSelect {...props} onChange={onSelect}
                endAdornment={
                    <InputAdornment position="end">
                        {props.customButtons ?? null}
                        {props.provider.isCustom(props.value) ?
                            <IconButton title="Delete"
                                onClick={doDelete}>
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
                <Card sx={{ border: 1, borderColor: theme.palette.divider }}>
                    <CardContent>
                        <Stack justifyContent="space-evenly" spacing={2} direction="row">
                            <TextField autoFocus label={props.saveLabel} value={newName} onChange={useCallback(e => setNewName(e.target.value), [])}
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
}) as any;

export const TraitSelect = React.memo(function(props: AtomicProps<Trait[]> & { label?: string }) {
    return (
        <Autocomplete multiple disableClearable={false}
            options={Object.values(Trait)}
            value={props.value}
            onChange={useHandler2((_, traits) => ({
                    $set: props.value.length == 1 && props.value[0] == Trait.Always ? traits.filter(trait => trait != Trait.Always) : traits
                }), props
            )}
            forcePopupIcon={false}
            renderInput={params => <TextField {...params} label={props.label} />}
            renderTags={(traits, getTagProps) => traits.map((trait, index) => <Chip label={trait} {...getTagProps({ index })} title={trait} />)} />
    );
});

export const CommandIntInput = Commandable(IntegerInput, "onChange");
export const CommandPercentInput = Commandable(PercentInput, "onChange");
export const CommandTraitSelect = Commandable(TraitSelect, "onChange");

const memo: Map<string, Object> = new Map([]);
export function memoized<T extends Object>(command: T): T {
    //JSON.stringify is an infallible method of object comparison and everyone uses it as such
    const key = JSON.stringify(command);
    const memoized = memo.get(key);
    if (memoized) return memoized as T;
    memo.set(key, command);
    return command;
}