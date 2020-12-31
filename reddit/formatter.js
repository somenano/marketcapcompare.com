function formatter_marketcap(value, row, index) {
    return '$'+(value/1000000000).toFixed(3)+' Billion USD';
}

function formatter_logo(value, row, index) {
    return '<img src="'+value+'" height="32" width="32">';
}

function formatter_name(value, row, index) {
    if (!row.subreddit) return value;
    return '<a href="https://www.reddit.com/r/' + row.subreddit + '" target="_new">' + value + ' (' + row.symbol + ')' + '</a>';
}

function formatter_reddit_active_users_perc(value, row, index) {
    if (!value || isNaN(value)) return undefined;
    return (100 * value).toFixed(2) + '%';
}

function numberSorter(a, b) {
    if (!a) return -1 * getOrder();
    if (!b) return 1 * getOrder();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

