export const defaultSettings: JSPSettings = {
    url: "http://localhost:8080",
    shared: [],
    stripFrontmatter: true
};

export interface JSPSettings {

    url: string;
    shared: SharedItem[];
    stripFrontmatter: boolean;

}

export interface SharedItem {

    id: string;
    password: string;
    path: string;

}
