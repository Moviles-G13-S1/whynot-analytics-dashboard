// Online stores in saved products (Sprint 4 BQ Type 4, Santiago): every figure
// arrives already calculated by get_admin_analytics (metric "store_domains");
// this view only formats it.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');
const percent = value => (value == null || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(1)}%`);
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;

function storeLabel(row) {
  const name = escape(row.name || row.domain);
  return row.knownStore && row.name !== row.domain
    ? `${name}<br><small>${escape(row.domain)}</small>`
    : name;
}

function rankRows(stores) {
  const max = Math.max(1, ...stores.map(row => Number(row.products) || 0));
  return stores.map(row => {
    const amount = Number(row.products) || 0;
    return `<div class="bq-rank-row"><span>${storeLabel(row)}</span><div class="bq-track"><div style="width:${Math.max(0, amount / max * 100)}%"></div></div><strong>${number(amount)}</strong></div>`;
  }).join('');
}

export function renderStoreDomains(data) {
  const d = data ?? {};
  const stores = Array.isArray(d.stores) ? d.stores : [];
  const leaders = Array.isArray(d.categoryLeaders) ? d.categoryLeaders : [];
  const top = stores[0];
  const other = d.otherStores ?? {};

  const header = card(`<p class="eyebrow">BQ TYPE 4 · SANTIAGO · SPRINT 4</p><h2>Which online stores appear most in saved products?</h2><p class="muted">The store of a saved product is the domain of its link (for example <code>zara.com</code>). Type 4: knowing where users find the products they want, and how often those products are bought, is valuable to partner stores and brands.</p>`, 'wide-card');

  const kpis = `<div class="kpis">${card(`<p class="eyebrow">TOP STORE</p><div class="bq-leader">${top ? escape(top.name || top.domain) : '—'}</div><small>${top ? `${number(top.products)} products · ${number(top.users)} users · ${percent(top.share)} of linked products` : 'No linked products yet'}</small>`)}${card(`<p class="eyebrow">LINK COVERAGE</p><div class="big">${percent(d.linkCoverage)}</div><small>${number(d.linkedProducts)} of ${number(d.totalProducts)} current products have a store link · ${number(d.distinctStores)} distinct stores</small>`)}</div>`;

  if (!Number(d.linkedProducts)) {
    return `${header}${kpis}${card('<div class="empty"><h2>No product links yet</h2><p>Stores appear once users save products with a link to an online store.</p></div>', 'wide-card')}`;
  }

  const otherNote = Number(other.stores)
    ? `<p class="muted">Plus ${number(other.stores)} more stores with ${number(other.products)} products.</p>`
    : '';
  const ranking = card(`<p class="eyebrow">TOP ${number(stores.length)} STORES</p><h2>Saved products per store</h2><div class="bq-breakdown">${rankRows(stores)}</div>${otherNote}`, 'wide-card');

  const tableRows = stores.map(row => `<tr><th scope="row">${escape(row.name || row.domain)}</th><td>${escape(row.domain)}</td><td>${number(row.products)}</td><td>${number(row.users)}</td><td>${number(row.purchased)}</td><td>${percent(row.purchasedPercentage)}</td></tr>`).join('');
  const table = card(`<p class="eyebrow">DETAIL</p><h2>Users and purchases per store</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Store</th><th>Domain</th><th>Products</th><th>Users</th><th>Purchased</th><th>% purchased</th></tr></thead><tbody>${tableRows}</tbody></table></div>`, 'wide-card');

  const leaderRows = leaders.map(row => `<tr><th scope="row">${escape(row.categoryName || row.categoryId)}</th><td>${(row.stores ?? []).map(store => escape(store.name || store.domain)).join(', ')}</td><td>${number(row.products)}</td></tr>`).join('');
  const leaderCard = card(`<p class="eyebrow">BY CATEGORY</p><h2>Leading store per category</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Category</th><th>Store (ties shown)</th><th>Products</th></tr></thead><tbody>${leaderRows || '<tr><td colspan="3">No categories with linked products.</td></tr>'}</tbody></table></div>`);

  const coverageCard = card(`<p class="eyebrow">NOT ATTRIBUTED</p><h2>Products without a store</h2><div class="bq-breakdown"><div class="bq-rank-row"><span>No link</span><div class="bq-track"><div style="width:${Number(d.totalProducts) ? Number(d.withoutLink) / Number(d.totalProducts) * 100 : 0}%"></div></div><strong>${number(d.withoutLink)}</strong></div><div class="bq-rank-row"><span>Unusable link</span><div class="bq-track"><div style="width:${Number(d.totalProducts) ? Number(d.invalidLink) / Number(d.totalProducts) * 100 : 0}%"></div></div><strong>${number(d.invalidLink)}</strong></div></div><p class="muted">The link is optional, so these products cannot be assigned to a store and are left out of the ranking.</p>`);

  const method = `<details class="home-open-method"><summary>How this is calculated</summary><div class="home-open-method-body"><p>Current products only (deleted products are not counted). Each product link is reduced to its registrable domain: <code>www2.hm.com</code> becomes <code>hm.com</code> and <code>www.falabella.com.co</code> stays <code>falabella.com.co</code>. Store names come from the seeded stores whose website has the same domain; other domains are shown as they are.</p><p>Users are distinct owners. Short links (such as bit.ly) count under the shortener's domain.</p></div></details>`;

  return `${header}${kpis}${ranking}${table}<div class="two-col">${leaderCard}${coverageCard}</div>${method}`;
}
