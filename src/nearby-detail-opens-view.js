const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');
const decimal = value => (Number.isFinite(Number(value)) ? Number(value) : 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const platforms = { android: 'Android', ios: 'iOS' };
const card = body => `<section class="card">${body}</section>`;

// Distinct users per week and bar proportions come from the secured backend metric.
export function renderNearbyDetailOpens(data) {
  const weeks = data.weeks ?? [];
  const byPlatform = data.byPlatform ?? [];
  return `<section aria-label="Weekly nearby store detail opens">
    <div class="segment-row">${[4, 8, 12].map(value => `<button class="pill ${data.windowWeeks === value ? 'active' : ''}" data-action="errorWeeks" data-value="${value}">${value} weeks</button>`).join('')}</div>
    <div class="kpis">
      ${card(`<p class="eyebrow">THIS WEEK · IN PROGRESS</p><div class="big">${number(data.currentWeekUsers)}</div><small>Users who opened a nearby store's detail since Monday</small>`)}
      ${card(`<p class="eyebrow">PREVIOUS FULL WEEK</p><div class="big">${number(data.previousWeekUsers)}</div><small>Monday to Sunday · Bogotá time</small>`)}
      ${card(`<p class="eyebrow">WEEKLY AVERAGE</p><div class="big">${decimal(data.averageWeeklyUsers)}</div><small>${number(data.distinctUsersInWindow)} distinct users · ${number(data.totalOpens)} opens in the window</small>`)}
    </div>
    ${card(`<p class="eyebrow">TYPE 3 · JUAN FELIPE</p><h2>How many users open a nearby store's detail per week?</h2><p class="muted">Distinct users per calendar week across ${number(data.windowWeeks)} weeks · America/Bogota. A user who opens it several times in a week counts once.</p>
      ${!Number(data.totalOpens) ? '<p class="muted" role="status">No opens recorded yet in this period.</p>' : ''}
      <div class="weekly-error-scroll"><div class="weekly-error-chart">${weeks.map(week => {
        const height = Math.min(100, Math.max(0, Number(week.barPercent) || 0));
        return `<div class="weekly-error-column"><strong>${number(week.distinctUsers)}</strong><div class="weekly-error-track"><div class="weekly-error-bar ${week.partial ? 'partial' : ''}" style="height:${height}%" role="img" aria-label="Week starting ${escape(week.weekStart)}: ${number(week.distinctUsers)} users, ${number(week.opens)} opens${week.partial ? ', partial week' : ''}"></div></div><small>${escape(week.label)}${week.partial ? '<br>In progress' : ''}</small></div>`;
      }).join('')}</div></div>`)}
    ${card(`<h2>By platform</h2><dl class="error-breakdown">${byPlatform.map(item => `<div><dt>${escape(platforms[item.platform] ?? item.platform)}</dt><dd>${number(item.distinctUsers)}</dd></div>`).join('')}</dl>`)}
  </section>`;
}
