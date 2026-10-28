import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPurchaseSavings } from '../src/purchase-savings-view.js';

const sample = {
  purchases: 3,
  buyers: 2,
  referenceTotal: 400,
  paidTotal: 300,
  netSaved: 100,
  grossSaved: 120,
  overspent: 20,
  savingRate: 25,
  averageSavedPerPurchase: 33.33,
  averageSavedPerBuyer: 50,
  savedPurchases: 2,
  samePricePurchases: 0,
  overpaidPurchases: 1,
  byCategory: [
    { categoryId: 'tech', categoryName: '<Tech>', purchases: 2, netSaved: 120, savingRate: 40 },
    { categoryId: 'beauty', categoryName: 'Beauty', purchases: 1, netSaved: -20, savingRate: -20 },
  ],
  byPlatform: [
    { platform: 'android', purchases: 3, netSaved: 100 },
    { platform: 'ios', purchases: 0, netSaved: 0 },
  ],
  skipped: 1,
};

test('renders the answer, the outcome split and the categories', () => {
  const html = renderPurchaseSavings(sample);

  assert.match(html, /BQ · MIGUEL · TYPE 2/);
  assert.match(html, /Money saved on purchases/);
  assert.match(html, /\$100/);
  assert.match(html, /25\.0% of \$400 saved prices/);
  assert.match(html, /Paid less/);
  assert.match(html, /Paid more/);
  assert.match(html, /overspent \$20/);
  assert.match(html, /Android: \$100 saved/);
  assert.match(html, /1 events without a valid price were left out/);
});

test('shows overspending as a negative amount', () => {
  const html = renderPurchaseSavings(sample);

  assert.match(html, /-\$20/);
  assert.match(html, /-20\.0%/);
});

test('escapes category names from the backend', () => {
  const html = renderPurchaseSavings(sample);

  assert.match(html, /&lt;Tech&gt;/);
  assert.doesNotMatch(html, /<Tech>/);
});

test('explains the empty state when no purchase has a price paid', () => {
  const html = renderPurchaseSavings({ purchases: 0, buyers: 0, savingRate: null });

  assert.match(html, /No purchases with a price paid yet/);
  assert.match(html, /—/);
});
