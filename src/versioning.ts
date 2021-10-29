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