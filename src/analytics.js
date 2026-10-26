// The backend computes every dashboard metric. Cache callable responses only
// for this signed-in browser session; Refresh and sign-out clear the cache.
const metricCache = new Map();

export function clearAnalyticsCache() {
  metricCache.clear();
}

export function loadAnalytics(callAnalytics, metric, params = {}) {
  const key = JSON.stringify([metric, params]);
  const cached = metricCache.get(key);
  if (cached) return cached;

  const pending = callAnalytics({ metric, params }).then(({ data }) => {
    if (data?.metric !== metric || !data.data || typeof data.data !== 'object') {
      throw new Error('Invalid analytics response.');
    }
    return data.data;
  });
  metricCache.set(key, pending);
  pending.catch(() => {
    if (metricCache.get(key) === pending) metricCache.delete(key);
  });
  return pending;
}

export function warmAnalyticsCache(callAnalytics) {
  return Promise.allSettled([
    loadAnalytics(callAnalytics, 'saved'),
    loadAnalytics(callAnalytics, 'recommended'),
    loadAnalytics(callAnalytics, 'purchased', { months: 6 }),
    loadAnalytics(callAnalytics, 'bq4', { months: 6 }),
    loadAnalytics(callAnalytics, 'demographic'),
    loadAnalytics(callAnalytics, 'bq6'),
    loadAnalytics(callAnalytics, 'wishlist_interactions'),
    loadAnalytics(callAnalytics, 'recommendation_home_opens'),
  ]);
}
