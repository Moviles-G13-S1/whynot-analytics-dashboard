import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { adminAnalytics, auth, useEmulators } from './firebase.js';
import { clearAnalyticsCache, loadAnalytics, warmAnalyticsCache } from './analytics.js';
import { renderBq3 } from './bq3-view.js';
import { renderBq4, renderBq6 } from './bq-views.js';
import { renderWishlistUx } from './wishlist-ux-view.js';
import { renderBuyingPatterns } from './buying-patterns-view.js';
import { renderRecommendationHome } from './recommendation-home-view.js';
import './style.css';

const app = document.querySelector('#app');
const viewGroups = [
  ['SPRINT 1 & 2 BQs', [
    ['saved', 'BQ1 · Saved products', 'Also answers BQ2 (repeat savers) and BQ5 (users with no saved products)'],
    ['recommended', 'BQ3 · Recommended saves', 'How many recommended products have been saved?'],
    ['purchased', 'BQ4 · Purchase trends', 'Supporting view · Monthly purchases by category'],
    ['bq4', 'BQ4 · Top category', 'Which category leads purchases each month?'],
    ['demographic', 'BQ6 · Product owner profile', 'Supporting view · Owners of current products by category'],
    ['bq6', 'BQ6 · Buyer profile', 'Demographics of purchasers by category'],
  ]],
  ['SPRINT 3', [
    ['recommendation_home_opens', 'Home detail opens', 'Type 3 · Flutter Home recommendation card usage'],
    ['buying_patterns', 'Buying patterns', 'Juan Felipe · BQ Type * (2/4)'],
  ]],
  ['SUPPORT VIEWS', [
    ['wishlist_interactions', 'Wishlist UX', 'Supporting view · Deliberate wishlist interactions'],
  ]],
];
const views = viewGroups.flatMap(([, group]) => group);
const state = { view: 'saved', months: 6, categoryId: null, bq6CategoryId: null, savedMetric: 'percentage', hidden: new Set(), user: null, admin: false, data: null, loading: false, error: null, serial: 0 };
const viewCache = new Map();
const viewKey = () => `${state.view}:${['purchased', 'bq4', 'buying_patterns'].includes(state.view) ? state.months : state.view === 'demographic' ? state.categoryId ?? '' : ''}`;
function clearCachedMetrics() {
  viewCache.clear();
  clearAnalyticsCache();
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value || 0).toLocaleString('en-US');
const pill = (label, active, action, value) => `<button class="pill ${active ? 'active' : ''}" data-action="${action}" data-value="${escape(value)}">${escape(label)}</button>`;
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const title = (text, subtitle = '') => `<div class="section-heading"><h2>${escape(text)}</h2>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}</div>`;
const supportingNote = (bq, name, explanation, target) => card(`<p class="eyebrow">${bq} · ${name.toUpperCase()}</p><small>Supporting view</small><p class="muted">${explanation}</p>${pill(`Open ${bq} answer`, false, 'view', target)}`, 'supporting-note');
const shortMonth = month => { const [year, m] = month.split('-').map(Number); return new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(year, m - 1, 1)); };

function signInView(message = '') {
  app.innerHTML = `<main class="login-shell"><div class="login-brand">WHYNOT <span>ADMIN</span></div><form id="login" class="login-card"><p class="eyebrow">ADMINISTRATOR ACCESS</p><h1>Analytics dashboard</h1><p class="muted">Sign in with your WhyNot administrator account.</p><label>Email address<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Sign in</button><p id="login-error" class="error" role="alert">${escape(message)}</p></form></main>`;
  document.querySelector('#login').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const error = document.querySelector('#login-error');
    button.disabled = true;
    error.textContent = '';
    try {
      const form = new FormData(event.currentTarget);
      await signInWithEmailAndPassword(auth, form.get('email'), form.get('password'));
    } catch (e) {
      error.textContent = e.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Sign in failed. Check your account and connection.';
      button.disabled = false;
    }
  });
}

