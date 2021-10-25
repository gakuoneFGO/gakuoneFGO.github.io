export interface Version {
    major: number;
    minor: number;
    patch: number;
    miniPatch: number;
    releaseDate: string;
    changes: string[];
}

export const versionFormat: (keyof Version)[] = [ "major", "minor", "patch", "miniPatch" ];
export const getVersionNumber = (version: Version) => versionFormat.map(key => version[key]).join(".");

export const changeLog: Version[] = await fetch("version-history.json", { cache: "no-store" }).then(resp => resp.text()).then(text => JSON.parse(text));
export const appVersion = getVersionNumber(changeLog[changeLog.length - 1]);