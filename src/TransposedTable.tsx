import * as React from "react";
import * as ReactDOM from "react-dom";
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Grid, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@material-ui/core";

class TransposedTableBody extends React.Component<any, any, any> {

    render() {return (
            <TableBody>
                {React.Children.toArray((React.Children.toArray(this.props.children)[0] as React.Component).props.children).map((_, rowIndex) => {
                    return (
                        <TableRow key={rowIndex}>
                            {React.Children.map(this.props.children, child => {
                                return React.Children.toArray((child as React.Component).props.children)[rowIndex];
                            })}
                        </TableRow>
                    );
                })}
            </TableBody>
        );
    }
}

export { TransposedTableBody };