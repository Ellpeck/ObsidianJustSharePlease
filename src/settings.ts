export const defaultSettings: JSPSettings = {
    url: "https://jsp.ellpeck.de",
    shared: [],
    stripFrontmatter: true
};

// TODO add a setting for auto-refreshing uploads when saving
// TODO add a setting for auto-removing JSP shares when the original file is deleted
export interface JSPSettings {

    url: string;
    shared: SharedItem[];
    stripFrontmatter: boolean;

}

export interface SharedItem {

    id: string;
    password: string;
    // TODO auto-update path when file is moved
    path: string;

}
