import { createTheme, Paper } from "@mui/material";
import { blue, blueGrey, green, grey, red, yellow } from "@mui/material/colors";
declare module '@mui/material/styles/createPalette' {
    interface PaletteOptions {
        buster?: PaletteColorOptions;
        arts?: PaletteColorOptions;
        quick?: PaletteColorOptions;
        refund?: PaletteColorOptions;
    }

    interface SimplePaletteColorOptions {
        gradient?: string;
    }

    interface Palette {
        buster: PaletteColor;
        arts: PaletteColor;
        quick: PaletteColor;
        refund: PaletteColor;
    }

    interface PaletteColor {
        gradient?: string;
    }
}

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: yellow[900]
        },
        secondary: {
            main: blueGrey[900]
        },
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
        refund: {
            light: "#d27b17",
            main: "#9f5a0d",
            dark: "#bf6c0c",
            gradient: "linear-gradient(to bottom, #452916, #d27b17 43%, #382514)",
            //gradient: "linear-gradient(to bottom, #83400e, #d27b17 43%, #69380e)",
        }
    },
    components: {
        MuiTextField: {
            defaultProps: {
                variant: "standard",
                fullWidth: true,
                onFocus: e => e.target.select()
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
                PaperComponent: props => <Paper {...props} sx={{ backgroundColor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText}} />
            }
        },
        //deprecated, but MUI's docs don't provide another mechanism to set this at the theme level (https://mui.com/customization/how-to-customize/#5-global-css-override)
        MuiCssBaseline: {
            styleOverrides: {
                "*::-webkit-scrollbar": {
                    width: ".75em",
                    height: ".75em",
                },
                "*::-webkit-scrollbar-track": {
                    backgroundColor: "#121212",
                    width: ".5em",
                    height: ".5em",
                    outline: "0px",
                },
                "*::-webkit-scrollbar-thumb": {
                    backgroundColor: grey[900],
                },
                "*::-webkit-scrollbar-thumb:focus": {
                    backgroundColor: grey[800],
                },
                "*::-webkit-scrollbar-thumb:active": {
                    backgroundColor: grey[800],
                },
                "*::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: grey[800],
                },
            },
        },
    },
});

export { theme }