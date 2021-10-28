import { SvgIcon } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React from "react";
import { EnemyClass } from "../calc/enemy";
import { ServantClass } from "../calc/servant";

const useStyles = makeStyles({
    root: {
        fill: "none",
        stroke: "currentColor"
    }
});

export const ClassIcon = React.memo(function(props: { type: EnemyClass | ServantClass, title?: string, style?: any }) {
    return Object.values(ServantClass).includes(props.type as string as ServantClass) ?
        <img {...props} src={`images/classes/${props.type}.png`} /> :
        <img {...props} src="images/classes/unknown.png" />;
});

// const icons = new Map([
//     ["saber", (props: any) => <Saber {...props} />],
//     ["lancer", (props: any) => <img {...props} src="images/classes/lancer.png" />],
//     ["archer", (props: any) => <img {...props} src="images/classes/archer.png" />],
//     ["rider", (props: any) => <img {...props} src="images/classes/rider.png" />],
//     ["caster", (props: any) => <img {...props} src="images/classes/caster.png" />],
//     ["assassin", (props: any) => <img {...props} src="images/classes/assassin.png" />],
//     ["berserker", (props: any) => <img {...props} src="images/classes/berserker.png" />],
// ]);

export function Locked() {
    const classes = useStyles();
    return (
        <SvgIcon className={classes.root}>
            <path fill="currentcolor" strokeLinejoin="round" d="M4 21h16v-11h-16z" />
            <path strokeWidth="2" d="M17 10v-3a5 5 0 0 0 -10 0v3" />
        </SvgIcon>
    );
}

export function Unlocked() {
    const classes = useStyles();
    return (
        <SvgIcon className={classes.root}>
            <path fill="currentcolor" strokeLinejoin="round" d="M4 21h16v-11h-16z" />
            <path strokeWidth="2" d="M17 10v-3a5 5 0 0 0 -10 0" />
        </SvgIcon>
    );
}

//svg is recognizable but takes too long to make and honestly just looks worse than the image icons
export function Saber(props: any) {
    const classes = useStyles();
    return (
        <SvgIcon {...props} className={classes.root}>
            <polygon fill="none" points="12 1.5, 22.5 12, 12 22.5, 1.5 12" />
            
            <path fill="none" stroke-width="1.5" d="
                M 11.5 3
                c 2 2, 1.3 2.4, 1.5 6
                s .8 3.8, 1.3 4.3
            "/>
            <path fill="none" stroke-width="1.2" stroke-linejoin="round" d="
                M 13.9 12.9
                l -1.4 1.4
                c 1 1, 3 1, 4 -.5
                m -4 .5
                c 1.8 2.3, 2.7 2.8, 5 .5
            "/>
            <line x1="12" x2="13" y1="16.5" y2="15.5" />
            
            <path fill="none" stroke-width="1.5" d="
                M 12.5 3
                c -2 2, -1.3 2.4, -1.5 6
                s -.8 3.8, -1.3 4.3
            "/>
            <path fill="none" stroke-width="1.2" stroke-linejoin="round" d="
                M 10.1 12.9
                l 1.4 1.4
                c -1 1, -3 1, -4 -.5
                m 4 .5
                c -1.8 2.3, -2.7 2.8, -5 .5
            "/>
            <line x1="12" x2="11" y1="16.5" y2="15.5" />

            <circle fill="currentColor" cx="12" cy="19.8" r=".6" />
            <line stroke-width="1.6" x1="12" x2="12" y1="19.8" y2="16" />
        </SvgIcon>
    );
}