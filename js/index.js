"use strict"

var socket = io.connect('https://api.marketcapcompare.com');
// var socket = io.connect('http://localhost:3000');
socket.emit('subscribe_periodic');
socket.on('periodic', handle_periodic);

window.periodic = undefined;
window.default_selected_asset = 'NANO';
window.first_load = true;

if (document.referrer == 'https://api.marketcapcompare.com/') {
    $('#scrape-header').addClass('d-flex').removeClass('d-none');
}

function get_selected_asset()
{
    const url_string = window.location.href;
    const url = new URL(url_string);
    const unsanitized_asset = url.searchParams.get("asset");
    if (unsanitized_asset === null && window.periodic.metadata[window.default_selected_asset]) return window.default_selected_asset;
    const sanitized_asset = unsanitized_asset.replace(/[\W_]+/g,"");
    if ((sanitized_asset=='' || sanitized_asset === undefined) && window.periodic.metadata[window.default_selected_asset]) return window.default_selected_asset;
    return sanitized_asset;
}

function update_selected_asset(asset)
{
    if (asset == 'instructions') return;
    const url_string = window.location.href;
    const url = new URL(url_string);
    url.searchParams.set('asset', asset);
    url.hash = '';
    // self.location=url.href;
    history.pushState('update_selected_asset', 'CompareMarketCap', url.href);
    handle_periodic(window.periodic);
}

window.addEventListener('popstate', function (event) {
    if (!window.first_load && window.data) handle_periodic(window.periodic);
}, false);

function handle_periodic(data) {
    window.periodic = data;
    update_dropdown();
    update_mc_table();

    if (window.first_load) {
        const url = new URL(window.location.href);
        if (url.hash.length > 0) {
            self.location = window.location.href;
        }
        window.first_load = false;
    }
}

function update_description(symbol)
{
    const selected_metadata = window.periodic.metadata[symbol];
//     let html = `
// <hr width="50%">
// <h5>`+selected_metadata['name']+` (`+ selected_metadata['symbol']+`)</h5>
// <p>`+selected_metadata['description']+`</p>
// `;
    let html = '';
    if (selected_metadata.subreddit) {
        html += `<p class="fs-0-7">Learn more on `+selected_metadata['name']+`'s subreddit: <a target="_new" href="https://reddit.com/r/`+selected_metadata['subreddit']+`">https://reddit.com/r/`+selected_metadata['subreddit']+`</a></p>`
    }
    $('#selected-asset-info').html(html);
}

function update_dropdown()
{
    let asset_list = [];
    for (let symbol of get_symbols('symbol', true)) {
        asset_list.push({
            name: window.periodic.metadata[symbol].name,
            symbol: symbol
        });
    }

    let selected_symbol = get_selected_asset();

    $('#crypto-select').empty();
    $('#crypto-select').append('<option value="instructions">-- Select a Cryptocurrency --</option>');
    for (let asset_data of asset_list) {
        const selected = (asset_data.symbol == selected_symbol ? ' selected' : '');
        const html = '<option value="'+asset_data.symbol+'"'+selected+'>'+asset_data.name+' ('+asset_data.symbol+')</option>';
        $('#crypto-select').append(html);
    }
    
}

