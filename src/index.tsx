import { CssBaseline, ThemeProvider } from "@material-ui/core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "reflect-metadata";
import { StratBuilder } from "./components/strat-builder";
import { theme } from "./components/style";

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <StratBuilder />
    </ThemeProvider>,
    document.getElementById("main")
);