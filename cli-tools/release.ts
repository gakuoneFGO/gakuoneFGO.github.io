import { Version, versionFormat } from "../src/versioning";
import * as readline from "readline";
import * as fs from "fs";

const releaseType = process.argv[2];
if (!versionFormat.some(key => key == releaseType)) {
    console.log(`Usage: release [ ${versionFormat.join(" | ")} ]`);
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getMoreChanges(changes: string[], onNone: (changes: string[]) => void) {
    return (change: string) =>
        change ?
            rl.question("Enter another change, or hit enter alone to finish: ", getMoreChanges([...changes, change], saveVersion)) :
            onNone(changes);
}

function requireOneChange(): (changes: string[]) => void {
    return () => rl.question("Enter at least one change: ", getMoreChanges([], requireOneChange()));
}

rl.question("Enter the first change to appear in the release notes: ", getMoreChanges([], requireOneChange()));

async function saveVersion(changes: string[]) {
    const versions: Version[] = JSON.parse(await fs.promises.readFile("src\\version-history.json", "utf-8"));
    const prevVersion = versions[versions.length - 1];
    const incIndex = versionFormat.findIndex(key => key == releaseType);

    const newVersion = {
        ...Object.fromEntries(versionFormat.map((key, index) => [ key,
            index < incIndex ? prevVersion[key] :
            index > incIndex ? 0 :
            prevVersion[key] as number + 1
        ])),
        releaseDate: new Date().toISOString().substring(0, 10),
        changes: changes
    } as Version;

    fs.promises.writeFile("src\\version-history.json", JSON.stringify(versions.concat(newVersion), undefined, 4), "utf-8").then(() => process.exit(0));
}