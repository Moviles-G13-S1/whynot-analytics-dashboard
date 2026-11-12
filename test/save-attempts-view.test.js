import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSaveAttempts } from '../src/save-attempts-view.js';

const sample = {
  totalAttempts: 40,
  successes: 36,
  failures: 4,
  successRate: 90,
  platforms: [
    { platform: 'android', successes: 20, failures: 3 },
    { platform: 'ios', successes: 16, failures: 1 },
  ],
  failureReasons: [
    { reason: 'invalid_price', count: 3 },
    { reason: 'backend_error', count: 1 },
  ],
};

test('renders the success rate, the failures and the most common reason', () => {
  const html = renderSaveAttempts(sample);

  assert.match(html, /BQ TYPE 2 · MIGUEL · PRODUCT SAVE/);
  assert.match(html, /Product save attempts/);
  assert.match(html, /90\.0%/);
  assert.match(html, /36 of 40 attempts saved the product/);
  assert.match(html, /Most common reason: Invalid price \(3\)/);
});

test('keeps the backend order of the failure reasons with readable names', () => {
  const html = renderSaveAttempts(sample);

  assert.ok(html.indexOf('Invalid price') < html.indexOf('Backend error'));
  assert.doesNotMatch(html, />invalid_price</);
});

test('lists saved and failed attempts per platform', () => {
  const html = renderSaveAttempts(sample);

  assert.match(html, /<th scope="row">Android<\/th><td>20<\/td><td>3<\/td>/);
  assert.match(html, /<th scope="row">iOS<\/th><td>16<\/td><td>1<\/td>/);
});

test('escapes unknown reason codes from the backend', () => {
  const html = renderSaveAttempts({ ...sample, failureReasons: [{ reason: '<script>', count: 1 }] });

  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('explains the empty state when nobody has tried to save yet', () => {
  const html = renderSaveAttempts({ totalAttempts: 0, successes: 0, failures: 0, successRate: null, platforms: [], failureReasons: [] });

  assert.match(html, /No save attempts yet/);
  assert.match(html, /—/);
  assert.match(html, /No failures recorded/);
});
