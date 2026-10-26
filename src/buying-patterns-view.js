// Buying patterns (Sprint 3 BQ, Juan Felipe): every figure arrives already
// calculated by get_admin_analytics; this view only formats it.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const pill = (label, active, action, value) => `<button class="pill ${active ? 'active' : ''}" data-action="${action}" data-value="${escape(value)}">${escape(label)}</button>`;
const orDash = (value, format) => (value == null ? '—' : format(value));
const rate = value => orDash(value, v => `${(Number(v) * 100).toFixed(1)}%`);
const days = value => orDash(value, v => `${Number(v).toFixed(1)} days`);
const money = value => orDash(value, v => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`);

const BUCKETS = [
  ['sameDay', 'Same day'],
  ['oneToSevenDays', '1–7 days'],
  ['eightToThirtyDays', '8–30 days'],
  ['overThirtyDays', 'Over 30 days'],
];
const TIME_LABELS = { morning: 'Morning (05–12)', afternoon: 'Afternoon (12–18)', night: 'Night (18–05)' };

function bars(rows, { label, value, display = number, peaks = [] }) {
  const max = Math.max(1, ...rows.map(row => Number(value(row)) || 0));
  return rows.map(row => {
    const amount = Number(value(row)) || 0;
    const peak = peaks.includes(label(row));
    return `<div class="bq-rank-row"><span>${peak ? `<strong>${escape(label(row))}</strong>` : escape(label(row))}</span><div class="bq-track"><div style="width:${Math.max(0, amount / max * 100)}%"></div></div><strong>${display(value(row))}${peak ? ' · peak' : ''}</strong></div>`;
  }).join('');
}

export function renderBuyingPatterns(data, selectedMonths) {
  const d = data ?? {};
  const conversion = d.conversion ?? {};
  const time = d.timeToPurchase ?? {};
  const when = d.whenTheyBuy ?? {};
  const spending = d.spending ?? {};
  const repeat = d.repeatBuyers ?? {};

  const header = card(`<p class="eyebrow">BQ · JUAN FELIPE · TYPE * (2/4)</p><h2>Buying patterns of purchased products</h2><p class="muted">What are the buying patterns of users based on the products they have marked as purchased? Type 2: when and how fast users buy tells the app when a reminder helps. Type 4: conversion, prices and brands per category are valuable to partner stores and brands.</p>`, 'wide-card');
  const windowPicker = `<div class="segment-row">${[6, 12, 24].map(months => pill(`${months} months`, selectedMonths === months, 'months', months)).join('')}</div>`;

  const kpis = `<div class="kpis">${card(`<p class="eyebrow">PURCHASES IN THE WINDOW</p><div class="big">${number(d.totalPurchases)}</div><small>${number(d.undatedPurchases)} purchased products have no date</small>`)}${card(`<p class="eyebrow">CONVERSION</p><div class="big">${rate(conversion.rate)}</div><small>${number(conversion.purchasedOfThose)} of ${number(conversion.savedInWindow)} products saved in the window are purchased</small>`)}</div><div class="kpis">${card(`<p class="eyebrow">MEDIAN TIME TO PURCHASE</p><div class="big">${days(time.medianDays)}</div><small>Average ${days(time.averageDays)} · ${number(time.measured)} measured</small>`)}${card(`<p class="eyebrow">REPEAT BUYERS</p><div class="big">${rate(repeat.repeatRate)}</div><small>Share of the ${number(repeat.buyers)} buyers in the window with 2 or more purchases</small>`)}</div>`;

  if (!Number(d.totalPurchases) && !Number(conversion.savedInWindow)) {
    return `${header}${windowPicker}${kpis}${card('<div class="empty"><h2>No purchases in this window</h2><p>Try a longer period or check again after products are marked purchased.</p></div>', 'wide-card')}`;
  }

  const byConversion = conversion.byCategory ?? [];
  const conversionCard = card(`<p class="eyebrow">CONVERSION BY CATEGORY</p><h2>Saved products that were bought</h2>${byConversion.length ? bars(byConversion, { label: row => row.categoryName ?? row.categoryId, value: row => row.rate ?? 0, display: value => rate(value) }) : '<p class="muted">No products saved in this window.</p>'}<p class="muted">${byConversion.map(row => `${escape(row.categoryName ?? row.categoryId)}: ${number(row.purchased)}/${number(row.saved)}`).join(' · ')}</p>`, 'wide-card');

  const buckets = time.buckets ?? {};
  const timeCard = card(`<p class="eyebrow">TIME TO PURCHASE</p><h2>From saved to purchased</h2>${bars(BUCKETS.map(([key, label]) => ({ label, count: buckets[key] })), { label: row => row.label, value: row => row.count })}<p class="muted">${(time.byCategory ?? []).map(row => `${escape(row.categoryName ?? row.categoryId)}: median ${days(row.medianDays)} (${number(row.count)})`).join(' · ') || 'No purchases with both dates.'}${Number(time.skipped) ? ` · ${number(time.skipped)} skipped for inconsistent dates` : ''}</p>`);

  const weekdayCard = card(`<p class="eyebrow">WHEN THEY BUY · WEEKDAY</p><h2>Purchases per day</h2>${bars(when.byWeekday ?? [], { label: row => row.weekday, value: row => row.purchases, peaks: when.peakWeekday ?? [] })}<p class="muted">America/Bogota time</p>`);
  const times = (when.byTimeOfDay ?? []).map(row => ({ ...row, label: TIME_LABELS[row.timeOfDay] ?? row.timeOfDay }));
  const peakTimes = (when.peakTimeOfDay ?? []).map(key => TIME_LABELS[key] ?? key);
  const timeOfDayCard = card(`<p class="eyebrow">WHEN THEY BUY · TIME OF DAY</p><h2>Purchases per time of day</h2>${bars(times, { label: row => row.label, value: row => row.purchases, peaks: peakTimes })}`);

  const spendingRows = (spending.byCategory ?? []).map(row => `<tr><th scope="row">${escape(row.categoryName ?? row.categoryId)}</th><td>${number(row.purchases)}</td><td>${money(row.medianPrice)}</td><td>${money(row.averagePrice)}</td></tr>`).join('');
  const spendingCard = card(`<p class="eyebrow">SPENDING BY CATEGORY</p><h2>What purchases cost</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Category</th><th>Purchases</th><th>Median price</th><th>Average price</th></tr></thead><tbody>${spendingRows || '<tr><td colspan="4">No priced purchases.</td></tr>'}</tbody></table></div><p class="muted">Prices are what users saved, not confirmed checkout amounts.</p>`, 'wide-card');
  const brands = spending.topBrands ?? [];
  const brandsCard = card(`<p class="eyebrow">TOP BRANDS</p><h2>Most purchased brands</h2>${brands.length ? bars(brands, { label: row => row.brand, value: row => row.purchases }) : '<p class="muted">No brands recorded.</p>'}`);
  const repeatCard = card(`<p class="eyebrow">REPEAT BUYERS</p><h2>Purchases per buyer</h2>${bars([
    { label: 'One purchase', count: repeat.onePurchase },
    { label: 'Two to three', count: repeat.twoToThree },
    { label: 'Four or more', count: repeat.fourOrMore },
  ], { label: row => row.label, value: row => row.count })}<p class="muted">${number(repeat.buyers)} buyers in the window</p>`);

  return `${header}${windowPicker}${kpis}${conversionCard}<div class="two-col">${timeCard}${repeatCard}</div><div class="two-col">${weekdayCard}${timeOfDayCard}</div>${spendingCard}<div class="two-col">${brandsCard}</div>`;
}
