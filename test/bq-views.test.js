import test from 'node:test';
import assert from 'node:assert/strict';

import { renderBq4, renderBq6 } from '../src/bq-views.js';

test('BQ4 shows the backend winners, including ties and undated purchases', () => {
  const html = renderBq4({
    monthsWindow: 6,
    totalPurchases: 5,
    undatedPurchases: 1,
    overallTopCategoryNames: ['Beauty', 'Technology'],
    months: [{
      label: 'Oct 2026', totalPurchases: 5,
      topCategoryNames: ['Beauty', 'Technology'], topCategoryPurchases: 2,
      byCategory: [
        { categoryName: 'Beauty', purchases: 2 },
        { categoryName: 'Technology', purchases: 2 },
        { categoryName: 'Home', purchases: 1 },
      ],
    }],
  }, 6);
  assert.match(html, /BQ4 · TOP CATEGORY IN THE WINDOW/);
  assert.match(html, /Beauty · Technology/);
  assert.match(html, /TIED TOP CATEGORIES/);
  assert.match(html, /1 purchased products have no date/);
  assert.match(html, /Oct 2026/);
});

test('BQ4 and BQ6 have useful empty states', () => {
  assert.match(renderBq4({ months: [], totalPurchases: 0, undatedPurchases: 0, overallTopCategoryNames: [] }, 12), /No dated purchases/);
  assert.match(renderBq6({ categories: [], totalBuyers: 0, profilesWithoutCity: 0 }), /No buyer profiles yet/);
});

test('BQ6 displays purchased-buyer profiles by category and escapes names', () => {
  const html = renderBq6({
    totalBuyers: 4,
    profilesWithoutCity: 1,
    categories: [{
      categoryId: 'tech', categoryName: '<Technology>', buyers: 3, medianAge: 27,
      ageGroups: [{ label: '25–34', userCount: 2 }],
      genders: [{ gender: 'Female', userCount: 2, percentage: 66.6667 }],
      topCities: [{ cityId: 'bogota', cityName: 'Bogotá', userCount: 2 }],
    }],
  }, 'tech');
  assert.match(html, /BQ6 · DISTINCT BUYERS/);
  assert.match(html, /&lt;Technology&gt;/);
  assert.doesNotMatch(html, /<Technology>/);
  assert.match(html, /distinct buyers in this category/);
  assert.match(html, /Median age|MEDIAN AGE/);
  assert.match(html, /66\.7%/);
  assert.match(html, /Bogotá/);
});