function shell() {
  const [, name, subtitle] = views.find(([id]) => id === state.view);
  const navigation = viewGroups.map(([groupName, group], groupIndex) => `<section class="nav-group" aria-labelledby="nav-group-${groupIndex}"><h2 class="nav-label" id="nav-group-${groupIndex}">${escape(groupName)}</h2><div class="nav-group-links">${group.map(([id, label]) => `<a class="nav-link ${state.view === id ? 'selected' : ''}" href="#/${id}"><span class="nav-index">0${views.findIndex(([viewId]) => viewId === id) + 1}</span>${escape(label)}</a>`).join('')}</div></section>`).join('');
  app.innerHTML = `<div class="layout"><aside class="sidebar"><div class="brand">WHYNOT <span>ADMIN</span></div><nav aria-label="Analytics views">${navigation}</nav><div class="sidebar-bottom"><span class="status-dot"></span> ${useEmulators ? 'Local emulator data' : 'Production data'}<br><small>Read only</small></div></aside><main class="main"><header class="topbar"><span>ANALYTICS / ${escape(name.toUpperCase())}</span><button id="signout" class="text-button">Sign out</button></header><div class="content"><div class="page-header"><div><p class="eyebrow">WHYNOT ADMIN</p><h1>${escape(name)}</h1><p class="muted">${escape(subtitle)}</p></div><button id="refresh" class="outline">↻ Refresh</button></div><div id="view"></div></div></main></div>`;
  document.querySelector('#signout').onclick = () => signOut(auth);
  document.querySelector('#refresh').onclick = () => load(true);
  document.querySelector('#view').addEventListener('click', onAction);
  renderView();
}

function renderView() {
  const root = document.querySelector('#view');
  if (!root) return;
  if (state.loading) { root.innerHTML = card('<div class="empty">Loading production analytics…</div>'); return; }
  if (state.error) { root.innerHTML = card(`<div class="empty"><h2>Could not load this metric</h2><p>${escape(state.error)}</p><button class="outline" data-action="retry">Try again</button></div>`); return; }
  if (!state.data) { root.innerHTML = ''; return; }
  root.innerHTML = ({ saved: renderSaved, recommended: renderBq3, recommendation_home_opens: renderRecommendationHome, purchased: renderPurchased, bq4: data => renderBq4(data, state.months), demographic: renderDemographic, bq6: data => renderBq6(data, state.bq6CategoryId), wishlist_interactions: renderWishlistUx, buying_patterns: data => renderBuyingPatterns(data, state.months) })[state.view](state.data);
}

function renderSaved(d) {
  const labels = ['1–5', '6–10', '11–20', '21–50', '51+'];
  const counts = d.distributionCounts;
  const users = state.savedMetric === 'users';
  const max = users ? Math.max(3, Math.ceil(d.activeUsers / 3) * 3) : 1;
  const distribution = counts.map((count, i) => {
    const value = users ? count : d.activeUsers ? count / d.activeUsers : 0;
    const label = users ? number(count) : `${Math.round(value * 100)}%`;
    return `<div class="bar-col"><span>${label}</span><div class="bar-track"><div class="bar" style="height:${Math.max(0, value / max * 100)}%"></div></div><small>${labels[i]}</small></div>`;
  }).join('');

  return `<div class="segment-row">${pill('BQ1 · Saved products', true, 'view', 'saved')}${pill('BQ3 · Recommended saves', false, 'view', 'recommended')}</div>
    <div class="kpis">
      ${card(`<p class="eyebrow">BQ1 · PRODUCTS SAVED PER USER</p><div class="big">${Number(d.averagePerActiveUser).toFixed(1)}</div><small>Average per active user · ${number(d.activeUsers)} active users</small>`)}
      ${card(`<p class="eyebrow">BQ2 · USERS WHO SAVED AGAIN</p><div class="big">${number(d.multipleProductUsers)}</div><small>Users with 2 or more current products · ${number(d.singleProductUsers)} have 1</small>`)}
    </div>
    <div class="kpis">
      ${card(`<p class="eyebrow">CURRENT PRODUCTS SAVED</p><div class="big">${number(d.totalProducts)}</div><small>Deleted products are excluded</small>`)}
      ${card(`<p class="eyebrow">BQ5 · USERS WITH ZERO PRODUCTS</p><div class="big">${number(d.zeroProductUsers)}</div><small>Registered users with no current products saved</small>`)}
    </div>
    ${card(`<p class="eyebrow">BQ1 · SAVED PRODUCT DISTRIBUTION</p>${title('How many products has a user saved?', 'Current products grouped by owner')}<div class="segment-row">${pill('Users', users, 'savedMetric', 'users')}${pill('% users', !users, 'savedMetric', 'percentage')}</div><div class="bar-chart">${distribution}</div><p class="chart-axis">Saved products per user</p><p class="muted">${number(d.activeUsers)} active users · The distribution excludes users with zero products; BQ5 counts them above.</p>`, 'wide-card')}`;
}

