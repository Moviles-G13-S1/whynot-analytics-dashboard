// Money saved on purchases (Sprint 3 BQ, Miguel): every figure arrives already
// calculated by get_admin_analytics (metric "purchase_savings"); this view only
// formats it.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const orDash = (value, format) => (value == null ? '—' : format(value));
const percent = value => orDash(value, v => `${Number(v).toFixed(1)}%`);

/** "$1,250.5", or "-$300" when users paid more than the saved price. */
const money = value => orDash(value, v => {
  const amount = Number(v);
  const formatted = `$${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return amount < 0 ? `-${formatted}` : formatted;
});

function bars(rows, { label, value, display = number }) {
  const max = Math.max(1, ...rows.map(row => Math.abs(Number(value(row)) || 0)));
  return rows.map(row => {
    const amount = Number(value(row)) || 0;
    return `<div class="bq-rank-row"><span>${escape(label(row))}</span><div class="bq-track"><div style="width:${Math.max(0, Math.abs(amount) / max * 100)}%"></div></div><strong>${display(value(row))}</strong></div>`;
  }).join('');
}

export function renderPurchaseSavings(data) {
  const d = data ?? {};

  const header = card(`<p class="eyebrow">BQ · MIGUEL · TYPE 2</p><h2>Money saved on purchases</h2><p class="muted">How much money have users saved on the products they marked as purchased in the app? When a user marks a product as purchased, the app asks what they paid; the saving is the price they had saved minus the price paid. Type 2: it shows whether WhyNot helps people wait for a better price.</p>`, 'wide-card');

  const kpis = `<div class="kpis">${card(`<p class="eyebrow">NET MONEY SAVED</p><div class="big">${money(d.netSaved)}</div><small>${percent(d.savingRate)} of ${money(d.referenceTotal)} saved prices · ${money(d.paidTotal)} paid</small>`)}${card(`<p class="eyebrow">PURCHASES WITH A PRICE PAID</p><div class="big">${number(d.purchases)}</div><small>by ${number(d.buyers)} buyers · ${money(d.averageSavedPerPurchase)} saved per purchase</small>`)}</div>`;

  if (!Number(d.purchases)) {
    return `${header}${kpis}${card('<div class="empty"><h2>No purchases with a price paid yet</h2><p>Savings appear once users mark products as purchased and enter what they paid.</p></div>', 'wide-card')}`;
  }

  const outcomeCard = card(`<p class="eyebrow">HOW PURCHASES ENDED</p><h2>Below, at or above the saved price</h2>${bars([
    { label: 'Paid less', count: d.savedPurchases },
    { label: 'Same price', count: d.samePricePurchases },
    { label: 'Paid more', count: d.overpaidPurchases },
  ], { label: row => row.label, value: row => row.count })}<p class="muted">Saved ${money(d.grossSaved)} · overspent ${money(d.overspent)} · ${money(d.averageSavedPerBuyer)} per buyer</p>`);

  const platforms = d.byPlatform ?? [];
  const platformCard = card(`<p class="eyebrow">BY PLATFORM</p><h2>Where purchases were marked</h2>${bars(platforms, { label: row => row.platform === 'ios' ? 'iOS' : 'Android', value: row => row.purchases })}<p class="muted">${platforms.map(row => `${row.platform === 'ios' ? 'iOS' : 'Android'}: ${money(row.netSaved)} saved`).join(' · ')}</p>`);

  const categoryRows = (d.byCategory ?? []).map(row => `<tr><th scope="row">${escape(row.categoryName ?? row.categoryId)}</th><td>${number(row.purchases)}</td><td>${money(row.netSaved)}</td><td>${percent(row.savingRate)}</td></tr>`).join('');
  const categoryCard = card(`<p class="eyebrow">SAVINGS BY CATEGORY</p><h2>Where users save the most</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Category</th><th>Purchases</th><th>Net saved</th><th>Saving rate</th></tr></thead><tbody>${categoryRows || '<tr><td colspan="4">No categories recorded.</td></tr>'}</tbody></table></div><p class="muted">The price paid is what users enter, not a verified checkout amount.${Number(d.skipped) ? ` ${number(d.skipped)} events without a valid price were left out.` : ''}</p>`, 'wide-card');

  return `${header}${kpis}<div class="two-col">${outcomeCard}${platformCard}</div>${categoryCard}`;
}
