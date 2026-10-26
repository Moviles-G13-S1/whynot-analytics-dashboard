import test from 'node:test';
import assert from 'node:assert/strict';

import { clearAnalyticsCache, loadAnalytics, warmAnalyticsCache } from '../src/analytics.js';

test('requests a processed backend metric with its filters', async () => {
  clearAnalyticsCache();
  const requests = [];
  const callable = async request => {
    requests.push(request);
    return { data: { metric: request.metric, data: { months: ['2026-10'] } } };
  };

  assert.deepEqual(await loadAnalytics(callable, 'purchased', { months: 12 }), { months: ['2026-10'] });
  assert.deepEqual(requests, [{ metric: 'purchased', params: { months: 12 } }]);
});

test('reuses a view result until Refresh clears the cache', async () => {
  clearAnalyticsCache();
  let calls = 0;
  const callable = async request => ({
    data: { metric: request.metric, data: { total: ++calls } },
  });

  assert.deepEqual(await loadAnalytics(callable, 'recommended'), { total: 1 });
  assert.deepEqual(await loadAnalytics(callable, 'recommended'), { total: 1 });
  assert.equal(calls, 1);
  clearAnalyticsCache();
  assert.deepEqual(await loadAnalytics(callable, 'recommended'), { total: 2 });
});

test('failed calls can be retried and malformed responses are rejected', async () => {
  clearAnalyticsCache();
  let calls = 0;
  const callable = async request => {
    calls++;
    if (calls === 1) throw new Error('temporary failure');
    return { data: { metric: request.metric, data: { total: 2 } } };
  };
  await assert.rejects(loadAnalytics(callable, 'recommended'));
  assert.deepEqual(await loadAnalytics(callable, 'recommended'), { total: 2 });
  clearAnalyticsCache();
  await assert.rejects(loadAnalytics(async () => ({ data: { metric: 'wrong', data: {} } }), 'recommended'));
});

test('preloads the default views from the callable', async () => {
  clearAnalyticsCache();
  const requests = [];
  const callable = async request => {
    requests.push(request);
    return { data: { metric: request.metric, data: {} } };
  };
  const results = await warmAnalyticsCache(callable);
  assert.ok(results.every(result => result.status === 'fulfilled'));
  assert.deepEqual(requests.map(request => request.metric), ['saved', 'recommended', 'purchased', 'bq4', 'demographic', 'bq6', 'wishlist_interactions', 'recommendation_home_opens']);
  assert.deepEqual(requests.find(request => request.metric === 'bq4').params, { months: 6 });
});

test('requests and caches exact BQ4 and BQ6 backend answers', async () => {
  clearAnalyticsCache();
  const requests = [];
  const callable = async request => {
    requests.push(request);
    return { data: { metric: request.metric, data: { categories: [], months: [] } } };
  };
  await loadAnalytics(callable, 'bq4', { months: 12 });
  await loadAnalytics(callable, 'bq4', { months: 12 });
  await loadAnalytics(callable, 'bq6');
  assert.deepEqual(requests, [
    { metric: 'bq4', params: { months: 12 } },
    { metric: 'bq6', params: {} },
  ]);
});
