import {Plugin, requestUrl, TFile} from "obsidian";
import {defaultSettings, JSPSettings, SharedItem} from "./settings";
import {JSPSettingsTab} from "./settings-tab";

export default class JustSharePleasePlugin extends Plugin {

    // TODO allow deleting uploads whose local files have been deleted (through command?)
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
                    // (newly) share a note
                    m.addItem(i => {
                        i.setTitle("Share to JSP");
                        i.setIcon("share");
                        i.onClick(async () => {
                            let response = await requestUrl({
                                url: `${this.settings.url}/share.php`,
                                method: "POST",
                                body: JSON.stringify({content: await this.app.vault.cachedRead(f)}),
                                throw: false
                            });

                            // TODO display message about status success/fail and copy URL to clipboard
                            console.log(response.status + " " + response.text);

                            if (response.status == 200) {
                                shared = response.json;
                                shared.path = f.path;
                                this.settings.shared.push(shared);
                                await this.saveSettings();
                            }
                        });
                    });
                } else {
                    // copy note link
                    m.addItem(i => {
                        i.setTitle("Copy JSP link");
                        i.setIcon("link");
                        // TODO let people know this happened
                        i.onClick(() => navigator.clipboard.writeText(`${this.settings.url}#${shared.id}`));
                    });

                    // update
                    m.addItem(i => {
                        i.setTitle("Update in JSP");
                        i.setIcon("share");
                        i.onClick(async () => {
                            let response = await requestUrl({
                                url: `${this.settings.url}/share.php?id=${shared.id}`,
                                method: "PATCH",
                                headers: {"Password": shared.password},
                                body: JSON.stringify({content: await this.app.vault.cachedRead(f)}),
                                throw: false
                            });

                            // TODO display message about status success/fail after updating
                            console.log(response.status + " " + response.text);
                        });
                    });

                    // delete
                    m.addItem(i => {
                        i.setTitle("Delete from JSP");
                        i.setIcon("trash");
                        i.onClick(async () => {
                            let response = await requestUrl({
                                url: `${this.settings.url}/share.php?id=${shared.id}`,
                                method: "DELETE",
                                headers: {"Password": shared.password},
                                throw: false
                            });

                            // TODO display message about status success/fail when deleting
                            console.log(response.status);

                            if (response.status == 200) {
                                this.settings.shared.remove(shared);
                                await this.saveSettings();
                            }
                        });
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
}
