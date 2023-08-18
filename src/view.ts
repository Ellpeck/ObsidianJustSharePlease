import {ButtonComponent, ItemView, TFile, WorkspaceLeaf} from "obsidian";
import JustSharePleasePlugin, {removeExtension} from "./main";

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
        if (this.plugin.settings.shared.length > 0) {
            for (let shared of this.plugin.settings.shared) {
                let abstractFile = this.plugin.app.vault.getAbstractFileByPath(shared.path);
                if (abstractFile instanceof TFile) {
                    let file = abstractFile;
                    let div = content.createDiv({cls: "just-share-please-shared-item"});
                    div.createSpan({cls: "just-share-please-shared-name", text: removeExtension(shared.path).split(/[/\\]/g).pop()});
                    if (file?.path.match(/[/\\]/))
                        div.createSpan({cls: "just-share-please-shared-path", text: removeExtension(file.path)});
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
                            .onClick(async e => {
                                let leaf = this.app.workspace.getLeaf(e.ctrlKey);
                                await leaf.openFile(file);
                                this.app.workspace.setActiveLeaf(leaf, {focus: true});
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
        } else {
            content.createSpan({text: "You have not shared any items yet."});
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
