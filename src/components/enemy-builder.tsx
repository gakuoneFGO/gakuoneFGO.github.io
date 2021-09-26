import { TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { BaseComponent, BaseProps } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";

interface EnemyBuilderProps extends BaseProps<Enemy> {
    
}

class EnemyBuilder extends BaseComponent<Enemy, EnemyBuilderProps, any, any> {
    render() {
        return (
            <div>
                <Autocomplete
                    options={Object.values(EnemyClass)}
                    value={this.props.value.eClass}
                    renderInput={params => <TextField {...params} label="Enemy Class" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ eClass: { $set: v as EnemyClass } }) }}
                    disableClearable={true} />
                <Autocomplete
                    options={Object.values(EnemyAttribute)}
                    value={this.props.value.attribute}
                    renderInput={params => <TextField {...params} label="Enemy Attribute" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ attribute: { $set: v as EnemyAttribute } }) }}
                    disableClearable={true} />
                <Autocomplete multiple
                    options={Object.values(Trait).sort()}
                    value={this.props.value.traits}
                    renderInput={params => <TextField {...params} label="Enemy Traits" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ traits: { $set: v as Trait[] } }) }} />
            </div>
        );
    }
}

export { EnemyBuilder }