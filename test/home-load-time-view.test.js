import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHomeLoadTime } from '../src/home-load-time-view.js';

const stats = (loads, averageMs, extra = {}) => ({ loads, averageMs, medianMs: averageMs, p90Ms: averageMs, fastestMs: averageMs, slowestMs: averageMs, ...extra });

const sample = {
  screen: 'home',
  overall: stats(3, 2400, { medianMs: 2000, p90Ms: 3200 }),
  platforms: [
    { platform: 'android', ...stats(2, 2759) },
    { platform: 'ios', ...stats(1, 1500) },
  ],
  fastestPlatform: 'ios',
  ignoredEvents: 2,
};

test('renders the average per platform as the answer', () => {
  const html = renderHomeLoadTime(sample);

  assert.match(html, /BQ TYPE 1 · MIGUEL/);
  assert.match(html, /Home load time/);
  assert.match(html, /2\.40 s/);
  assert.match(html, /<th scope="row">Android<\/th><td>2<\/td><td>2\.76 s<\/td>/);
  assert.match(html, /iOS loads Home faster/);
  assert.match(html, /2 invalid events were left out/);
});

test('shows a dash for a platform without loads', () => {
  const html = renderHomeLoadTime({
    ...sample,
    platforms: [{ platform: 'android', ...stats(3, 2400) }, { platform: 'ios', ...stats(0, null) }],
    fastestPlatform: null,
  });

  assert.match(html, /<th scope="row">iOS<\/th><td>0<\/td><td>—<\/td>/);
  assert.match(html, /Needs loads from both apps to compare/);
});

test('explains the empty state', () => {
  const html = renderHomeLoadTime({ overall: stats(0, null), platforms: [] });

  assert.match(html, /No Home loads recorded yet/);
});

test('escapes unknown platform codes', () => {
  const html = renderHomeLoadTime({ ...sample, platforms: [{ platform: '<x>', ...stats(1, 100) }] });

  assert.match(html, /&lt;x&gt;/);
  assert.doesNotMatch(html, /<x>/);
});
