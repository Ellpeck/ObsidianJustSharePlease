import {Plugin} from "obsidian";
import {defaultSettings, JSPSettings} from "./settings";
import {JSPSettingsTab} from "./settings-tab";

export default class JustSharePleasePlugin extends Plugin {

    // TODO when uploading, store server-returned Guid and deletion password of each file in plugin settings
    // TODO when deleting, also allow deleting uploads whose local files have been deleted by querying the settings!
    // TODO add a setting for auto-refreshing uploads when saving
    // TODO strip frontmatter before uploading? maybe optionally
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
