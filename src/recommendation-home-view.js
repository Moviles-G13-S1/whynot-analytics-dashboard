const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const count = value => Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');

function periodLabel(start, end) {
  const from = new Date(start);
  const to = new Date(end);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) return 'Last 30 days · UTC';
  const format = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  return `${format.format(from)} – ${format.format(to)} · UTC`;
}

export function renderRecommendationHome(data) {
  const numerator = Math.max(0, Math.trunc(Number(data.numerator) || 0));
  const denominator = Math.max(0, Math.trunc(Number(data.denominator) || 0));
  const rate = data.percentage == null ? null : Number(data.percentage);
  const percentage = Number.isFinite(rate) ? rate : null;
  const hasData = denominator > 0 && percentage !== null;
  const openedWidth = hasData ? Math.min(100, Math.max(0, percentage)) : 0;

  return `<section class="home-open-view" aria-label="Flutter Home recommendation detail opens">
    <div class="home-open-period"><span class="eyebrow">LAST 30 DAYS</span><span>${escape(periodLabel(data.periodStart, data.periodEnd))}</span></div>
    <div class="home-open-kpis">
      <div class="card home-open-kpi"><p class="eyebrow">OPEN RATE</p><div class="home-open-value">${hasData ? `${escape(percentage)}%` : '—'}</div><p class="muted">${hasData ? 'Visible cards opened in detail' : 'No data yet'}</p></div>
      <div class="card home-open-kpi"><p class="eyebrow">VISIBLE CARDS</p><div class="home-open-value">${count(denominator)}</div><p class="muted">Flutter Home displays</p></div>
      <div class="card home-open-kpi"><p class="eyebrow">DETAIL OPENS</p><div class="home-open-value">${count(numerator)}</div><p class="muted">Paired Home card taps</p></div>
    </div>
    ${hasData ? `<div class="card home-open-result"><div class="home-open-result-heading"><h2>From Home card to detail</h2><span>${count(numerator)} of ${count(denominator)} opened</span></div>
      <div class="home-open-track" role="img" aria-label="${count(numerator)} of ${count(denominator)} visible Home cards opened in detail, ${escape(percentage)} percent"><div class="home-open-filled" style="width:${openedWidth}%"></div></div>
      <div class="home-open-legend"><span><i class="home-open-key opened"></i>Opened ${escape(percentage)}%</span><span><i class="home-open-key not-opened"></i>Not opened ${escape(Math.max(0, 100 - percentage).toFixed(1).replace(/\.0$/, ''))}%</span></div>
    </div>` : `<div class="card home-open-empty" role="status"><div class="home-open-empty-icon" aria-hidden="true">↗</div><h2>No card displays recorded yet</h2><p>The open rate will appear after a recommendation card becomes visible on Flutter Home.</p></div>`}
    <details class="home-open-method"><summary>How this is calculated</summary><div class="home-open-method-body"><p>Distinct detail opens paired with visible Flutter Home cards ÷ distinct visible cards × 100. Each card exposure counts once; returning from detail can create a new exposure.</p><p>Events must arrive within the rolling 30-day UTC period. Offline or failed delivery can affect counts. Users may save from Home without opening details, so a low rate alone does not indicate a problem with the detail view.</p></div></details>
  </section>`;
}
