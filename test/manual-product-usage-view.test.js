import test from 'node:test';
import assert from 'node:assert/strict';
import { renderManualProductUsage } from '../src/manual-product-usage-view.js';

test('shows backend percentage and explains current-record scope', () => {
  const html = renderManualProductUsage({ manualPercentage: 66.7, manualProducts: 2,
    recommendedProducts: 1, classifiedProducts: 3, totalCurrentProducts: 4, unclassifiedProducts: 1 });
  assert.match(html, /66.7%/);
  assert.match(html, /Of 3 classified current products/);
  assert.match(html, /not historical action frequency/);
  assert.match(html, /Excluded from the percentage/);
});

test('empty input does not claim zero percent usage', () => {
  const html = renderManualProductUsage({ manualPercentage: null, classifiedProducts: 0 });
  assert.match(html, /—/);
  assert.match(html, /No classified products yet/);
  assert.doesNotMatch(html, /0.0%/);
});
