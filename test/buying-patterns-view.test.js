import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBuyingPatterns } from '../src/buying-patterns-view.js';

const sample = {
  monthsWindow: 6,
  totalPurchases: 3,
  undatedPurchases: 1,
  conversion: {
    savedInWindow: 5, purchasedOfThose: 3, rate: 0.6,
    byCategory: [
      { categoryId: 'beauty', categoryName: 'Beauty', saved: 1, purchased: 1, rate: 1 },
      { categoryId: 'tech', categoryName: '<Tech>', saved: 3, purchased: 2, rate: 0.6667 },
    ],
  },
  timeToPurchase: {
    medianDays: 0.9, averageDays: 3.1, measured: 3, skipped: 1,
    buckets: { sameDay: 2, oneToSevenDays: 0, eightToThirtyDays: 1, overThirtyDays: 0 },
    byCategory: [{ categoryId: 'tech', categoryName: 'Technology', medianDays: 4.6, count: 2 }],
  },
  whenTheyBuy: {
    byWeekday: [{ weekday: 'Mon', purchases: 0 }, { weekday: 'Fri', purchases: 2 }],
    byTimeOfDay: [{ timeOfDay: 'morning', purchases: 1 }, { timeOfDay: 'night', purchases: 2 }],
    peakWeekday: ['Fri'],
    peakTimeOfDay: ['night'],
  },
  spending: {
    byCategory: [{ categoryId: 'tech', categoryName: 'Technology', purchases: 2, medianPrice: 250000, averagePrice: 250000 }],
    topBrands: [{ brand: 'Sony <b>', purchases: 2 }],
  },
  repeatBuyers: { buyers: 2, onePurchase: 1, twoToThree: 1, fourOrMore: 0, repeatRate: 0.5 },
};

test('renders the KPIs and every section from the backend answer', () => {
  const html = renderBuyingPatterns(sample, 6);

  assert.match(html, /BQ · JUAN FELIPE · TYPE \* \(2\/4\)/);
  assert.match(html, /Buying patterns of purchased products/);
  assert.match(html, /60\.0%/);
  assert.match(html, /0\.9 days/);
  assert.match(html, /50\.0%/);
  assert.match(html, /1 purchased products have no date/);
  assert.match(html, /Same day/);
  assert.match(html, /Fri<\/strong>/);
  assert.match(html, /2 · peak/);
  assert.match(html, /\$250,000/);
  assert.match(html, /1 skipped for inconsistent dates/);
  assert.match(html, /class="pill active" data-action="months" data-value="6"/);
});

test('escapes category and brand names', () => {
  const html = renderBuyingPatterns(sample, 6);

  assert.match(html, /&lt;Tech&gt;/);
  assert.match(html, /Sony &lt;b&gt;/);
  assert.doesNotMatch(html, /<Tech>/);
  assert.doesNotMatch(html, /Sony <b>/);
});

test('shows an em dash for null values', () => {
  const html = renderBuyingPatterns({
    ...sample,
    conversion: { ...sample.conversion, rate: null },
    timeToPurchase: { ...sample.timeToPurchase, medianDays: null, averageDays: null },
    repeatBuyers: { ...sample.repeatBuyers, repeatRate: null },
    spending: { byCategory: [{ categoryId: 'tech', purchases: 1, medianPrice: null, averagePrice: null }], topBrands: [] },
  }, 12);

  assert.match(html, /<div class="big">—<\/div>/);
  assert.match(html, /<td>—<\/td>/);
  assert.match(html, /No brands recorded/);
});

test('an empty or missing payload shows the empty state without crashing', () => {
  for (const payload of [{}, null, { totalPurchases: 0, conversion: { savedInWindow: 0 } }]) {
    const html = renderBuyingPatterns(payload, 24);
    assert.match(html, /No purchases in this window/);
    assert.match(html, /data-value="24"/);
  }
});
