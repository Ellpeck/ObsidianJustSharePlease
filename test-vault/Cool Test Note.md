This is a cool test note%%with an inline comment%%, my friends!

Chemistry!
$$
\ce{ ^{227}_{90}Th+ }
$$

$$
\ce{ 1/2H2O }
$$

%%
BLOCK COMMENT
%%

> How are you?

```js
$.ajax({  
    method: "get",  
    url: id ? `share.php?id=${id}` : "index.md",  
    success: t => {  
        main.html(DOMPurify.sanitize(md.render(t)));  
  
        // scroll to anchor  
        let element = $(window.location.hash);  
        if (element.length)  
            $(window).scrollTop(element.offset().top);  
    },  
    error: (r, s, e) => main.html(`<div class="error"><p>Error loading shared note with id <code>${id}</code>: ${e}</p><p><a href="#">Home</a></p></div>`)  
});
```

cool!!

%%
ANOTHER BLOCK COMMENT
you know

WITH A LOT OF TEXT
%%

blah blah i added and[^text] removed this[^1]

The following is $x^2 = 7$, but more^[Inline footnote!] complicated!
$$
x^2 + \sum_{i = 1}^{10000} x^2 \cdot 0 = 7
$$

## Some images

image!

![this is an image my friends, and this is my alt text](Obsidian_TtC7w4GA86.png)

wikilink image!

![[Pasted image 20230816130420.png]]

image but with spaces in the name!

![](Pasted%20image%2020230816130420.png)

online image!
![](https://ellpeck.de/res/me.jpeg)

nice

[^1]: Normal footnote!

[^text]: Text footnote