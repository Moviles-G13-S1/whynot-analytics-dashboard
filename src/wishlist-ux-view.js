// Supporting view: values are calculated by get_admin_analytics.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const count = value => Number(value || 0).toLocaleString('en-US');

export function renderWishlistUx(data) {
  const actions = data.actions ?? {};
  const labels = {
    create_form_open: 'Create form opened', create_form_cancel: 'Create form canceled',
    create: 'Wishlist created', open: 'Wishlist opened', edit: 'Presentation edited', delete: 'Delete attempted',
  };
  const rows = Object.entries(labels).map(([action, label]) => {
    const row = actions[action] ?? {};
    const outcomes = row.outcomes ?? {};
    const reasons = Object.entries(row.failureReasons ?? {}).map(([reason, total]) => `${escape(reason)}: ${count(total)}`).join(' · ') || '—';
    return `<tr><th scope="row">${label}</th><td>${count(row.total)}</td><td>${count(row.uniqueUsers)}</td><td>${count(outcomes.success)}</td><td>${count(outcomes.failure)}</td><td>${count(outcomes.blocked)}</td><td>${row.successRate == null ? '—' : `${Number(row.successRate).toFixed(1)}%`}</td><td>${reasons}</td></tr>`;
  }).join('');
  return `<section class="card wide-card"><p class="eyebrow">SUPPORTING VIEW · SANTIAGO · WISHLIST UX</p><h2>Deliberate wishlist interactions</h2><p class="muted">Counts come from wishlistInteractionEvents. Opens are taps, not screen rebuilds. Success rates use completed create, edit, and delete outcomes; blocked deletes are included in attempts.</p><div style="overflow-x:auto"><table class="ux-table"><thead><tr><th>Action</th><th>Events</th><th>Users</th><th>Success</th><th>Failure</th><th>Blocked</th><th>Success rate</th><th>Failure reasons</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">${count(data.totalEvents)} deduplicated events · schema v${escape(data.schemaVersion ?? 1)}</p></section>`;
}
