import * as React from "react";

interface TransposedTableProps {
    children: React.ReactNode[];
    createRow: (children: (React.ReactChild | React.ReactFragment | React.ReactPortal)[] | null | undefined, rowIndex: number) => React.ReactNode;
}

export function TransposedTable(props: TransposedTableProps) {
    return (
        <React.Fragment>
            {React.Children.toArray((React.Children.toArray(props.children)[0] as React.Component).props.children).map((_, rowIndex) => 
                props.createRow(
                    React.Children.map(props.children, child => React.Children.toArray((child as React.Component).props.children)[rowIndex]),
                    rowIndex
                )
            )}
        </React.Fragment>
    );
}