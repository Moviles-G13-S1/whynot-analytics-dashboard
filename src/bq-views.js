// These views format backend answers; the BQ counts, winners, and profiles
// arrive already calculated by get_admin_analytics.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const pill = (label, active, action, value) => `<button class="pill ${active ? 'active' : ''}" data-action="${action}" data-value="${escape(value)}">${escape(label)}</button>`;
const percent = value => `${Number(value || 0).toFixed(1)}%`;

export function renderBq4(data, selectedMonths) {
  const months = data.months ?? [];
  const leaders = data.overallTopCategoryNames ?? [];
  const overall = leaders.length ? leaders.map(escape).join(' · ') : 'No purchases in this window';
  const monthly = months.length ? months.map(month => {
    const names = (month.topCategoryNames ?? []).map(escape).join(' · ');
    const breakdown = month.byCategory.map(category => {
      const width = Math.max(0, Math.min(100, Number(category.purchases) / Number(month.topCategoryPurchases || 1) * 100));
      return `<div class="bq-rank-row"><span>${escape(category.categoryName)}</span><div class="bq-track"><div style="width:${width}%"></div></div><strong>${number(category.purchases)}</strong></div>`;
    }).join('');
    return card(`<div class="heading-line"><h2>${escape(month.label)}</h2><span>${number(month.totalPurchases)} purchased</span></div><p class="eyebrow">${month.topCategoryNames.length > 1 ? 'TIED TOP CATEGORIES' : 'TOP CATEGORY'}</p><p class="bq-leader">${names}</p><p class="muted">${number(month.topCategoryPurchases)} ${month.topCategoryPurchases === 1 ? 'purchase' : 'purchases'} in ${month.topCategoryNames.length > 1 ? 'each leading category' : 'the leading category'}</p><div class="bq-breakdown">${breakdown}</div>`, 'wide-card');
  }).join('') : card('<div class="empty"><h2>No dated purchases in this window</h2><p>Try a longer period or check again after products are marked purchased.</p></div>');

  return `<div class="segment-row">${[6, 12, 24].map(months => pill(`${months} months`, selectedMonths === months, 'months', months)).join('')}</div><div class="kpis">${card(`<p class="eyebrow">BQ4 · TOP CATEGORY IN THE WINDOW</p><div class="bq-leader">${overall}</div><small>All categories tied for first are shown</small>`)}${card(`<p class="eyebrow">PURCHASES IN THE WINDOW</p><div class="big">${number(data.totalPurchases)}</div><small>${number(data.undatedPurchases)} purchased products have no date and cannot be assigned to a month</small>`)}</div>${monthly}`;
}

export function renderBq6(data, selectedCategoryId) {
  const categories = data.categories ?? [];
  const summary = `<div class="kpis">${card(`<p class="eyebrow">BQ6 · DISTINCT BUYERS</p><div class="big">${number(data.totalBuyers)}</div><small>Across all purchased-product categories</small>`)}${card(`<p class="eyebrow">BUYERS WITHOUT A CITY</p><div class="big">${number(data.profilesWithoutCity)}</div><small>Included under Unknown in city results</small>`)}</div>`;
  if (!categories.length) return `${summary}${card('<div class="empty"><h2>No buyer profiles yet</h2><p>Buyers appear when purchased products have matching user profiles.</p></div>')}`;

  const selected = categories.find(category => category.categoryId === selectedCategoryId) ?? categories[0];
  const maxAge = Math.max(1, ...selected.ageGroups.map(group => group.userCount));
  const maxCity = Math.max(1, ...selected.topCities.map(city => city.userCount));
  const ages = selected.ageGroups.map(group => `<div class="bq-rank-row"><span>${escape(group.label)}</span><div class="bq-track"><div style="width:${Math.max(0, Number(group.userCount) / maxAge * 100)}%"></div></div><strong>${number(group.userCount)}</strong></div>`).join('');
  const genders = selected.genders.length ? selected.genders.map(group => `<div class="bq-rank-row"><span>${escape(group.gender)}</span><div class="bq-track"><div style="width:${Math.max(0, Math.min(100, Number(group.percentage)))}%"></div></div><strong>${percent(group.percentage)}</strong></div>`).join('') : '<p class="muted">No gender data.</p>';
  const cities = selected.topCities.length ? selected.topCities.map(city => `<div class="bq-rank-row"><span>${escape(city.cityName ?? (city.cityId === 'unknown' ? 'Unknown' : city.cityId))}</span><div class="bq-track"><div style="width:${Math.max(0, Number(city.userCount) / maxCity * 100)}%"></div></div><strong>${number(city.userCount)}</strong></div>`).join('') : '<p class="muted">No city data.</p>';

  return `${summary}<div class="segment-row wrap">${categories.map(category => pill(`${category.categoryName} · ${number(category.buyers)}`, category.categoryId === selected.categoryId, 'bq6Category', category.categoryId)).join('')}</div>${card(`<p class="eyebrow">${escape(selected.categoryName)} · PURCHASED-PRODUCT BUYERS</p><div class="bq-profile-heading"><div><div class="big">${number(selected.buyers)}</div><small>distinct buyers in this category</small></div><div><p class="eyebrow">MEDIAN AGE</p><div class="big">${selected.medianAge == null ? '—' : number(selected.medianAge)}</div></div></div><p class="muted">Each buyer counts once per category, regardless of how many products they bought.</p>`, 'wide-card')}<div class="two-col">${card('<h2>Age groups</h2>' + ages)}${card('<h2>Gender</h2>' + genders)}</div>${card('<h2>Top cities</h2>' + cities, 'wide-card')}`;
}
