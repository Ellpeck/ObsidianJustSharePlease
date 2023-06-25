import {App, PluginSettingTab, Setting} from "obsidian";
import {defaultSettings} from "./settings";
import JustSharePleasePlugin from "./main";

export class JSPSettingsTab extends PluginSettingTab {

    plugin: JustSharePleasePlugin;

    constructor(app: App, plugin: JustSharePleasePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h2", {text: "Just Share Please Settings"});
        
        // TODO settings

        this.containerEl.createEl("hr");
        this.containerEl.createEl("p", {text: "If you like this plugin and want to support its development, you can do so through my website by clicking this fancy image!"});
        this.containerEl.createEl("a", {href: "https://ellpeck.de/support"})
            .createEl("img", {
                attr: {src: "https://ellpeck.de/res/generalsupport.png"},
                cls: "just-share-please-support"
            });
    }
}
