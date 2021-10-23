import { useEffect, useState } from "react";

const isPressed: any = {};
let hotkeys: {keys: string[], action: (e: KeyboardEvent) => void}[] = [];

//no need to limit scope for now
window.addEventListener("keydown", e => {
    isPressed[e.key] = true;
    hotkeys.filter(({keys}) => !keys.some(key => !isPressed[key])).forEach(({action}) => action(e));
}, false);

window.addEventListener("keyup", e => isPressed[e.key] = undefined, false);

export function useHotkey(hotkey: {keys: string[], action: (e: KeyboardEvent) => void}) {
    useEffect(() => {
        hotkeys.push(hotkey);
        return () => {hotkeys = hotkeys.filter(h => h != hotkey)};
    });
}

export type ActionStack<T> = { prev: T, next: T }[];

export type Tracked<T> = {
    state: T;
    prev: ActionStack<T>;
    next: ActionStack<T>;
}

export class Tracker<T> {
    constructor(
        readonly tracked: Tracked<T>,
        readonly setState: (update: (s: Tracked<T>) => Tracked<T>) => void
    ) {};

    handleChange(change: (state: T) => T, skipTracking?: boolean) {
        this.setState(tracked => {
            const newState = change(tracked.state);
            if (!skipTracking) {
                tracked.prev.push({ prev: tracked.state, next: newState });
                if (tracked.prev.length > 600) tracked.prev = tracked.prev.slice(100);
                tracked.next = [];
            }
            return { ...tracked, state: newState };
        });
    }

    undo() {
        this.replay("prev");
    }

    redo() {
        this.replay("next");
    }

    private replay(direction: "prev" | "next") {
        const reverse = direction == "prev" ? "next" : "prev";
        //ideally we don't mutate but these arrays can get long
        const popped = this.tracked[direction].pop();
        if (!popped) return;
        this.tracked[reverse].push(popped);
        this.setState(() => ({ ...this.tracked, state: popped[direction] }));
    }
}

export function useTracker<T>(init: () => T): Tracker<T> {
    const initTracked = () => ({
        state: init(),
        prev: [],
        next: []
    } as Tracked<T>);
    const tracker = new Tracker(...useState(initTracked));

    useHotkey({
        keys: ["Control", "z"],
        action: e => {
            tracker.undo();
            e.preventDefault();
        }}
    );

    useHotkey({
        keys: ["Control", "y"],
        action: e => {
            tracker.redo();
            e.preventDefault();
        }}
    );

    return tracker;
}