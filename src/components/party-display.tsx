import { ImageList, ImageListItem } from "@mui/material";
import React from "react";
import { Servant } from "../Servant";

interface PartyDisplayProps {
    party: Servant[];
}

class PartyDisplay extends React.Component<PartyDisplayProps, any, any> {
    render() {
        return (
            <ImageList cols={6}>
                {this.props.party.map((servant, index) =>
                    <ImageListItem key={index} cols={1}>
                        <img alt={servant.data.name} src={servant.data.cardArtUrl} />
                    </ImageListItem>
                )}
            </ImageList>
        );
    }
}

export { PartyDisplay }