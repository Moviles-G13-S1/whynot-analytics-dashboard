import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStoreDomains } from '../src/store-domains-view.js';

const sample = {
  totalProducts: 7,
  linkedProducts: 5,
  withoutLink: 1,
  invalidLink: 1,
  linkCoverage: 71.4,
  distinctStores: 3,
  knownStores: 2,
  limit: 10,
  stores: [
    { domain: 'zara.com', name: 'ZARA', knownStore: true, products: 3, users: 2, purchased: 1, purchasedPercentage: 33.3, share: 60 },
    { domain: 'amazon.com', name: 'amazon.com', knownStore: false, products: 1, users: 1, purchased: 0, purchasedPercentage: 0, share: 20 },
  ],
  otherStores: { stores: 1, products: 1 },
  categoryLeaders: [
    { categoryId: 'fashion', categoryName: 'Fashion', products: 1, stores: [{ domain: 'hm.com', name: 'H&M' }, { domain: 'zara.com', name: 'ZARA' }] },
  ],
};

test('shows the top store, link coverage and the BQ label', () => {
  const html = renderStoreDomains(sample);

  assert.match(html, /BQ TYPE 4 · SANTIAGO · SPRINT 4/);
  assert.match(html, /Which online stores appear most in saved products\?/);
  assert.match(html, /<div class="bq-leader">ZARA<\/div>/);
  assert.match(html, /3 products · 2 users · 60\.0% of linked products/);
  assert.match(html, /71\.4%/);
  assert.match(html, /5 of 7 current products have a store link · 3 distinct stores/);
});

test('ranks stores in backend order with the domain under known store names', () => {
  const html = renderStoreDomains(sample);

  assert.ok(html.indexOf('ZARA<br><small>zara.com</small>') < html.indexOf('<span>amazon.com</span>'));
  assert.match(html, /Plus 1 more stores with 1 products\./);
  assert.match(html, /<th scope="row">ZARA<\/th><td>zara\.com<\/td><td>3<\/td><td>2<\/td><td>1<\/td><td>33\.3%<\/td>/);
});

test('lists category leaders with ties and escapes store names', () => {
  const html = renderStoreDomains(sample);

  assert.match(html, /<th scope="row">Fashion<\/th><td>H&amp;M, ZARA<\/td><td>1<\/td>/);
  const hostile = renderStoreDomains({ ...sample, stores: [{ ...sample.stores[0], name: '<img src=x>' }] });
  assert.doesNotMatch(hostile, /<img src=x>/);
  assert.match(hostile, /&lt;img src=x&gt;/);
});

test('reports products without a usable link apart from the ranking', () => {
  const html = renderStoreDomains(sample);

  assert.match(html, /<span>No link<\/span>.*?<strong>1<\/strong>/s);
  assert.match(html, /<span>Unusable link<\/span>.*?<strong>1<\/strong>/s);
});

test('explains the empty state without claiming a top store', () => {
  const html = renderStoreDomains({ totalProducts: 4, linkedProducts: 0, withoutLink: 4, invalidLink: 0, linkCoverage: 0, distinctStores: 0, stores: [], otherStores: { stores: 0, products: 0 }, categoryLeaders: [] });

  assert.match(html, /No product links yet/);
  assert.match(html, /<div class="bq-leader">—<\/div>/);
  assert.match(html, /0\.0%/);
  assert.doesNotMatch(html, /Saved products per store/);
});

test('treats a missing coverage as no data', () => {
  const html = renderStoreDomains({ totalProducts: 0, linkedProducts: 0, linkCoverage: null });

  assert.match(html, /<div class="big">—<\/div>/);
});
