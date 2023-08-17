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
        new Setting(this.containerEl)
            .setName("Just Share Please Server")
            .setDesc(createFragment(f => {
                f.createSpan({text: "URL for the Just Share Please server to upload to and share links for. Defaults to the official site "});
                f.createEl("a", {text: "jsp.ellpeck.de", href: defaultSettings.url});
                f.createSpan({text: ". For more info on self-hosting, see "});
                f.createEl("a", {text: "the official site", href: "https://jsp.ellpeck.de/#-self-hosting"});
                f.createSpan({text: "."});
            }))
            .addText(t => {
                t.setValue(String(this.plugin.settings.url));
                t.onChange(async v => {
                    this.plugin.settings.url = v || defaultSettings.url;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(this.containerEl)
            .setName("Strip Frontmatter")
            .setDesc("Whether document frontmatter (also known as properties) should be removed from the uploaded share.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.stripFrontmatter);
                t.onChange(async v => {
                    this.plugin.settings.stripFrontmatter = v;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(this.containerEl)
            .setName("Include Note Name")
            .setDesc("Whether the name of the shared note should be included in the share as a heading.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.includeNoteName);
                t.onChange(async v => {
                    this.plugin.settings.includeNoteName = v;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(this.containerEl)
            .setName("Unshare Deleted Files")
            .setDesc("Whether shares of files should be removed automatically when they are deleted. Only supported when deleting from within Obsidian.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.unshareDeletedFiles);
                t.onChange(async v => {
                    this.plugin.settings.unshareDeletedFiles = v;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(this.containerEl)
            .setName("Automatically Update Shares")
            .setDesc("Whether a file's share should automatically be updated when the file is changed from within Obsidian.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.autoUpdateShares);
                t.onChange(async v => {
                    this.plugin.settings.autoUpdateShares = v;
                    await this.plugin.saveSettings();
                });
            });

        this.containerEl.createEl("hr");
        this.containerEl.createEl("p", {text: "If you like this plugin and want to support its development, you can do so through my website by clicking this fancy image!"});
        this.containerEl.createEl("a", {href: "https://ellpeck.de/support"})
            .createEl("img", {
                attr: {src: "https://ellpeck.de/res/generalsupport.png"},
                cls: "just-share-please-support"
            });
    }
}
