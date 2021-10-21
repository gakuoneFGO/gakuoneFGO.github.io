import { Box, ImageList, ImageListItem } from "@mui/material";
import React, { ReactNode, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Servant, ServantData } from "../Servant";

interface PartyDisplayProps {
    party: Servant[];
    onDrop: (sourceSlot: number, targetSlot: number) => void;
    onClick: (slot: number) => void;
}

export const PartyDisplay = React.memo(function (props: PartyDisplayProps) {
    return (
        <DndProvider backend={HTML5Backend}>
            <ImageList cols={6}>
                {props.party.map((servant, slot) => <PartyMember key={slot + servant.data.name} servant={servant.data} slot={slot} onDrop={props.onDrop} onClick={props.onClick} />)}
            </ImageList>
        </DndProvider>
    );
});

interface PartyMemberProps {
    servant: ServantData;
    slot: number;
    onDrop: (sourceSlot: number, targetSlot: number) => void;
    onClick: (slot: number) => void;
};

type ItemProps = { slot: number, servant: ServantData };

const PartyMember = React.memo(function(props: PartyMemberProps) {
    const [, drag] = useDrag(() => ({
        type: "partyMember",
        accept: "partyMember",
        item: { slot: props.slot, servant: props.servant } as ItemProps,
        end: (dragged, monitor) => {
            const target = monitor.getDropResult<{slot: number}>();
            if (dragged && target) {
                props.onDrop(dragged.slot, target.slot);
            }
        }
    }), []);

    const [, drop] = useDrop(() => ({
        accept: "partyMember",
        canDrop: props.slot <= 2 ?
            (item: ItemProps) => item.servant.isSpecified() :
            (item: ItemProps) => item.slot > 2 || props.servant.isSpecified(),
        drop: () => ({ slot: props.slot }),
    }), []);

    const ref = useRef<HTMLLIElement>(null)
    drag(drop(ref));

    return (
        <ImageListItem cols={1} ref={ref}>
            <img alt={props.servant.name} src={props.servant.iconUrl} onClick={useCallback(() => props.onClick(props.slot), [props.slot, props.onClick])} />
        </ImageListItem>
    );
});