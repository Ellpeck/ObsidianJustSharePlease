import {Plugin, requestUrl, TFile} from "obsidian";
import {defaultSettings, JSPSettings, SharedItem} from "./settings";
import {JSPSettingsTab} from "./settings-tab";

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
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, defaultSettings, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    async shareFile(file: TFile): Promise<SharedItem> {
        let response = await requestUrl({
            url: `${this.settings.url}/share.php`,
            method: "POST",
            body: JSON.stringify({content: await this.app.vault.cachedRead(file)}),
            throw: false
        });

        // TODO display message about status success/fail and copy URL to clipboard
        console.log(response.status + " " + response.text);

        if (response.status == 200) {
            let shared = response.json as SharedItem;
            shared.path = file.path;
            this.settings.shared.push(shared);
            await this.saveSettings();
            return shared;
        }
    }

    async updateFile(item: SharedItem, file: TFile): Promise<boolean> {
        let response = await requestUrl({
            url: `${this.settings.url}/share.php?id=${item.id}`,
            method: "PATCH",
            headers: {"Password": item.password},
            body: JSON.stringify({content: await this.app.vault.cachedRead(file)}),
            throw: false
        });

        // TODO display message about status success/fail after updating
        console.log(response.status + " " + response.text);
        return response.status == 200;
    }

    async deleteFile(item: SharedItem): Promise<boolean> {
        let response = await requestUrl({
            url: `${this.settings.url}/share.php?id=${item.id}`,
            method: "DELETE",
            headers: {"Password": item.password},
            throw: false
        });

        // TODO display message about status success/fail when deleting
        console.log(response.status);

        if (response.status == 200) {
            this.settings.shared.remove(item);
            await this.saveSettings();
            return true;
        }
    }

    async copyShareLink(item: SharedItem) {
        // TODO let people know this happened
        await navigator.clipboard.writeText(`${this.settings.url}#${item.id}`);
    }
}
