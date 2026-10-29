import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWeeklyErrors } from '../src/weekly-errors-view.js';
import { loadAnalytics, clearAnalyticsCache } from '../src/analytics.js';

const data = { windowWeeks: 8, totalErrors: 3, currentWeekErrors: 2, previousWeekErrors: 1,
  weeks: [{ weekStart: '2026-10-19', label: '19 Oct', count: 1, barPercent: 50, partial: false },
    { weekStart: '2026-10-26', label: '26 Oct', count: 2, barPercent: 100, partial: true }],
  byFeature: [{ key: 'profile', count: 3 }], byCode: [{ key: 'network', count: 3 }],
  byPlatform: [{ key: 'ios', count: 3 }], bySource: [{ key: 'operation', count: 3 }] };

test('renders server-provided totals, weekly bars, scope and partial-week label', () => {
  const html = renderWeeklyErrors(data);
  assert.match(html, /America\/Bogota/);
  assert.match(html, /height:50%/);
  assert.match(html, /height:100%/);
  assert.match(html, /26 Oct<br>In progress/);
  assert.match(html, /Profile/); assert.match(html, /iOS/);
  assert.match(html, /data-action="errorWeeks" data-value="12"/);
});
test('empty data does not pretend that no failures happened', () => {
  const html = renderWeeklyErrors({ ...data, totalErrors: 0, currentWeekErrors: 0, previousWeekErrors: 0, weeks: [] });
  assert.match(html, /No errors recorded yet/);
  assert.match(html, /does not prove that no failures occurred/);
  assert.doesNotMatch(html, /NaN|undefined/);
});
test('escapes records and clamps unsafe CSS values', () => {
  const html = renderWeeklyErrors({ ...data, weeks: [{ ...data.weeks[0], weekStart: '"><img src=x>', label: '<script>', barPercent: 999 }], byFeature: [{ key: '<script>alert(1)</script>', count: 1 }] });
  assert.doesNotMatch(html, /<script>|<img src=x>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /height:100%/);
});
test('requests the shared metric and separates cached week filters', async () => {
  clearAnalyticsCache();
  const requests = [];
  const call = async request => { requests.push(request); return { data: { metric: 'weekly_app_errors', data } }; };
  await loadAnalytics(call, 'weekly_app_errors', { weeks: 4 });
  await loadAnalytics(call, 'weekly_app_errors', { weeks: 4 });
  await loadAnalytics(call, 'weekly_app_errors', { weeks: 8 });
  assert.deepEqual(requests, [{ metric: 'weekly_app_errors', params: { weeks: 4 } }, { metric: 'weekly_app_errors', params: { weeks: 8 } }]);
});
