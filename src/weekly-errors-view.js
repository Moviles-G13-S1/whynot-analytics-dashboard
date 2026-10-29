const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');
const labels = { auth: 'Authentication', home: 'Home', profile: 'Profile', runtime: 'Runtime', ios: 'iOS', android: 'Android', web: 'Web', network: 'Network', permission: 'Permission', unauthenticated: 'Session', not_found: 'Not found', rate_limited: 'Rate limited', timeout: 'Timeout', unexpected: 'Unexpected', operation: 'Operation', framework: 'Flutter framework', platform: 'Unhandled async' };
const card = body => `<section class="card">${body}</section>`;
function breakdown(title, items = []) {
  return card(`<h2>${escape(title)}</h2>${items.length ? `<dl class="error-breakdown">${items.map(item => `<div><dt>${escape(labels[item.key] ?? item.key)}</dt><dd>${number(item.count)}</dd></div>`).join('')}</dl>` : '<p class="muted">No captured errors in this period.</p>'}`);
}

// Counts and bar proportions are calculated by the secured backend metric.
export function renderWeeklyErrors(data) {
  const weeks = data.weeks ?? [];
  return `<section aria-label="Weekly application errors">
    <div class="segment-row">${[4, 8, 12].map(weeks => `<button class="pill ${data.windowWeeks === weeks ? 'active' : ''}" data-action="errorWeeks" data-value="${weeks}">${weeks} weeks</button>`).join('')}</div>
    <div class="kpis">
      ${card(`<p class="eyebrow">THIS WEEK · IN PROGRESS</p><div class="big">${number(data.currentWeekErrors)}</div><small>Captured technical errors since Monday</small>`)}
      ${card(`<p class="eyebrow">PREVIOUS FULL WEEK</p><div class="big">${number(data.previousWeekErrors)}</div><small>Monday to Sunday · Bogotá time</small>`)}
    </div>
    ${card(`<p class="eyebrow">TYPE 1 · JERÓNIMO</p><h2>How many errors does the app produce weekly?</h2><p class="muted">${number(data.totalErrors)} captured errors across ${number(data.windowWeeks)} calendar weeks · America/Bogota</p>
      ${Number(data.totalErrors) === 0 ? '<p class="muted" role="status">No errors recorded yet. Zero means no events were received for this period; it does not prove that no failures occurred.</p>' : ''}
      <div class="weekly-error-scroll"><div class="weekly-error-chart">${weeks.map(week => {
        const height = Math.min(100, Math.max(0, Number(week.barPercent) || 0));
        return `<div class="weekly-error-column"><strong>${number(week.count)}</strong><div class="weekly-error-track"><div class="weekly-error-bar ${week.partial ? 'partial' : ''}" style="height:${height}%" role="img" aria-label="Week starting ${escape(week.weekStart)}: ${number(week.count)} errors${week.partial ? ', partial week' : ''}"></div></div><small>${escape(week.label)}${week.partial ? '<br>In progress' : ''}</small></div>`;
      }).join('')}</div></div>`)}
    <div class="two-col">${breakdown('By feature', data.byFeature)}${breakdown('By error category', data.byCode)}</div>
    <div class="two-col">${breakdown('By platform', data.byPlatform)}${breakdown('By capture source', data.bySource)}</div>
  </section>`;
}
