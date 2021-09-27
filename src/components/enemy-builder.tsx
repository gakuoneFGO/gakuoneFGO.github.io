import { Box, TextField, Autocomplete } from "@mui/material";
import { BaseComponent, BaseProps } from "./common";
import { Enemy, EnemyAttribute, EnemyClass, Trait } from "../Enemy";

interface EnemyBuilderProps extends BaseProps<Enemy> {
    
}

class EnemyBuilder extends BaseComponent<Enemy, EnemyBuilderProps, any, any> {

    render() {
        return (
            <Box>
                <Autocomplete
                    options={Object.values(EnemyClass)}
                    value={this.props.value.eClass}
                    renderInput={params => <TextField {...params} label="Enemy Class" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ $set: this.props.value.changeClass(v) }); }}
                    disableClearable={true} />
                <Autocomplete
                    options={Object.values(EnemyAttribute)}
                    value={this.props.value.attribute}
                    renderInput={params => <TextField {...params} label="Enemy Attribute" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ $set: this.props.value.changeAttribute(v) }); }}
                    disableClearable={true} />
                <Autocomplete multiple
                    options={Object.values(Trait).filter(t => t != Trait.Always && t != Trait.Never).sort()}
                    value={this.props.value.traits}
                    renderInput={params => <TextField {...params} label="Enemy Traits" variant="outlined" />}
                    onChange={(e, v) => { if (v) this.handleChange({ traits: { $set: v as Trait[] } }); }} />
            </Box>
        );
    }
}

export { EnemyBuilder }