var socket = io.connect('https://api.marketcapcompare.com');
// var socket = io.connect('http://localhost:3000');
socket.emit('subscribe_periodic');
socket.on('periodic', handle_periodic);

window.periodic = undefined;
window.first_load = true;
window.reddit_data = {};            // raw data from reddit
window.table_data = {};             // Object of data that feeds table

window.addEventListener('popstate', function (event) {
    if (!window.first_load && window.data) handle_periodic(window.data);
}, false);

function handle_periodic(data)
{
    // console.log(data);
    window.periodic = data;
    calc_reddit_scores();
    update_reddit_table();

    if (window.first_load) {
        const url = new URL(window.location.href);
        if (url.hash.length > 0) {
            self.location = window.location.href;
        }
        window.first_load = false;
    }
}

function calc_reddit_scores()
{
    for (let symbol of get_symbols('marketcap', false)) {
        window.periodic.data[symbol].reddit_score = window.periodic.data[symbol].reddit_subs_active;    // Score is active subscribers
        if (isNaN(window.periodic.data[symbol].reddit_score)) window.periodic.data[symbol].reddit_score = undefined;
    }
}

function update_reddit_table() 
{
    let data = window.periodic;
    if (window.periodic === undefined) {
        console.error('No metadata, waiting and trying again...');
        setTimeout(function() {
            update_mc_table(data);
            return;
        }, 1*1000); // Wait 1 second
        return;
    }

    $('#message-container').text('Data current as of: '+ new Date(window.periodic.dtg));

    window.table_data = [];
    asset_rank = 0;
    let symbols_by_reddit_score = get_symbols('reddit_score', false); // high score is better
    for (let symbol of get_symbols('marketcap', false)) {
        asset_rank += 1;
        const market_cap = Number.parseFloat(window.periodic.data[symbol].marketcap);
        const name = window.periodic.metadata[symbol].name;
        const subreddit = window.periodic.metadata[symbol].subreddit;
        const logo = window.periodic.metadata[symbol].logo;
        const reddit_total_users = window.periodic.data[symbol].reddit_subs_total;
        const reddit_active_users = window.periodic.data[symbol].reddit_subs_active;
        const reddit_active_users_perc = reddit_active_users / reddit_total_users;
        const reddit_score = window.periodic.data[symbol].reddit_score;
        
        window.table_data.push({
            logo: logo,
            name: name,
            marketcap: market_cap,
            rank_cmc: asset_rank,
            rank_reddit: (reddit_score ? symbols_by_reddit_score.indexOf(symbol) + 1 : null),
            reddit_total_users: reddit_total_users,
            reddit_active_users: reddit_active_users,
            reddit_active_users_perc: reddit_active_users_perc,
            reddit_score: reddit_score,
            subreddit: subreddit,
            symbol: symbol
        });

    }

    $('#table-reddit').bootstrapTable({data:window.table_data});
}