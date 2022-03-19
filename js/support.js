var support = {
    horizontal: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-9642466483241218"
     data-ad-slot="9848300782"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>`
}

function fill_support() {
    const elements = document.getElementsByClassName("support");
    for (let i = 0; i < elements.length; i++) {
        let element = elements.item(i);
        const format = element.getAttribute('format');
        element.innerHTML = support[format];
        // console.log(support[format]);
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}
// fill_support();