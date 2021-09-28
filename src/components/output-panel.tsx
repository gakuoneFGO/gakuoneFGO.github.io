import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { StateWrapper } from "./common";
import { EnemyNode, NodeDamage, Strat } from "../Strat";
import update from "immutability-helper";
import NumberFormat from "react-number-format";
import { Enemy } from "../Enemy";

interface OutputPanelProps {
    strat: Strat;
    enemy: Enemy;
}

class OutputPanel extends React.Component<OutputPanelProps, StateWrapper<NodeDamage[]>, any> {
    constructor(props: OutputPanelProps) {
        super(props);
        this.state = new StateWrapper<NodeDamage[]>([]);
    }

    static getDerivedStateFromProps(props: OutputPanelProps): StateWrapper<NodeDamage[]> {
        let strat: Strat = props.strat;
        let output = [ 1, 2, 3, 4, 5 ].map(npLevel => {
            var tempStrat = update(strat, { servant: { config: { npLevel: { $set: npLevel } } } });
            //TODO: could use reduce instead. probably define a helper function then do that
            strat.template.clearers.flatMap(c => c).forEach(clearerIndex => {
                if (strat.template.party[clearerIndex].data.name != "<Placeholder>") {
                    tempStrat = update(tempStrat, { template: { party: { [clearerIndex]: { config: { npLevel: { $set: npLevel } } } } } });
                }
            });
            return tempStrat.run(EnemyNode.uniform(props.enemy));
        });
        return new StateWrapper(output);
    }

    render() {
        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            {this.state._.map((_, index) =>
                                <TableCell key={index}>NP{index + 1}</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state._[0].damagePerWave.map((_, waveIndex) =>
                            <TableRow key={waveIndex}>
                                <TableCell><strong>T{waveIndex + 1}</strong></TableCell>
                                {this.state._.map((nodeDamage, npIndex) =>
                                    <TableCell key={npIndex}>
                                        <NumberFormat
                                            displayType="text"
                                            thousandSeparator=","
                                            value={nodeDamage.damagePerWave[waveIndex].damagePerEnemy[0].low} />
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

export { OutputPanel }