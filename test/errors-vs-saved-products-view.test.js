import test from 'node:test';
import assert from 'node:assert/strict';

import {
  renderErrorsVsSavedProducts,
} from '../src/errors-vs-saved-products-view.js';


const data = {
  schemaVersion: 1,
  windowWeeks: 8,
  status: 'available',

  userCount: 3,
  totalErrors: 3,
  totalProducts: 3,

  averageErrorsPerUser: 1,
  averageProductsPerUser: 1,

  usersWithErrors: 2,
  usersWithoutErrors: 1,

  usersWithProducts: 2,
  usersWithoutProducts: 1,

  correlation: -1,

  points: [
    { errors: 0, products: 2 },
    { errors: 1, products: 1 },
    { errors: 2, products: 0 },
  ],
};


test('renders the business question and backend correlation', () => {
  const html = renderErrorsVsSavedProducts(data);

  assert.match(html, /PEARSON CORRELATION/);
  assert.match(html, /-1\.00/);
  assert.match(html, /USERS ANALYZED/);
  assert.match(html, /CAPTURED ERRORS/);
  assert.match(html, /SAVED PRODUCTS/);
  assert.match(html, /JULIANA/);
});


test('renders the scatter plot and its axes', () => {
  const html = renderErrorsVsSavedProducts(data);

  assert.match(html, /<svg/);
  assert.match(html, /Application errors per user/);
  assert.match(html, /Saved products per user/);

  const circles = html.match(/<circle\b/g) || [];

  assert.equal(circles.length, 3);
});


test('renders the three time window filters', () => {
  const html = renderErrorsVsSavedProducts(data);

  assert.match(html, /data-value="4"/);
  assert.match(html, /data-value="8"/);
  assert.match(html, /data-value="12"/);
  assert.match(html, /data-action="errorWeeks"/);
});


test('interprets a negative correlation', () => {
  const html = renderErrorsVsSavedProducts(data);

  assert.match(
    html,
    /Users with more recorded errors tend to have fewer saved products/
  );
});


test('interprets a positive correlation', () => {
  const html = renderErrorsVsSavedProducts({
    ...data,
    correlation: 0.85,
  });

  assert.match(html, /0\.85/);

  assert.match(
    html,
    /Users with more recorded errors tend to have more saved products/
  );
});


test('interprets zero correlation correctly', () => {
  const html = renderErrorsVsSavedProducts({
    ...data,
    correlation: 0,
  });

  assert.match(html, /0\.00/);
  assert.match(html, /little or no linear association/);
});


test('handles undefined correlation', () => {
  const html = renderErrorsVsSavedProducts({
    ...data,
    correlation: null,
    status: 'insufficient_variation',
  });

  assert.match(html, /N\/A/);
  assert.match(html, /not enough variation/);
  assert.doesNotMatch(html, /NaN|undefined/);
});


test('handles an empty database', () => {
  const html = renderErrorsVsSavedProducts({
    ...data,
    status: 'empty',

    userCount: 0,
    totalErrors: 0,
    totalProducts: 0,

    averageErrorsPerUser: 0,
    averageProductsPerUser: 0,

    usersWithErrors: 0,
    usersWithoutErrors: 0,

    usersWithProducts: 0,
    usersWithoutProducts: 0,

    correlation: null,
    points: [],
  });

  assert.match(html, /No registered users were found/);
  assert.match(html, /No user records available/);
  assert.doesNotMatch(html, /NaN|undefined/);
});


test('groups overlapping user observations', () => {
  const html = renderErrorsVsSavedProducts({
    ...data,
    points: [
      { errors: 1, products: 2 },
      { errors: 1, products: 2 },
      { errors: 1, products: 2 },
    ],
  });

  const circles = html.match(/<circle\b/g) || [];

  assert.equal(circles.length, 1);
  assert.match(html, /3 user\(s\)/);
});


test('explains the limitations of the metric', () => {
  const html = renderErrorsVsSavedProducts(data);

  assert.match(html, /Correlation does not imply causation/);
  assert.match(html, /Deleted products/);
  assert.match(html, /unrecorded errors/);
});
test('classifies correlation strength and direction', () => {
  const cases = [
    [-1.00, 'strong negative'],
    [-0.70, 'strong negative'],
    [-0.69, 'moderate negative'],
    [-0.30, 'moderate negative'],
    [-0.29, 'weak negative'],
    [-0.10, 'weak negative'],
    [-0.09, 'little or no linear association'],
    [0.00, 'little or no linear association'],
    [0.09, 'little or no linear association'],
    [0.10, 'weak positive'],
    [0.29, 'weak positive'],
    [0.30, 'moderate positive'],
    [0.69, 'moderate positive'],
    [0.70, 'strong positive'],
    [1.00, 'strong positive'],
  ];

  for (const [correlation, expected] of cases) {
    const html = renderErrorsVsSavedProducts({
      ...data,
      correlation,
    });

    assert.ok(
      html.includes(expected),
      `Unexpected interpretation for r=${correlation}`
    );
  }
});