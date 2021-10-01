import { Box, ImageList, ImageListItem } from "@mui/material";
import React, { ReactNode, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Servant, ServantData } from "../Servant";

interface PartyDisplayProps {
    party: Servant[];
    onDrop: (sourceSlot: number, targetSlot: number) => void;
    onClick: (slot: number) => void;
}

function PartyDisplay(props: PartyDisplayProps) {
    return (
        <DndProvider backend={HTML5Backend}>
            <ImageList cols={6}>
                {props.party.map((servant, slot) => <PartyMember key={slot} servant={servant.data} slot={slot} onDrop={props.onDrop} onClick={props.onClick} />)}
            </ImageList>
        </DndProvider>
    );
}

interface PartyMemberProps {
    servant: ServantData;
    slot: number;
    onDrop: (sourceSlot: number, targetSlot: number) => void;
    onClick: (slot: number) => void;
};

function PartyMember(props: PartyMemberProps) {
    const [, drag] = useDrag(() => ({
        type: "partyMember",
        accept: "partyMember",
        item: { slot: props.slot },
        end: (dragged, monitor) => {
            const target = monitor.getDropResult<{slot: number}>();
            if (dragged && target) {
                props.onDrop(dragged.slot, target.slot);
            }
        }
    }), []);

    const [, drop] = useDrop(() => ({
        accept: "partyMember",
        drop: () => ({ slot: props.slot }),
    }), []);

    const ref = useRef<HTMLLIElement>(null)
    drag(drop(ref));

    return (
        <ImageListItem cols={1} ref={ref}>
            <img alt={props.servant.name} src={props.servant.iconUrl} onClick={() => props.onClick(props.slot)} />
        </ImageListItem>
    );
}

export { PartyDisplay }