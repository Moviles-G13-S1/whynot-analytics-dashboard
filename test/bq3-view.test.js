import test from 'node:test';
import assert from 'node:assert/strict';

import { renderBq3 } from '../src/bq3-view.js';

test('BQ3 displays backend totals, rate, and monthly bar values without deriving them', () => {
  const html = renderBq3({
    total: 3,
    recommendationsShown: 8,
    saveRatePercent: 37.5,
    distinctSavers: 2,
    undatedSaves: 1,
    monthlySaves: [
      { month: '2026-09', label: 'Sep 2026', count: 1, barPercent: 50 },
      { month: '2026-10', label: 'Oct 2026', count: 2, barPercent: 100 },
    ],
  });

  assert.match(html, /BQ3 · RECOMMENDED PRODUCTS SAVED.*?3/s);
  assert.match(html, /RECOMMENDATIONS SHOWN.*?8/s);
  assert.match(html, /SAVE RATE.*?37\.5%/s);
  assert.match(html, /DISTINCT SAVERS.*?2/s);
  assert.match(html, /Sep 2026.*?width:50%.*?1/s);
  assert.match(html, /Oct 2026.*?width:100%.*?2/s);
  assert.match(html, /Undated successful saves: 1/);
});

test('BQ3 keeps the all-time total visible while older backends return only total', () => {
  const html = renderBq3({ total: 3 });
  assert.match(html, /BQ3 · RECOMMENDED PRODUCTS SAVED.*?3/s);
  assert.doesNotMatch(html, /SAVE RATE/);
});
