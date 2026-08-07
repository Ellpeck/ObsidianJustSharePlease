import {App, PluginSettingTab, SettingGroup} from "obsidian";
import {defaultSettings} from "./settings";
import JustSharePleasePlugin from "./main";

export class JSPSettingsTab extends PluginSettingTab {

    plugin: JustSharePleasePlugin;

    constructor(app: App, plugin: JustSharePleasePlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.icon = "share";
    }

    display(): void {
        this.containerEl.empty();
        let group = new SettingGroup(this.containerEl);
        group.addSetting(s => void s
            .setName("Just Share Please server")
            .setDesc(createFragment(f => {
                f.createSpan({ text: "URL for the Just Share Please server to upload to and share links for. Defaults to the official site " });
                f.createEl("a", { text: "jsp.ellpeck.de", href: defaultSettings.url });
                f.createSpan({ text: ". For more info on self-hosting, see " });
                // eslint-disable-next-line obsidianmd/ui/sentence-case -- partial line
                f.createEl("a", { text: "the official site", href: "https://jsp.ellpeck.de/#-self-hosting" });
                f.createSpan({ text: "." });
            }))
            .addText(t => {
                void t.setValue(String(this.plugin.settings.url));
                void t.onChange(async v => {
                    this.plugin.settings.url = v || defaultSettings.url;
                    await this.plugin.saveSettings();
                });
            }));
        group.addSetting(s => void s
            .setName("Include file properties")
            .setDesc("Whether the file properties of the shared note should be included in the share as visible frontmatter.")
            .addToggle(t => {
                void t.setValue(!this.plugin.settings.stripFrontmatter);
                void t.onChange(async v => {
                    this.plugin.settings.stripFrontmatter = !v;
                    await this.plugin.saveSettings();
                });
            }));
        group.addSetting(s => void s
            .setName("Include note name")
            .setDesc("Whether the name of the shared note should be included in the share as a heading.")
            .addToggle(t => {
                void t.setValue(this.plugin.settings.includeNoteName);
                void t.onChange(async v => {
                    this.plugin.settings.includeNoteName = v;
                    await this.plugin.saveSettings();
                });
            }));
        group.addSetting(s => void s
            .setName("Unshare deleted files")
            .setDesc("Whether shares of files should be removed automatically when they are deleted. Only supported when deleting from within Obsidian.")
            .addToggle(t => {
                void t.setValue(this.plugin.settings.unshareDeletedFiles);
                void t.onChange(async v => {
                    this.plugin.settings.unshareDeletedFiles = v;
                    await this.plugin.saveSettings();
                });
            }));
        group.addSetting(s => void s
            .setName("Automatically update shares")
            .setDesc("Whether a file's share should automatically be updated when the file is changed from within Obsidian.")
            .addToggle(t => {
                void t.setValue(this.plugin.settings.autoUpdateShares);
                void t.onChange(async v => {
                    this.plugin.settings.autoUpdateShares = v;
                    await this.plugin.saveSettings();
                });
            }));

        this.containerEl.createEl("hr");
        this.containerEl.createEl("p", { text: "If you like this plugin and want to support its development, you can do so through my website by clicking this fancy image!" });
        this.containerEl.createEl("a", { href: "https://ellpeck.de/support" })
            .createEl("img", {
                attr: { src: "https://ellpeck.de/res/generalsupport.png" },
                cls: "just-share-please-support"
            });
    }
}
