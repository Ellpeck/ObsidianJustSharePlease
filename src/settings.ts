export const defaultSettings: JSPSettings = {
    url: "https://jsp.ellpeck.de",
    shared: [],
    stripFrontmatter: true,
    includeNoteName: true,
    unshareDeletedFiles: true,
    autoUpdateShares: false
};

export interface JSPSettings {

    url: string;
    shared: SharedItem[];
    stripFrontmatter: boolean;
    includeNoteName: boolean;
    unshareDeletedFiles: boolean;
    autoUpdateShares: boolean;

}

export interface SharedItem {

    id: string;
    password: string;
    path: string;

}
