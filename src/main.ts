import {Notice, Plugin, requestUrl, TFile} from "obsidian";
import {defaultSettings, JSPSettings, SharedItem} from "./settings";
import {JSPSettingsTab} from "./settings-tab";
import {basename, extname} from "path";

export default class JustSharePleasePlugin extends Plugin {

    // TODO panel that displays all shares, including ones for removed files, and allows unsharing or updating them
    // TODO add a setting for auto-refreshing uploads when saving
    // TODO strip frontmatter before uploading? maybe optionally
    settings: JSPSettings;

    async onload(): Promise<void> {
        await this.loadSettings();
        this.addSettingTab(new JSPSettingsTab(this.app, this));

        this.registerEvent(this.app.workspace.on("file-menu", async (m, f) => {
            if (f instanceof TFile) {
                let shared = this.settings.shared.find(i => i.path == f.path);
                if (!shared) {
                    m.addItem(i => {
                        i.setTitle("Share to JSP");
                        i.setIcon("share");
                        i.onClick(async () => this.shareFile(f));
                    });
                } else {
                    m.addItem(i => {
                        i.setTitle("Copy JSP link");
                        i.setIcon("link");
                        i.onClick(() => this.copyShareLink(shared));
                    });
                    m.addItem(i => {
                        i.setTitle("Update in JSP");
                        i.setIcon("share");
                        i.onClick(() => this.updateFile(shared, f));
                    });
                    m.addItem(i => {
                        i.setTitle("Delete from JSP");
                        i.setIcon("trash");
                        i.onClick(async () => this.deleteFile(shared));
                    });
                }
            }
        }));

        this.addCommand({
            id: "share",
            name: "Share current file to JSP",
            editorCheckCallback: (checking, _, ctx) => {
                if (!this.settings.shared.find(i => i.path == ctx.file.path)) {
                    if (!checking)
                        this.shareFile(ctx.file);
                    return true;
                }
                return false;
            }
        });
        this.addCommand({
            id: "copy",
            name: "Copy current file's JSP link",
            editorCheckCallback: (checking, _, ctx) => {
                let shared = this.settings.shared.find(i => i.path == ctx.file.path);
                if (shared) {
                    if (!checking)
                        this.copyShareLink(shared);
                    return true;
                }
                return false;
            }
        });
        this.addCommand({
            id: "update",
            name: "Update current file in JSP",
            editorCheckCallback: (checking, _, ctx) => {
                let shared = this.settings.shared.find(i => i.path == ctx.file.path);
                if (shared) {
                    if (!checking)
                        this.updateFile(shared, ctx.file);
                    return true;
                }
                return false;
            }
        });
        this.addCommand({
            id: "delete",
            name: "Delete current file from JSP",
            editorCheckCallback: (checking, _, ctx) => {
                let shared = this.settings.shared.find(i => i.path == ctx.file.path);
                if (shared) {
                    if (!checking)
                        this.deleteFile(shared);
                    return true;
                }
                return false;
            }
        });
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, defaultSettings, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    async shareFile(file: TFile): Promise<SharedItem> {
        try {
            let response = await requestUrl({
                url: `${this.settings.url}/share.php`,
                method: "POST",
                body: JSON.stringify({content: await this.app.vault.cachedRead(file)})
            });
            let shared = response.json as SharedItem;
            shared.path = file.path;

            await this.copyShareLink(shared, false);
            new Notice(`Successfully shared ${file.basename} and copied link to clipboard`);

            this.settings.shared.push(shared);
            await this.saveSettings();

            return shared;
        } catch (e) {
            new Notice(createFragment(f => {
                f.createSpan({text: `There was an error sharing ${file.basename}: `});
                f.createEl("code", {text: e});
            }), 10000);
            console.log(e);
        }
    }

    async updateFile(item: SharedItem, file: TFile, notice = true): Promise<boolean> {
        try {
            await requestUrl({
                url: `${this.settings.url}/share.php?id=${item.id}`,
                method: "PATCH",
                headers: {"Password": item.password},
                body: JSON.stringify({content: await this.app.vault.cachedRead(file)})
            });
            new Notice(`Successfully updated ${file.basename} on JSP`);
            return true;
        } catch (e) {
            if (notice) {
                new Notice(createFragment(f => {
                    f.createSpan({text: `There was an error updating ${file.basename}: `});
                    f.createEl("code", {text: e});
                }), 10000);
            }
            console.log(e);
        }

    }

    async deleteFile(item: SharedItem): Promise<boolean> {
        let name = basename(item.path, extname(item.path));
        try {
            await requestUrl({
                url: `${this.settings.url}/share.php?id=${item.id}`,
                method: "DELETE",
                headers: {"Password": item.password}
            });
            new Notice(`Successfully deleted ${name} from JSP`);

            this.settings.shared.remove(item);
            await this.saveSettings();

            return true;
        } catch (e) {
            new Notice(createFragment(f => {
                f.createSpan({text: `There was an error deleting ${name}: `});
                f.createEl("code", {text: e});
            }), 10000);
            console.log(e);
        }
    }

    async copyShareLink(item: SharedItem, notice = true): Promise<void> {
        await navigator.clipboard.writeText(`${this.settings.url}#${item.id}`);
        if (notice)
            new Notice(`Copied link to ${basename(item.path, extname(item.path))} to clipboard`);
    }
}
