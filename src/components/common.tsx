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
 * Base class for components which provide an interface for updating data owned by a parent component.
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
                type="number" variant="outlined"
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
        this.handleChange({ $set: value });
    }
}

export { BaseComponent, PercentInput, StateWrapper };
export type { BaseProps };
