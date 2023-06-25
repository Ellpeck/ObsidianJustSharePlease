import {Plugin} from "obsidian";
import {defaultSettings, JSPSettings} from "./settings";
import {JSPSettingsTab} from "./settings-tab";

export default class JustSharePleasePlugin extends Plugin {

    settings: JSPSettings;

    async onload(): Promise<void> {
        await this.loadSettings();
        this.addSettingTab(new JSPSettingsTab(this.app, this));
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, defaultSettings, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
