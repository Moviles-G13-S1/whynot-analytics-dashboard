// Home load time (Sprint 4 BQ, Miguel, Type 1): every figure arrives already
// calculated by get_admin_analytics (metric "home_load_time"); this view only
// formats it.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;

/** "2.76 s" for a duration in milliseconds, or "—" when there is none. */
const seconds = value => (value == null ? '—' : `${(Number(value) / 1000).toFixed(2)} s`);

const PLATFORMS = { android: 'Android', ios: 'iOS' };
const platformLabel = code => PLATFORMS[code] ?? escape(code);

function bars(rows) {
  const max = Math.max(1, ...rows.map(row => Number(row.averageMs) || 0));
  return rows.map(row => {
    const value = Number(row.averageMs) || 0;
    return `<div class="bq-rank-row"><span>${platformLabel(row.platform)}</span><div class="bq-track"><div style="width:${Math.max(0, value / max * 100)}%"></div></div><strong>${seconds(row.averageMs)}</strong></div>`;
  }).join('');
}

export function renderHomeLoadTime(data) {
  const d = data ?? {};
  const overall = d.overall ?? {};
  const platforms = d.platforms ?? [];

  const header = card(`<p class="eyebrow">BQ TYPE 1 · MIGUEL · APP TELEMETRY</p><h2>Home load time</h2><p class="muted">What is the average loading time of the Home screen per platform? Each app records how long Home takes from opening until its nearby store and recommendation have loaded. Type 1: it measures how the app performs, and it is the number the Home micro-optimization is judged by.</p>`, 'wide-card');

  const fastest = d.fastestPlatform ? `${platformLabel(d.fastestPlatform)} loads Home faster` : 'Needs loads from both apps to compare';
  const kpis = `<div class="kpis">${card(`<p class="eyebrow">AVERAGE HOME LOAD</p><div class="big">${seconds(overall.averageMs)}</div><small>${number(overall.loads)} loads · median ${seconds(overall.medianMs)}</small>`)}${card(`<p class="eyebrow">SLOW LOADS (P90)</p><div class="big">${seconds(overall.p90Ms)}</div><small>${fastest}</small>`)}</div>`;

  if (!Number(overall.loads)) {
    return `${header}${kpis}${card('<div class="empty"><h2>No Home loads recorded yet</h2><p>Loads appear once users open Home in the updated apps while online.</p></div>', 'wide-card')}`;
  }

  const averageCard = card(`<p class="eyebrow">AVERAGE PER PLATFORM</p><h2>The answer to the BQ</h2>${bars(platforms)}<p class="muted">The median and the 90th percentile show the typical and the slow loads; one cold Cloud Function or slow GPS fix pulls the average up.</p>`);

  const rows = platforms.map(row => `<tr><th scope="row">${platformLabel(row.platform)}</th><td>${number(row.loads)}</td><td>${seconds(row.averageMs)}</td><td>${seconds(row.medianMs)}</td><td>${seconds(row.p90Ms)}</td><td>${seconds(row.fastestMs)}</td><td>${seconds(row.slowestMs)}</td></tr>`).join('');
  const tableCard = card(`<p class="eyebrow">DETAIL</p><h2>Loads per platform</h2><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Platform</th><th>Loads</th><th>Average</th><th>Median</th><th>P90</th><th>Fastest</th><th>Slowest</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">Only loads that started online are recorded.${Number(d.ignoredEvents) ? ` ${number(d.ignoredEvents)} invalid events were left out.` : ''}</p>`);

  return `${header}${kpis}<div class="two-col">${averageCard}${tableCard}</div>`;
}
