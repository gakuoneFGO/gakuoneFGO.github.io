import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import * as ReactDOM from "react-dom";
import "reflect-metadata";
import { About } from "./components/about";
import { StratBuilder } from "./components/strat-builder";
import { theme } from "./components/style";

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <DndProvider backend={HTML5Backend}>
            <StratBuilder />
            <About />
        </DndProvider>
    </ThemeProvider>,
    document.getElementById("main")
);