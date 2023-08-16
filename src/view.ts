import {ButtonComponent, ItemView, TFile, WorkspaceLeaf} from "obsidian";
import {basename, extname} from "path";
import JustSharePleasePlugin from "./main";

export class JSPView extends ItemView {

    public static readonly type: string = "jsp-view";

    private readonly plugin: JustSharePleasePlugin;

    constructor(plugin: JustSharePleasePlugin, leaf: WorkspaceLeaf) {
        super(leaf);
        this.plugin = plugin;
    }

    public refresh(): void {
        this.contentEl.empty();
        let content = this.contentEl.createDiv({cls: "just-share-please-view"});
        for (let shared of this.plugin.settings.shared) {
            let file = this.plugin.app.vault.getAbstractFileByPath(shared.path) as TFile;
            let div = content.createDiv({cls: "just-share-please-shared-item"});
            div.createSpan({cls: "just-share-please-shared-name", text: basename(shared.path, extname(shared.path))});
            new ButtonComponent(div)
                .setClass("clickable-icon")
                .setTooltip("Copy JSP link")
                .setIcon("link")
                .onClick(async () => this.plugin.copyShareLink(shared));
            if (file) {
                new ButtonComponent(div)
                    .setClass("clickable-icon")
                    .setTooltip("Open in Obsidian")
                    .setIcon("edit")
                    .onClick(async () => {
                        // TODO open in obsidian
                    });
                new ButtonComponent(div)
                    .setClass("clickable-icon")
                    .setTooltip("Update in JSP")
                    .setIcon("share")
                    .onClick(async () => this.plugin.updateFile(shared, file));
            }
            new ButtonComponent(div)
                .setClass("clickable-icon")
                .setTooltip("Delete from JSP")
                .setIcon("trash")
                .onClick(async () => this.plugin.deleteFile(shared));
        }
    }

    public onload(): void {
        this.refresh();
    }

    public getDisplayText(): string {
        return "Just Share Please";
    }

    public getViewType(): string {
        return JSPView.type;
    }

    public getIcon(): string {
        return "share";
    }

}
