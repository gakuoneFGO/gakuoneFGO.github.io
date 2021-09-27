import { createTheme } from "@material-ui/core";
import { blue, green, grey, purple, red, yellow } from "@material-ui/core/colors";
declare module '@material-ui/core/styles/createPalette' {
    interface PaletteOptions {
        buster?: PaletteColorOptions;
        arts?: PaletteColorOptions;
        quick?: PaletteColorOptions;
    }

    interface Palette {
        buster: PaletteColor;
        arts: PaletteColor;
        quick: PaletteColor;
    }
}

const theme = createTheme({
    palette: {
        primary: {
            main: yellow[500],
        },
        secondary: {
            main: purple[500],
        },
        background: {
            default: "#000000",
            paper: "#101010",
        },
        text: {
            primary: grey[400],
            secondary: grey[100],
        },
        buster: {
            main: red[900],
        },
        arts: {
            main: blue[900],
        },
        quick: {
            main: green[900],
        },
    },
});

export { theme }