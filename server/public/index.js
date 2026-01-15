let md = markdownit({
    html: true,
    linkify: true,
    langPrefix: "hljs language-",
    highlight: (c, l) => {
        const language = hljs.getLanguage(l) ? l : "plaintext";
        return hljs.highlight(c, {language}).value;
    }
});
md.use(texmath, {
    engine: katex,
    delimiters: ["dollars", "beg_end"]
});
md.use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
        placement: "after",
        ariaHidden: true
    }),
    // prepend current file id to the anchor permalink
    slugify: s => `${getId() ?? ""}-${encodeURIComponent(String(s).trim().toLowerCase().normalize("NFKD").replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, ""))}`
});
md.use(markdownitFootnote);
md.use(markdownitCheckbox);

let rulesToReplace = [
    // prepend current file id to footnotes
    ["footnote_ref", [/href="#(fn\d+)"/, `href="#${getId() ?? ""}-$1"`]],
    ["footnote_open", [/id="(fn\d+)"/, `id="${getId() ?? ""}-$1"`]],
    // prepend current file id to footnote refs
    ["footnote_ref", [/id="(fnref\d+)"/, `id="${getId() ?? ""}-$1"`]],
    ["footnote_anchor", [/href="#(fnref\d+)"/, `href="#${getId() ?? ""}-$1"`]]
];
for (let replacement of rulesToReplace) {
    let prevRule = md.renderer.rules[replacement[0]];
    md.renderer.rules[replacement[0]] = (tokens, idx, options, env, self) => {
        return prevRule(tokens, idx, options, env, self).replace(...replacement[1]);
    };
}

let main = $("#main");
let download = $("#download-markdown");
let open = $("#open-in-obsidian");

$(window).on("hashchange", e => {
    let oldUrl = e.originalEvent?.oldURL;
    let oldHash = oldUrl?.lastIndexOf("#");
    if (oldHash && getId(oldUrl.substring(oldHash)) !== getId())
        display();
});
display();

function display() {
    main.html(`<div class="center-message"><p>Loading...</p></div>`);
    let id = getId();
    $.ajax({
        method: "get",
        url: id ? `share.php?id=${id}` : "index.md",
        success: t => {
            main.html(DOMPurify.sanitize(md.render(t)));

            $(() => {
                // change title
                let firstHeading = $("h1, h2, h3, h4, h5, h6").first();
                if (firstHeading) {
                    let heading = firstHeading.text().trim();
                    if (heading.endsWith("#"))
                        heading = heading.substring(0, heading.length - 1).trimEnd();
                    window.document.title = heading;
                }

                // scroll to anchor
                let element = $(window.location.hash);
                if (element.length)
                    $(window).scrollTop(element.offset().top);

                // set download links
                download.attr("download", `${window.document.title}.md`);
                download.attr("href", `data:text/plain;charset=utf-8,${encodeURIComponent(t)}`);
                open.attr("href", `obsidian://new?name=${encodeURI(window.document.title)}&content=${encodeURIComponent(t)}`);
            });
        },
        error: (r, s, e) => main.html(`<div class="center-message"><p>Error loading shared note with id <code>${id}</code>: <code>${s} ${e}</code></p><p><a href="#">Home</a></p></div>`)
    });
}

function getId(hash) {
    hash ||= window.location.hash;
    if (!hash)
        return undefined;
    // hashes consist of the file id, a dash and then the permalink anchor name
    let dash = hash.indexOf("-");
    return hash.substring(1, dash > 0 ? dash : hash.length);
}