function renderPurchased(d) {
  const ids = d.categories.map(c => c.categoryId);
  const visible = ids.filter(id => !state.hidden.has(id));
  const chart = d.months.map((month, i) => `<div class="stack-col"><div class="stack" aria-label="${escape(month)}: ${number(d.monthlyTotals[i])} purchases">${d.categories.filter(c => visible.includes(c.categoryId)).map((c, j) => { const count = c.monthlyCounts[i]; const pct = count / d.chartMaximum * 100; return count ? `<button class="stack-part color-${ids.indexOf(c.categoryId) % 8}" style="height:${pct}%" title="${escape(c.categoryId)} · ${number(count)} of ${number(d.monthlyTotals[i])} purchases · ${escape(month)}" aria-label="${escape(c.categoryId)}: ${number(count)} of ${number(d.monthlyTotals[i])} purchases in ${escape(month)}"></button>` : ''; }).join('')}</div><small>${shortMonth(month)}<br>${month.slice(0, 4)}</small></div>`).join('');
  return `${supportingNote("BQ4", "Purchase trends", "This chart shows purchase counts by category over time. The BQ4 answer ranks the leading category for each month and shows ties.", "bq4")}${card(`<p class="eyebrow">CURRENT MONTH · ${escape(shortMonth(d.months.at(-1).toUpperCase()))}</p><p class="muted">Previous: ${number(d.previousMonthCount)}</p><div class="big">${number(d.currentMonthCount)}</div><small>products purchased</small>`, 'metric-card')}<div class="segment-row">${[6,12,24].map(m => pill(`${m} months`, state.months === m, 'months', m)).join('')}</div>${card(`<p class="eyebrow">PURCHASED BY MONTH</p><p class="muted">Existing purchased products</p><div class="stack-chart">${chart}</div><div class="legend">${ids.map((id, i) => `<button data-action="categoryToggle" data-value="${escape(id)}" class="legend-item ${state.hidden.has(id) ? 'muted-item' : ''}"><i class="color-${i % 8}"></i>${escape(id)}</button>`).join('')}</div><p class="muted">${ids.length ? 'Select a category to hide/show · Hover a segment for details' : 'No purchases in this period'}</p>`, 'wide-card')}`;
}
function renderDemographic(d) {
  const note = supportingNote("BQ6", "Product owner profile", "These charts describe owners of current products, including products not yet purchased. The BQ6 answer describes buyers of purchased products by category.", "bq6");
  if (!d.categories.length) return note + card('<div class="empty">No categories found.</div>');
  const ageMax = Math.max(1, ...d.ages.map(x => x.count));
  const cityMax = Math.max(1, ...d.cities.map(x => x.count));
  const selected = d.categories.find(x => x.id === d.categoryId)?.name || d.categoryId;
  return `${note}<div class="segment-row wrap">${d.categories.map(c => pill(c.name, c.id === d.categoryId, 'category', c.id)).join('')}</div><div class="two-col">${card(`<div class="heading-line"><p class="eyebrow">AGE</p><span>Median age <strong>${escape(d.medianAge)}</strong></span></div><div class="bar-chart age-chart">${d.ages.map(g => `<div class="bar-col"><span>${number(g.percent)}%</span><div class="bar-track"><div class="bar" style="height:${g.count / ageMax * 100}%"></div></div><small>${escape(g.label)}</small></div>`).join('')}</div>`)}${card(`<p class="eyebrow">GENDER</p><div class="gender-strip">${d.genders.map((g, i) => g.count ? `<div class="gender-${i}" style="flex:${g.count}"></div>` : '').join('') || '<div style="flex:1"></div>'}</div><div class="legend">${d.genders.map((g,i) => `<span class="legend-item"><i class="gender-${i}"></i>${escape(g.label)} ${number(g.percent)}%</span>`).join('')}</div>`)}</div>${card(`<div class="heading-line"><p class="eyebrow">TOP CITIES</p><span>Share of ${escape(selected)} users</span></div><div class="city-list">${d.cities.map(c => `<div class="city-row"><span>${escape(c.label)}</span><div class="city-track"><div style="width:${c.count / cityMax * 100}%"></div></div><strong>${number(c.percent)}%</strong></div>`).join('')}</div><p class="muted">${number(d.userCount)} ${d.userCount === 1 ? 'user' : 'users'} with a current product in ${escape(selected)}</p>`, 'wide-card')}`;
}

function onAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, value } = button.dataset;
  if (action === 'retry') return load(true);
  if (action === 'view') { location.hash = `/${value}`; return; }
  if (action === 'savedMetric') { state.savedMetric = value; renderView(); return; }
  if (action === 'months') { state.months = Number(value); state.hidden.clear(); load(); return; }
  if (action === 'category') { state.categoryId = value; load(); return; }
  if (action === 'bq6Category') { state.bq6CategoryId = value; renderView(); return; }
  if (action === 'categoryToggle') { if (state.hidden.has(value)) state.hidden.delete(value); else if (state.hidden.size < state.data.categories.length - 1) state.hidden.add(value); renderView(); }
}

async function load(fresh = false) {
  if (!state.user || !state.admin) return;
  const serial = ++state.serial;
  if (fresh) {
    clearCachedMetrics();
    warmAnalyticsCache(adminAnalytics);
  }
  const key = viewKey();
  if (viewCache.has(key)) {
    state.data = viewCache.get(key);
    state.loading = false;
    state.error = null;
    renderView();
    return;
  }
  state.loading = true; state.error = null; renderView();
  try {
    const params = {};
    if (['purchased', 'bq4', 'buying_patterns'].includes(state.view)) params.months = state.months;
    if (state.view === 'demographic' && state.categoryId) params.categoryId = state.categoryId;
    const result = await loadAnalytics(adminAnalytics, state.view, params);
    if (serial !== state.serial) return;
    viewCache.set(key, result);
    state.data = result;
    if (state.view === 'demographic') {
      state.categoryId = result.categoryId;
      viewCache.set(viewKey(), result);
    }
  } catch (error) {
    if (serial !== state.serial) return;
    state.error = error.code === 'functions/permission-denied' || error.code === 'functions/unauthenticated'
      ? 'This account cannot access the analytics function. Sign out and back in, then try again.'
      : 'Could not load analytics from the backend. Check your connection and try again.';
    state.data = null;
  } finally { if (serial === state.serial) { state.loading = false; renderView(); } }
}
function route() {
  const view = location.hash.match(/^#\/(saved|recommended|recommendation_home_opens|purchased|bq4|demographic|bq6|wishlist_interactions|buying_patterns)$/)?.[1] || 'saved';
  if (state.view !== view) { state.view = view; state.data = null; state.error = null; state.hidden.clear(); }
  if (state.admin) { shell(); load(); }
}
window.addEventListener('hashchange', route);
onAuthStateChanged(auth, async user => {
  state.serial++;
  clearCachedMetrics();
  state.user = user; state.admin = false; state.data = null;
  if (!user) { signInView(); return; }
  app.innerHTML = '<div class="checking">Checking administrator access…</div>';
  try {
    const token = await user.getIdTokenResult(true);
    if (!token.claims.admin) { signInView('This account does not have administrator access.'); return; }
    state.admin = true;
    warmAnalyticsCache(adminAnalytics);
    state.view = location.hash.match(/^#\/(saved|recommended|recommendation_home_opens|purchased|bq4|demographic|bq6|wishlist_interactions|buying_patterns)$/)?.[1] || 'saved';
    shell(); load();
  } catch { signInView('Could not verify administrator access. Check your connection.'); }
});
