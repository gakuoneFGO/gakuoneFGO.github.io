import { createTheme } from "@mui/material";
import { blue, green, grey, orange, purple, red, yellow } from "@mui/material/colors";
declare module '@mui/material/styles/createPalette' {
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
        mode: "dark",
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