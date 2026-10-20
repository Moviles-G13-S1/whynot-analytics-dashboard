import test from 'node:test';
import assert from 'node:assert/strict';

import {
  demographicSummary,
  purchasedSummary,
  recommendedSummary,
  savedSummary,
} from '../src/analytics.js';

test('saved products match the Flutter distribution and zero-product count', () => {
  const products = Array.from({ length: 6 }, (_, index) => [`p${index}`, { ownerId: 'a' }]);
  products.push(['p7', { ownerId: 'b' }]);
  const result = savedSummary(products, [['a', {}], ['b', {}], ['c', {}]]);
  assert.deepEqual(result.distributionCounts, [1, 1, 0, 0, 0]);
  assert.equal(result.zeroProductUsers, 1);
  assert.equal(result.averagePerActiveUser, 3.5);
});

test('BQ3 counts successful saved events after products are deleted', () => {
  const events = [
    ['saved', { eventType: 'recommendation_shown', savedAt: new Date(), savedProductId: 'deleted-product' }],
    ['shown', { eventType: 'recommendation_shown', savedAt: null }],
    ['partial', { eventType: 'recommendation_shown', savedAt: new Date() }],
    ['manual', { eventType: 'manual_save', savedAt: new Date(), savedProductId: 'p' }],
  ];
  assert.deepEqual(recommendedSummary(events), { total: 1 });
});

test('purchases use Bogota month boundaries', () => {
  const products = [
    ['one', { categoryId: 'fashion', purchased: true, purchasedAt: new Date('2026-10-01T02:00:00Z') }],
    ['two', { categoryId: 'fashion', purchased: false, purchasedAt: new Date('2026-10-02T00:00:00Z') }],
  ];
  const result = purchasedSummary(products, new Date('2026-10-20T12:00:00Z'), 6);
  assert.deepEqual(result.months.slice(-2), ['2026-09', '2026-10']);
  assert.deepEqual(result.monthlyTotals.slice(-2), [1, 0]);
});

test('demographics count unique owners and unknown cities', () => {
  const products = [
    ['p1', { ownerId: 'a', categoryId: 'fashion' }],
    ['p2', { ownerId: 'a', categoryId: 'fashion' }],
    ['p3', { ownerId: 'b', categoryId: 'fashion' }],
  ];
  const users = [
    ['a', { age: 20, gender: 'Female', cityId: 'bogota' }],
    ['b', { age: 30, gender: 'Male' }],
  ];
  const result = demographicSummary('fashion', products, users, [['bogota', { name: 'Bogotá' }]]);
  assert.equal(result.userCount, 2);
  assert.equal(result.medianAge, '25');
  assert.equal(result.cities[0].label, 'Bogotá');
  assert.equal(result.cities.at(-1).count, 1);
});
