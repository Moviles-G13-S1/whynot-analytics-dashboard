// Display BQ3 values exactly as calculated by get_admin_analytics.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const pill = (label, active, value) => `<button class="pill ${active ? 'active' : ''}" data-action="view" data-value="${value}">${label}</button>`;

export function renderBq3(data) {
  const navigation = `<div class="segment-row">${pill('BQ1 · Saved products', false, 'saved')}${pill('BQ3 · Recommended saves', true, 'recommended')}</div>`;
  const explanation = `<div class="explanation"><div class="section-heading"><h2>How many recommended products have been saved?</h2></div><p>These are successful saves from the recommendation feature. Manual saves are excluded. The all-time count stays the same if a saved product is later deleted.</p></div>`;
  const total = card(`<p class="eyebrow">BQ3 · RECOMMENDED PRODUCTS SAVED</p><div class="big">${number(data.total)}</div><small>All-time successful saves</small>`, 'metric-card');

  // Older deployed functions return only { total }; keep that view usable.
  if (!Array.isArray(data.monthlySaves)) return `${navigation}${total}${explanation}`;

  const summary = `<div class="kpis">
    ${total}
    ${card(`<p class="eyebrow">RECOMMENDATIONS SHOWN</p><div class="big">${number(data.recommendationsShown)}</div><small>All-time recommendation events</small>`)}
  </div><div class="kpis">
    ${card(`<p class="eyebrow">SAVE RATE</p><div class="big">${escape(data.saveRatePercent)}%</div><small>Successful saves divided by recommendations shown</small>`)}
    ${card(`<p class="eyebrow">DISTINCT SAVERS</p><div class="big">${number(data.distinctSavers)}</div><small>Users who saved at least one recommendation</small>`)}
  </div>`;
  const months = data.monthlySaves.map(month => `<div class="bq-rank-row"><span>${escape(month.label)}</span><div class="bq-track"><div style="width:${Number(month.barPercent)}%"></div></div><strong>${number(month.count)}</strong></div>`).join('');
  const history = card(`<p class="eyebrow">BQ3 · MONTHLY SAVES</p><h2>Last six months</h2><p class="muted">Successful recommendation saves by save date · America/Bogota</p><div class="bq-breakdown">${months}</div><p class="muted">${number(data.undatedSaves)} all-time saves have no usable date and are excluded from this chart.</p>`, 'wide-card');

  return `${navigation}${summary}${history}${explanation}`;
}
