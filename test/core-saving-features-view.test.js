import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  renderCoreSavingFeatures,
} from '../src/core-saving-features-view.js';


function sampleData(overrides = {}) {
  return {
    schemaVersion: 1,
    features: [
      {
        id: 'wishlist',
        label: 'Create Wishlist',
        count: 15,
      },
      {
        id: 'manual_product',
        label: 'Add Product Manually',
        count: 24,
      },
      {
        id: 'recommended_product',
        label: 'Save Recommended Product',
        count: 9,
      },
    ],
    highestCount: 24,
    leaders: ['manual_product'],
    status: 'leader',
    totalCurrentProducts: 33,
    unclassifiedProducts: 0,
    classificationComplete: true,
    ...overrides,
  };
}


describe('Core saving features view', () => {

  it('shows the backend counts and leading feature', () => {
    const html = renderCoreSavingFeatures(sampleData());

    assert.match(html, /Create Wishlist/);
    assert.match(html, /Add Product Manually/);
    assert.match(html, /Save Recommended Product/);

    assert.match(html, /15/);
    assert.match(html, /24/);
    assert.match(html, /9/);

    assert.match(html, /Leads with 24 current saved records/);
    assert.match(html, /Total current products: 33/);
    assert.match(html, /width:100\.0%/);
    assert.match(html, /width:37\.5%/);
  });

  it('displays ties returned by the backend', () => {
    const html = renderCoreSavingFeatures(sampleData({
      highestCount: 15,
      leaders: ['wishlist', 'manual_product'],
      status: 'tie',
      features: [
        { id: 'wishlist', label: 'Create Wishlist', count: 15 },
        { id: 'manual_product', label: 'Add Product Manually', count: 15 },
        { id: 'recommended_product', label: 'Save Recommended Product', count: 9 },
      ],
    }));

    assert.match(html, /Create Wishlist &amp; Add Product Manually/);
    assert.match(html, /tied with 15 records each/);
  });

  it('shows an empty state when no records exist', () => {
    const html = renderCoreSavingFeatures(sampleData({
      features: [
        { id: 'wishlist', label: 'Create Wishlist', count: 0 },
        { id: 'manual_product', label: 'Add Product Manually', count: 0 },
        { id: 'recommended_product', label: 'Save Recommended Product', count: 0 },
      ],
      highestCount: 0,
      leaders: [],
      status: 'empty',
      totalCurrentProducts: 0,
    }));

    assert.match(html, /No classified saving records yet/);
    assert.doesNotMatch(html, /Leads with/);
  });

  it('warns about unclassified products', () => {
    const html = renderCoreSavingFeatures(sampleData({
      unclassifiedProducts: 3,
      classificationComplete: false,
      totalCurrentProducts: 36,
    }));

    assert.match(html, /PROVISIONAL RESULT/);
    assert.match(html, /Some products could not be classified/);
    assert.match(html, /3 current products/);
  });

  it('escapes labels and handles invalid data', () => {
    const html = renderCoreSavingFeatures(sampleData({
      features: [
        {
          id: 'wishlist',
          label: '<script>alert(1)</script>',
          count: 15,
        },
        {
          id: 'manual_product',
          label: 'Manual',
          count: -4,
        },
        {
          id: 'recommended_product',
          label: 'Recommended',
          count: 9,
        },
      ],
      leaders: ['wishlist'],
    }));

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /—/);

    const missing = renderCoreSavingFeatures(null);
    assert.match(missing, /Core saving data unavailable/);
  });

});