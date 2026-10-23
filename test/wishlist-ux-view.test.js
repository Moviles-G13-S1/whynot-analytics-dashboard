import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWishlistUx } from '../src/wishlist-ux-view.js';

test('renders backend counts and escapes reason text', () => {
  const html = renderWishlistUx({ schemaVersion: 1, totalEvents: 4, actions: {
    delete: { total: 2, uniqueUsers: 1, outcomes: { success: 1, blocked: 1 }, successRate: 50, failureReasons: { nonempty: 1, '<unsafe>': 1 } },
  } });
  assert.match(html, /SUPPORTING VIEW · SANTIAGO/);
  assert.match(html, /50\.0%/);
  assert.match(html, /nonempty: 1/);
  assert.match(html, /&lt;unsafe&gt;/);
  assert.doesNotMatch(html, /<unsafe>/);
});
