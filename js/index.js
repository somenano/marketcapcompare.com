"use strict"

var socket = io.connect('https://api.marketcapcompare.com');
socket.emit('subscribe_all');
socket.on('data', handle_data);
socket.on('metadata', handle_metadata);

window.data = undefined;
window.metadata = undefined;
window.default_selected_asset = 'NANO';
window.default_selected_asset_id = 1567;
window.first_load = true;

if (document.referrer == 'https://api.marketcapcompare.com') {
    $('#scrape-header').addClass('d-flex').removeClass('d-none');
}

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

function get_selected_asset()
{
    const url_string = window.location.href;
    const url = new URL(url_string);
    const unsanitized_asset = url.searchParams.get("asset");
    if (unsanitized_asset === null && window.metadata['metadata'][window.default_selected_asset_id]) return window.default_selected_asset;
    const sanitized_asset = unsanitized_asset.replace(/[\W_]+/g,"");
    if ((sanitized_asset=='' || sanitized_asset === undefined) && window.metadata['metadata'][window.default_selected_asset_id]) return window.default_selected_asset;
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
    handle_data(window.data);
}

window.addEventListener('popstate', function (event) {
    if (!window.first_load && window.data) handle_data(window.data);
}, false);

function handle_data(data)
{
    // console.log(data);
    window.data = data;
    update_dropdown(data);
    update_table(data);
    if (window.first_load) {
        const url = new URL(window.location.href);
        if (url.hash.length > 0) {
            self.location = window.location.href;
        }
        window.first_load = false;
    }
}

function handle_metadata(metadata)
{
    // console.log(metadata);
    window.metadata = metadata;
}

function update_description(asset_id)
{
    const selected_metadata = window.metadata['metadata'][asset_id];
//     let html = `
// <hr width="50%">
// <h5>`+selected_metadata['name']+` (`+ selected_metadata['symbol']+`)</h5>
// <p>`+selected_metadata['description']+`</p>
// `;
    let html = '';
    if (selected_metadata['subreddit']) {
        html += `<p class="fs-0-7">Learn more on `+selected_metadata['name']+`'s subreddit: <a target="_new" href="https://reddit.com/r/`+selected_metadata['subreddit']+`">https://reddit.com/r/`+selected_metadata['subreddit']+`</a></p>`
    }
    $('#selected-asset-info').html(html);
}

function update_dropdown(data)
{
    let asset_list = [];
    for (let asset_data of data['data']) {
        asset_list.push({
            name: asset_data['name'],
            symbol: asset_data['symbol']
        });
    }

    // Sort alphabetically by name
    asset_list.sort(function(a,b) {return (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);});
    
    let selected_symbol = get_selected_asset();

    $('#crypto-select').empty();
    $('#crypto-select').append('<option value="instructions">-- Select a Cryptocurrency --</option>');
    for (let asset_data of asset_list) {
        const selected = (asset_data.symbol == selected_symbol ? ' selected' : '');
        const html = '<option value="'+asset_data.symbol+'"'+selected+'>'+asset_data.name+' ('+asset_data.symbol+')</option>';
        $('#crypto-select').append(html);
    }
    
}

function update_table(data)
{
    if (window.metadata === undefined) {
        console.error('No metadata, waiting and trying again...');
        setTimeout(function() {
            update_table(data);
            return;
        }, 1*1000);
        return;
    }

    $('#message-container').text('Data current as of: '+ new Date(data.timestamp));

    let selected_asset = get_selected_asset();

    let selected_asset_data_index = -1;
    let selected_asset_data;
    let selected_asset_name;
    let selected_asset_market_cap;
    let selected_asset_price;
    let selected_asset_metadata;
    let selected_asset_logo;
    let selected_asset_rank;
    let counter = 0;
    for (let asset_data of data['data']) {
        if (asset_data['symbol'] == selected_asset){
            selected_asset_data_index = counter;
            selected_asset_data = data['data'][selected_asset_data_index];
            selected_asset_name = selected_asset_data['name'];
            selected_asset_market_cap = selected_asset_data['quote']['USD']['market_cap'];
            selected_asset_price = selected_asset_data['quote']['USD']['price'];
            selected_asset_metadata = window.metadata['metadata'][selected_asset_data['id']];
            selected_asset_logo = selected_asset_metadata['logo'];
            selected_asset_rank = counter+1;
            update_description(selected_asset_data['id']);
            break;
        }
        counter += 1;
    }

    if (selected_asset_data_index < 0) {
        $('#message-container').text('Asset "'+selected_asset+'" not found in Top 100');
    }

    // console.log(selected_asset_data);

    counter = 1;
    let html = '';
    html += '<div class="row"><table class="table table-hover w-auto">';
    html += '<tbody>';
    for (let asset_data of data['data']) {
        const market_cap = Number.parseFloat(asset_data['quote']['USD']['market_cap']);
        const price = Number.parseFloat(asset_data['quote']['USD']['price']);
        const price_change_1h = Number.parseFloat(asset_data['quote']['USD']['percent_change_1h']);
        const price_change_24h = Number.parseFloat(asset_data['quote']['USD']['percent_change_24h']);
        const price_change_7d = Number.parseFloat(asset_data['quote']['USD']['percent_change_7d']);
        const name = asset_data['name'];
        const symbol = asset_data['symbol'];
        const metadata = window.metadata['metadata'][asset_data['id']];
        const logo = metadata['logo'];

        const market_cap_diff = (market_cap - selected_asset_market_cap) / selected_asset_market_cap;
        const selected_asset_price_rel = selected_asset_price + (market_cap_diff * selected_asset_price);

        html += '<tr>';
        html += '<td class="align-middle text-center">';
        html += '<div class="d-inline-flex flex-row">';

        if (selected_asset_data_index < 0) {
            html += '<div class="p-2" text-right><span class="fs-1-5"></span></div>';
        } else {
            html += `
<div class="p-2 text-right" style="width:300px">
<div><span class="fs-1-5">`+selected_asset_name+` (`+selected_asset+`)</span></div>
<div class="fs-1"><span>Price at #`+counter+`: $`+numberWithCommas(selected_asset_price_rel.toFixed(2))+` USD</span></div>
<div class="fs-1"><span>Current price at #`+selected_asset_rank+`: $`+numberWithCommas(selected_asset_price.toFixed(2))+` USD</span></div>
<div class="fs-0-7"><span>Difference: `+numberWithCommas((market_cap_diff*100).toFixed(0))+`%</span></div>
</div>

<div class="p-2 d-flex align-items-center" style="width:48px">
<img src="`+selected_asset_logo+`" width="32px">
</div>`;
        }

        html += `

 <div class="pl-4 pr-4" id="`+counter+`">&nbsp;</div>

 <div class="p-2 text-center d-flex align-items-center">
  <div>
  <div class="fs-3"><a href="#`+counter+`" class="text-dark text-decoration-none">`+counter+`</a></div>
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

        counter += 1;
    }
    html += '</tbody>';
    html += '</table></div>';
    // $('#data-table').html(html);
    $('#data-container').html(html);
}
