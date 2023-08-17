export const defaultSettings: JSPSettings = {
    url: "https://jsp.ellpeck.de",
    shared: [],
    stripFrontmatter: true,
    includeNoteName: true,
    unshareDeletedFiles: true
};

// TODO add a setting for auto-refreshing uploads when saving
export interface JSPSettings {

    url: string;
    shared: SharedItem[];
    stripFrontmatter: boolean;
    includeNoteName: boolean;
    unshareDeletedFiles: boolean;

}

export interface SharedItem {

    id: string;
    password: string;
    path: string;

}
