export const defaultSettings: JSPSettings = {
    url: "http://localhost:8080",
    shared: []
};

export interface JSPSettings {

    url: string;
    shared: SharedItem[];

}

export interface SharedItem {

    id: string;
    password: string;
    path: string;

}
