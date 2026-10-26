import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderRecommendationHome } from '../src/recommendation-home-view.js';

describe('Home recommendation metric view', () => {
  it('shows the backend percentage, counts, and period', () => {
    const html = renderRecommendationHome({ numerator: 2, denominator: 5, percentage: 40,
      periodStart: '2026-09-26T00:00:00+00:00', periodEnd: '2026-10-26T00:00:00+00:00' });
    assert.match(html, /40%/);
    assert.match(html, /2 of 5 opened/);
    assert.match(html, /width:40%/);
    assert.match(html, /Not opened 60%/);
    assert.match(html, /Sep 26, 2026 – Oct 26, 2026 · UTC/);
    assert.match(html, /How this is calculated/);
  });
  it('shows a restrained empty state instead of a zero-percent chart', () => {
    const html = renderRecommendationHome({ numerator: 0, denominator: 0, percentage: null,
      periodStart: '2026-09-26T00:00:00+00:00', periodEnd: '2026-10-26T00:00:00+00:00' });
    assert.match(html, /No card displays recorded yet/);
    assert.match(html, /OPEN RATE<\/p><div class="home-open-value">—/);
    assert.doesNotMatch(html, /home-open-track/);
  });
  it('does not trust invalid dates or nonnumeric percentages', () => {
    const html = renderRecommendationHome({ numerator: 0, denominator: 0, percentage: '<script>',
      periodStart: '<script>', periodEnd: 'today' });
    assert.match(html, /Last 30 days · UTC/);
    assert.doesNotMatch(html, /<script>/);
  });
});
