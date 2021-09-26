import * as React from "react";
import * as ReactDOM from "react-dom";
import update from "immutability-helper";
import { Spec } from "immutability-helper";
import { InputAdornment, TextField } from "@material-ui/core";

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
        //console.log(spec);
        if (this.props.onChange) {
            let newValue = update(this.props.value, spec);
            this.props.onChange(newValue);
        };
    }
}

/**
 * Wrapping state in a POJO fixes two problems with React state objects:
 * 1. State is not allowed to be an array.
 * 2. State objects may not maintain the inheritance hierarchy (prototype can be "reassigned", causing methods to be missing at runtime).
 */
class StateWrapper<S> {
    constructor(readonly _: S) {}
}

/**
 * Tracks keys for objects in an array which have a "stable identity" from a usage perspective but not in the data model.
 * API is currently limited to what I actually need.
 * TODO: revisit whether this does anything at all since the original bug (deleting buffs on CE tab when key is just the index deletes the wrong buff) doesn't seem to be an issue anymore
 */
class KeyTracker<T> {
    constructor(
        readonly keys: number[],
        readonly nextKey: number) {}

    static fromSource<T>(source: T[], initKey?: number): KeyTracker<T> {
        let init = initKey ? initKey : 0;
        return new KeyTracker<T>(source.map((_, i) => init + i), init + source.length);
    }

    reconcile(source: T[]): KeyTracker<T> {
        if (source.length == this.keys.length) return this;
        return KeyTracker.fromSource<T>(source, this.nextKey);
    }

    onPush(): KeyTracker<T> {
        return update(this as KeyTracker<T>, { keys: { $push: [ this.nextKey ] }, nextKey: { $set: this.nextKey + 1 } });
    }

    onRemove(index: number) {
        return update(this as KeyTracker<T>, { keys: { $splice: [[ index, 1 ]] } });
    }

    getKey(index: number): number {
        return this.keys[index];
    }
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
                type="number" variant="outlined"
                label={this.props.label}
                value={this.state.displayValue}
                placeholder="0"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                    )
                }}
                InputLabelProps={{ shrink: true }}
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

export { BaseComponent, PercentInput, StateWrapper, KeyTracker };
export type { BaseProps };
