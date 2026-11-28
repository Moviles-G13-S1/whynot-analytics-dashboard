import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderProductCompleteness } from '../src/product-completeness-view.js';
import { clearAnalyticsCache, loadAnalytics } from '../src/analytics.js';

const sample = {
  totalProducts: 4,
  missingImageCount: 2, missingImagePercentage: 50,
  missingProductUrlCount: 2, missingProductUrlPercentage: 50,
  missingBothCount: 1, incompleteCount: 3, incompletePercentage: 75,
};

test('shows the union, individual percentages and overlap with their denominators', () => {
  const html = renderProductCompleteness(sample);
  assert.match(html, /BQ TYPE 2 · JERÓNIMO · SPRINT 4/);
  assert.match(html, /75\.0%/);
  assert.match(html, /3 of 4 current saved products/);
  assert.equal((html.match(/50\.0%/g) ?? []).length, 2);
  assert.equal((html.match(/2 of 4 products/g) ?? []).length, 2);
  assert.match(html, /MISSING BOTH<\/p><div class="big">1<\/div>/);
  assert.match(html, /only once in the overall percentage/);
});

test('distinguishes no saved products from products with complete fields', () => {
  const empty = renderProductCompleteness({ totalProducts: 0, incompletePercentage: null });
  assert.match(empty, /No saved products yet/);
  assert.match(empty, /<div class="big">—<\/div>/);
  assert.doesNotMatch(empty, /0\.0%/);
  const complete = renderProductCompleteness({ ...sample, incompleteCount: 0, incompletePercentage: 0, missingImageCount: 0, missingImagePercentage: 0, missingProductUrlCount: 0, missingProductUrlPercentage: 0, missingBothCount: 0 });
  assert.match(complete, /0\.0%/);
  assert.doesNotMatch(complete, /No saved products yet/);
});

test('renders backend percentages without recalculating them', () => {
  const html = renderProductCompleteness({ ...sample, incompletePercentage: 12.34 });
  assert.match(html, /12\.3%/);
  assert.match(html, /Any non-empty text counts as present/);
});

test('loads the new metric through the shared callable and session cache', async () => {
  clearAnalyticsCache();
  const calls = [];
  const callable = async request => {
    calls.push(request);
    return { data: { metric: 'product_completeness', data: sample } };
  };
  assert.equal(await loadAnalytics(callable, 'product_completeness'), sample);
  assert.equal(await loadAnalytics(callable, 'product_completeness'), sample);
  assert.deepEqual(calls, [{ metric: 'product_completeness', params: {} }]);
  clearAnalyticsCache();
});

test('registers the Sprint 4 view and supports initial and hash-change routes', () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const sprint4 = source.slice(source.indexOf("['SPRINT 4'"), source.indexOf("['SUPPORT VIEWS'"));
  assert.match(sprint4, /\['product_completeness', 'Product completeness'/);
  assert.match(source, /product_completeness: renderProductCompleteness/);
  const routes = [...source.matchAll(/location\.hash\.match\((\/.*?\/)\)/g)];
  assert.equal(routes.length, 2);
  for (const [, literal] of routes) {
    const route = new RegExp(literal.slice(1, -1));
    assert.equal('#/product_completeness'.match(route)?.[1], 'product_completeness');
  }
});
