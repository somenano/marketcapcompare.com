function isAlpha(str) {
    if (!str) return false;

    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            return false;
        }
    }
    return true;
};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function get_symbols(sort, ascending) {
    let symbols = [];
    if (window.periodic === undefined) return symbols;
    
    let data_array = Object.entries(window.periodic.data).map(e=>e[1]);
    data_array.sort(function(a, b) {
        if (a[sort] === undefined && b[sort] === undefined) return 0;
        if (a[sort] === undefined) return 1;
        if (b[sort] === undefined) return -1;
        if (ascending) return a[sort] > b[sort] ? 1 : (a[sort] < b[sort] ? -1 : 0);
        else return b[sort] > a[sort] ? 1 : (b[sort] < a[sort] ? -1 : 0);
    });

    for (let asset of data_array) {
        symbols.push(asset.symbol);
    }
    return symbols;
}

function get_json(url, cb) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let json = JSON.parse(this.responseText);
            cb(json);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}