function update_mc_table()
{
    if (window.periodic === undefined) {
        console.error('No data, waiting and trying again...');
        setTimeout(function() {
            update_mc_table();
            return;
        }, 1*1000);
        return;
    }

    $('#message-container').text('Data current as of: '+ new Date(window.periodic.dtg));

    let selected_asset_symbol = get_selected_asset();

    let selected_asset_data = window.periodic.data[selected_asset_symbol];

    let selected_asset_name = undefined;
    let selected_asset_market_cap = undefined;
    let selected_asset_price = undefined;
    let selected_asset_metadata = undefined;
    let selected_asset_logo = undefined;
    let selected_asset_rank = undefined;
    let selected_asset_subreddit = undefined;

    if (selected_asset_data === undefined) {
        $('#message-container').text('Asset "'+selected_asset_symbol+'" not found in Top 100');
    } else {
        selected_asset_market_cap = Number.parseFloat(selected_asset_data.marketcap);
        selected_asset_price = Number.parseFloat(selected_asset_data.price);
        selected_asset_metadata = window.periodic.metadata[selected_asset_symbol];
        selected_asset_name = selected_asset_metadata.name;
        selected_asset_logo = selected_asset_metadata.logo;
        selected_asset_rank = (get_symbols('marketcap', false).indexOf(selected_asset_symbol))+1;
        selected_asset_subreddit = (selected_asset_metadata.subreddit ? selected_asset_metadata.subreddit.toLowerCase() : '');
        update_description(selected_asset_data.symbol);
    }

    // console.log(selected_asset_data);

    let html = '';
    html += '<div class="row"><table class="table table-hover w-auto">';
    html += '<tbody>';
    let asset_rank = 0;
    for (let symbol of get_symbols('marketcap', false)) {
        asset_rank += 1;
        let asset_data = window.periodic.data[symbol];
        let asset_metadata = window.periodic.metadata[symbol];
        let asset_price_change_data = window.periodic.tick_change_data.price[symbol];
        if (asset_price_change_data === undefined) {
            // skip if tick_change_data did not load; might be an issue on backend TODO
            console.error('Unable to pull tick_change_data for symbol: '+ symbol);
            continue;
        }
        let asset_reddit_change_data = window.periodic.tick_change_data.reddit[symbol];
        const market_cap = Number.parseFloat(asset_data.marketcap);
        const price = Number.parseFloat(asset_data.price);
        const price_change_1h = Number.parseFloat(asset_price_change_data['1h']);
        const price_change_24h = Number.parseFloat(asset_price_change_data['24h']);
        const price_change_7d = Number.parseFloat(asset_price_change_data['7d']);
        const name = asset_metadata['name'];
        const subreddit = asset_metadata.subreddit.toLowerCase();
        const logo = asset_metadata.logo;

        const market_cap_diff = (market_cap - selected_asset_market_cap) / selected_asset_market_cap;
        const selected_asset_price_rel = selected_asset_price + (market_cap_diff * selected_asset_price);

        html += '<tr>';
        html += '<td class="align-middle text-center">';
        html += '<div class="d-inline-flex flex-row">';

        if (selected_asset_data === undefined) {
            html += '<div class="p-2" text-right><span class="fs-1-5"></span></div>';
        } else {
            html += `
<div class="p-2 text-right" style="width:300px">
<div><span class="fs-1-5">`+selected_asset_name+` (`+selected_asset_symbol+`)</span></div>
<div class="fs-1"><span>Price at #`+asset_rank+`: $`+numberWithCommas(selected_asset_price_rel.toFixed(2))+` USD</span></div>
<div class="fs-1"><span>Current price at #`+selected_asset_rank+`: $`+numberWithCommas(selected_asset_price.toFixed(2))+` USD</span></div>
<div class="fs-0-7"><span>Difference: `+numberWithCommas((market_cap_diff*100).toFixed(0))+`%</span></div>
</div>

<div class="p-2 d-flex align-items-center" style="width:48px">
<img src="`+selected_asset_logo+`" width="32px">
</div>`;
        }

        html += `

 <div class="pl-4 pr-4" id="`+asset_rank+`">&nbsp;</div>

 <div class="p-2 text-center d-flex align-items-center">
  <div>
  <div class="fs-3"><a href="#`+asset_rank+`" class="text-dark text-decoration-none">`+asset_rank+`</a></div>
  <div class="fs-0-7">RANK</div>
  </div>
 </div>

 <div class="pl-4 pr-4">&nbsp;</div>

 <div class="p-2 d-flex align-items-center" id="`+symbol+`">
  <a href="#`+symbol+`" class="text-dark text-decoration-none"><img src="`+logo+`" width="32px"></a>
 </div>

 <div class="p-2 text-left" style="width:300px">
  <div><span class="fs-1-5 w-100"><a href="#`+symbol+`" class="text-dark text-decoration-none">`+name+` (`+symbol+`)</a></span></div>
  <div class="fs-1"><span class="w-100">Market Cap: $`+numberWithCommas((market_cap/1000000000).toFixed(3))+` Billion USD</span></div>
  <div class="fs-1"><span class="w-100">Price: $`+numberWithCommas(price.toFixed(2))+` USD</span></div>
  <div class="fs-0-7"><span class="w-100">1hr: <span class="`+(price_change_1h > 0 ? 'text-success' : (price_change_1h < 0 ? 'text-danger' : 'text-dark'))+`">`+price_change_1h.toFixed(2)+`%</span> | 24hr: <span class="`+(price_change_24h > 0 ? 'text-success' : (price_change_24h < 0 ? 'text-danger' : 'text-dark'))+`">`+price_change_24h.toFixed(2)+`%</span> | 7d: <span class="`+(price_change_7d > 0 ? 'text-success' : (price_change_7d < 0 ? 'text-danger' : 'text-dark'))+`">`+price_change_7d.toFixed(2)+`%</span></span></div>
  </div>

</div>
</td>`;

        html += '</tr>';   // row

    }
    html += '</tbody>';
    html += '</table></div>';
    // $('#data-table').html(html);
    $('#data-container').html(html);
}
