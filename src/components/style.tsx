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
        info: {
            main: green[500]
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
    typography: {
        body2: {
            //TODO: this is about the smallest font size that's comfortable to read but it still causes the scroll bar to render on the output grid
            //next thing to try is to swap servant cards for icons and then transpose the output table, although having it mismatch with the advanced table is weird
            fontSize: 13,
        }
    },
    components: {
        MuiTextField: {
            defaultProps: {
                variant: "standard",
                fullWidth: true,
            }
        },
        MuiInputLabel: {
            defaultProps: {
                shrink: true,
            }
        },
        MuiAutocomplete: {
            defaultProps: {
                disableClearable: true,
            }
        },
        //deprecated, but MUI's docs don't provide another mechanism to set this at the theme level (https://mui.com/customization/how-to-customize/#5-global-css-override)
        MuiCssBaseline: {
            styleOverrides: `
                *::-webkit-scrollbar {
                    width: .75em;
                    height: .75em;
                }
                
                *::-webkit-scrollbar-track {
                    background-color: #121212;
                    width: .5em;
                    height: .5em;
                    outline: 0px;
                }
                
                *::-webkit-scrollbar-thumb {
                    background-color: #212121;
                }
            `,
        },
    },
});

export { theme }