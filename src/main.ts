import {arrayBufferToBase64, ButtonComponent, Notice, Plugin, requestUrl, TFile} from "obsidian";
import {defaultSettings, JSPSettings, SharedItem} from "./settings";
import {JSPSettingsTab} from "./settings-tab";
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
                let shared = this.getSharedItem(f.path);
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
        this.registerEvent(this.app.vault.on("rename", (f, p) => {
            if (f instanceof TFile) {
                let shared = this.getSharedItem(p);
                if (shared) {
                    shared.path = f.path;
                    this.refreshAllViews();
                }
            }
        }));
        this.registerEvent(this.app.vault.on("delete", f => {
            if (f instanceof TFile) {
                let shared = this.getSharedItem(f.path);
                if (shared) {
                    if (this.settings.unshareDeletedFiles) {
                        this.deleteFile(shared, false);
                    } else {
                        this.refreshAllViews();
                    }
                }
            }
        }));
        this.registerEvent(this.app.vault.on("modify", f => {
            if (this.settings.autoUpdateShares && f instanceof TFile) {
                let shared = this.getSharedItem(f.path);
                if (shared)
                    this.updateFile(shared, f, false);
            }
        }));

        this.addCommand({
            id: "share",
            name: "Share current file to JSP",
            editorCheckCallback: (checking, _, ctx) => {
                if (!this.getSharedItem(ctx.file.path)) {
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
                let shared = this.getSharedItem(ctx.file.path);
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
                let shared = this.getSharedItem(ctx.file.path);
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
                let shared = this.getSharedItem(ctx.file.path);
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

    getSharedItem(path: string): SharedItem {
        return this.settings.shared.find(f => f.path == path);
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

            this.settings.shared.push(shared);
            await this.saveSettings();
            this.refreshAllViews();

            await this.copyShareLink(shared, false);
            new Notice(`Successfully shared ${file.basename} and copied link to clipboard`);
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
            if (notice)
                new Notice(`Successfully updated ${file.basename} on JSP`);
            return true;
        } catch (e) {
            new Notice(createFragment(f => {
                f.createSpan({text: `There was an error updating ${file.basename}: `});
                f.createEl("code", {text: e});
            }), 10000);
            console.log(e);
        }

    }

    async deleteFile(item: SharedItem, notice = true): Promise<boolean> {
        let name = removeExtension(item.path);
        try {
            await requestUrl({
                url: `${this.settings.url}/share.php?id=${item.id}`,
                method: "DELETE",
                headers: {"Password": item.password}
            });

            await this.deleteLocalFileInfo(item);

            if (notice)
                new Notice(`Successfully deleted ${name} from JSP`);
            return true;
        } catch (e) {
            new Notice(createFragment(f => {
                f.createSpan({text: `There was an error deleting ${name}: `});
                f.createEl("code", {text: e});
                new ButtonComponent(f.createDiv({attr: {style: "padding-top: 1em;"}}))
                    .setButtonText("Force-delete local information")
                    .onClick(async _ => {
                        await this.deleteLocalFileInfo(item);
                        new Notice(`Successfully deleted local information for ${name}`);
                    })
            }), 10000);
            console.log(e);
            return false;
        }
    }

    async deleteLocalFileInfo(item: SharedItem): Promise<void> {
        this.settings.shared.remove(item);
        await this.saveSettings();
        this.refreshAllViews();
    }

    async copyShareLink(item: SharedItem, notice = true): Promise<void> {
        await navigator.clipboard.writeText(`${this.settings.url}#${item.id}`);
        if (notice)
            new Notice(`Copied link to ${removeExtension(item.path)} to clipboard`);
    }

    async preProcessMarkdown(file: TFile): Promise<string> {
        let text = await this.app.vault.cachedRead(file);

        // strip frontmatter
        let frontmatter = /^(---\s*\n.*?\n---)\s*\n(.*)$/s;
        if (this.settings.stripFrontmatter)
            text = text.replace(frontmatter, "$2");

        // strip comments
        text = text.replace(/%%.*?%%/sg, "");

        // include note name (after frontmatter!)
        if (this.settings.includeNoteName) {
            let title = `# ${file.basename}\n\n`;
            if (frontmatter.test(text)) {
                text = text.replace(frontmatter, `$1\n\n${title}$2`);
            } else {
                text = title + text;
            }
        }

        // embed attachments directly
        let attachments = /!\[(.*)]\((.+)\)|!\[\[(.+)]]/g;
        let match: RegExpExecArray;
        while ((match = attachments.exec(text)) != null) {
            let alt = match[1] ?? "";
            let url = decodeURI(match[2] ?? match[3]);
            if (url.startsWith("http"))
                continue;
            try {
                let resolved = this.app.metadataCache.getFirstLinkpathDest(url, file.path).path;
                let attachment = this.app.vault.getAbstractFileByPath(resolved);
                let data = arrayBufferToBase64(await this.app.vault.readBinary(attachment as TFile));
                let img = `<img src="data:image/${resolved.split(".").pop()};base64, ${data}" alt="${alt}">`;
                text = text.substring(0, match.index) + img + text.substring(match.index + match[0].length);
            } catch (e) {
                console.log(`Error embedding attachment ${url}: ${e}`);
            }
        }

        return text;
    }

    refreshAllViews(): void {
        for (let leaf of this.app.workspace.getLeavesOfType(JSPView.type)) {
            if (leaf.view instanceof JSPView)
                leaf.view.refresh();
        }
    }

}

export function removeExtension(file: string): string {
    let split = file.split(".");
    split.pop();
    return split.join(".");
}
