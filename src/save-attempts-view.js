// Product-save attempts (Sprint 2 BQ Type 2, Miguel): every figure arrives
// already calculated by get_admin_analytics (metric "save_attempts"); this view
// only formats it.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const percent = value => (value == null ? '—' : `${Number(value).toFixed(1)}%`);

/** Readable names for the reason codes the Kotlin and Flutter clients record. */
const REASONS = {
  missing_name: 'Missing name',
  invalid_name: 'Invalid name',
  missing_brand: 'Missing brand',
  invalid_brand: 'Invalid brand',
  invalid_price: 'Invalid price',
  negative_price: 'Negative price',
  invalid_link: 'Invalid link',
  missing_wishlist: 'No wishlist selected',
  offline: 'Offline',
  backend_error: 'Backend error',
  unknown: 'Unknown',
};
const reasonLabel = code => REASONS[code] ?? code;

const PLATFORMS = { android: 'Android', ios: 'iOS', web: 'Web' };
const platformLabel = code => PLATFORMS[code] ?? (code || 'Unknown');

function bars(rows, { label, value }) {
  const max = Math.max(1, ...rows.map(row => Number(value(row)) || 0));
  return rows.map(row => {
    const amount = Number(value(row)) || 0;
    return `<div class="bq-rank-row"><span>${escape(label(row))}</span><div class="bq-track"><div style="width:${Math.max(0, amount / max * 100)}%"></div></div><strong>${number(amount)}</strong></div>`;
  }).join('');
}

export function renderSaveAttempts(data) {
  const d = data ?? {};
  const reasons = d.failureReasons ?? [];
  const topReason = reasons[0];

  const header = card(`<p class="eyebrow">BQ TYPE 2 · MIGUEL · PRODUCT SAVE</p><h2>Product save attempts</h2><p class="muted">How often does saving a product work, and why does it fail? Every time a user tries to save a product, the app records whether it was saved and, if not, the reason. Type 2: it shows where the save flow frustrates users so the form can be improved.</p>`, 'wide-card');

  const kpis = `<div class="kpis">${card(`<p class="eyebrow">SUCCESS RATE</p><div class="big">${percent(d.successRate)}</div><small>${number(d.successes)} of ${number(d.totalAttempts)} attempts saved the product</small>`)}${card(`<p class="eyebrow">FAILED ATTEMPTS</p><div class="big">${number(d.failures)}</div><small>${topReason ? `Most common reason: ${escape(reasonLabel(topReason.reason))} (${number(topReason.count)})` : 'No failures recorded'}</small>`)}</div>`;

  if (!Number(d.totalAttempts)) {
    return `${header}${kpis}${card('<div class="empty"><h2>No save attempts yet</h2><p>Attempts appear once users try to save a product in the mobile apps.</p></div>', 'wide-card')}`;
  }

  const reasonCard = card(`<p class="eyebrow">WHY SAVING FAILS</p><h2>Failure reasons</h2>${reasons.length ? bars(reasons, { label: row => reasonLabel(row.reason), value: row => row.count }) : '<p class="muted">No failures recorded.</p>'}<p class="muted">Validation reasons come from the form; "Backend error" means Firestore rejected or could not complete the write.</p>`);

  const platformRows = (d.platforms ?? []).map(row => `<tr><th scope="row">${escape(platformLabel(row.platform))}</th><td>${number(row.successes)}</td><td>${number(row.failures)}</td></tr>`).join('');
  const platformCard = card(`<p class="eyebrow">BY PLATFORM</p><h2>Saved and failed per app</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Platform</th><th>Saved</th><th>Failed</th></tr></thead><tbody>${platformRows || '<tr><td colspan="3">No platforms recorded.</td></tr>'}</tbody></table></div><p class="muted">Android records every validation reason; iOS records saved products and backend errors.</p>`);

  return `${header}${kpis}<div class="two-col">${reasonCard}${platformCard}</div>`;
}
