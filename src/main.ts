import {arrayBufferToBase64, Notice, Plugin, requestUrl, TFile} from "obsidian";
import {defaultSettings, JSPSettings, SharedItem} from "./settings";
import {JSPSettingsTab} from "./settings-tab";
import {basename, extname} from "path";
import {JSPView} from "./view";

export default class JustSharePleasePlugin extends Plugin {

    public settings: JSPSettings;

    async onload(): Promise<void> {
        await this.loadSettings();
        this.addSettingTab(new JSPSettingsTab(this.app, this));

        this.registerView(JSPView.type, l => new JSPView(this, l));
        this.addCommand({
            id: `open-${JSPView.type}`,
            name: `Open Just Share Please view`,
            callback: async () => {
                if (!this.app.workspace.getLeavesOfType(JSPView.type).length)
                    await this.app.workspace.getRightLeaf(false).setViewState({type: JSPView.type, active: true});
                this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(JSPView.type)[0]);
            }
        });

        this.registerEvent(this.app.workspace.on("file-menu", async (m, f) => {
            if (f instanceof TFile && f.extension == "md") {
                let shared = this.getSharedItem(f);
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
                if (!this.getSharedItem(ctx.file)) {
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
                let shared = this.getSharedItem(ctx.file);
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
                let shared = this.getSharedItem(ctx.file);
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
                let shared = this.getSharedItem(ctx.file);
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

    getSharedItem(file: TFile): SharedItem {
        return this.settings.shared.find(f => f.path == file.path);
    }

    async shareFile(file: TFile): Promise<SharedItem> {
        try {
            let response = await requestUrl({
                url: `${this.settings.url}/share.php`,
                method: "POST",
                body: JSON.stringify({content: await this.preProcessMarkdown(file)})
            });
            let shared = response.json as SharedItem;
            shared.path = file.path;

            await this.copyShareLink(shared, false);
            new Notice(`Successfully shared ${file.basename} and copied link to clipboard`);

            this.settings.shared.push(shared);
            await this.saveSettings();
            this.refreshAllViews();

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
                body: JSON.stringify({content: await this.preProcessMarkdown(file)})
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
            this.refreshAllViews();

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

    async preProcessMarkdown(file: TFile): Promise<string> {
        let text = await this.app.vault.cachedRead(file);

        // strip frontmatter
        if (this.settings.stripFrontmatter)
            text = text.replace(/^---\s*\n.*?\n---\s*\n(.*)$/s, "$1");

        // embed attachments directly
        let attachments = /!\[(.*)]\((.+)\)|!\[\[(.+)]]/g;
        let match: RegExpExecArray;
        while ((match = attachments.exec(text)) != null) {
            let alt = match[1] ?? "";
            let url = match[2] ?? match[3];
            if (url.startsWith("http"))
                continue;
            try {
                let resolved = this.app.metadataCache.getFirstLinkpathDest(url, file.path).path;
                let attachment = this.app.vault.getAbstractFileByPath(resolved);
                let data = arrayBufferToBase64(await this.app.vault.readBinary(attachment as TFile));
                let img = `<img src="data:image/${extname(resolved).substring(1)};base64, ${data}" alt="${alt}">`;
                text = text.substring(0, match.index) + img + text.substring(match.index + match[0].length);
            } catch (e) {
                console.log(`Error embedding attachment ${url}: ${e}`);
            }
        }

        return text;
    }

    // TODO refresh when a file is moved or deleted in Obsidian
    refreshAllViews(): void {
        for (let leaf of this.app.workspace.getLeavesOfType(JSPView.type)) {
            if (leaf.view instanceof JSPView)
                leaf.view.refresh();
        }
    }
}
