import test from 'node:test';
import assert from 'node:assert/strict';
import { renderNearbyDetailOpens } from '../src/nearby-detail-opens-view.js';

const data = { windowWeeks: 4, currentWeekUsers: 3, previousWeekUsers: 2, averageWeeklyUsers: 1.25,
  distinctUsersInWindow: 4, totalOpens: 9,
  weeks: [{ weekStart: '2026-11-16', label: '16 Nov', distinctUsers: 2, opens: 4, barPercent: 66.67, partial: false },
    { weekStart: '2026-11-23', label: '23 Nov', distinctUsers: 3, opens: 5, barPercent: 100, partial: true }],
  byPlatform: [{ platform: 'android', distinctUsers: 3 }, { platform: 'ios', distinctUsers: 1 }] };

test('renders weekly distinct users, KPIs, platforms and the window selector', () => {
  const html = renderNearbyDetailOpens(data);
  assert.match(html, /How many users open a nearby store's detail per week\?/);
  assert.match(html, /TYPE 3 · JUAN FELIPE/);
  assert.match(html, /height:66.67%/);
  assert.match(html, /height:100%/);
  assert.match(html, /23 Nov<br>In progress/);
  assert.match(html, /Android/); assert.match(html, /iOS/);
  assert.match(html, /1.25/);
  assert.match(html, /data-action="errorWeeks" data-value="12"/);
});

test('an empty period says so without NaN or undefined', () => {
  const html = renderNearbyDetailOpens({ windowWeeks: 4, weeks: [], byPlatform: [] });
  assert.match(html, /No opens recorded yet/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('escapes labels and clamps unsafe bar heights', () => {
  const html = renderNearbyDetailOpens({ ...data, weeks: [{ ...data.weeks[0], label: '<script>', barPercent: 999 }],
    byPlatform: [{ platform: '<img src=x>', distinctUsers: 1 }] });
  assert.doesNotMatch(html, /<script>|<img src=x>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /height:100%/);
});
