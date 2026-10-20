import { collection, getDocs, query, where } from 'firebase/firestore';

const ageLabels = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+'];
const collectionCache = new Map();

export function clearAnalyticsCache() {
  collectionCache.clear();
}

function readCollection(db, name, constraint) {
  const key = constraint ? `${name}:recommendation_shown` : name;
  const cached = collectionCache.get(key);
  if (cached) return cached;
  const reference = collection(db, name);
  const pending = getDocs(constraint ? query(reference, constraint) : reference)
    .then(snapshot => snapshot.docs.map(document => [document.id, document.data()]));
  collectionCache.set(key, pending);
  pending.catch(() => {
    if (collectionCache.get(key) === pending) collectionCache.delete(key);
  });
  return pending;
}

export function warmAnalyticsCache(db) {
  return Promise.allSettled([
    readCollection(db, 'products'),
    readCollection(db, 'users'),
    readCollection(db, 'categories'),
    readCollection(db, 'cities'),
    readCollection(db, 'productEvents', where('eventType', '==', 'recommendation_shown')),
  ]);
}

export function savedSummary(products, profiles) {
  const counts = new Map();
  for (const [, product] of products) {
    const owner = product.ownerId ?? '';
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  const distributionCounts = [0, 0, 0, 0, 0];
  let singleProductUsers = 0;
  for (const count of counts.values()) {
    if (count === 1) singleProductUsers++;
    distributionCounts[count <= 5 ? 0 : count <= 10 ? 1 : count <= 20 ? 2 : count <= 50 ? 3 : 4]++;
  }
  const activeUsers = counts.size;
  return {
    activeUsers,
    zeroProductUsers: profiles.filter(([uid]) => !counts.has(uid)).length,
    totalProducts: products.length,
    singleProductUsers,
    multipleProductUsers: activeUsers - singleProductUsers,
    averagePerActiveUser: activeUsers ? products.length / activeUsers : 0,
    distributionCounts,
  };
}

export function recommendedSummary(events) {
  return { total: events.filter(([, event]) =>
    event.eventType === 'recommendation_shown'
    && event.savedAt != null
    && typeof event.savedProductId === 'string'
    && event.savedProductId.length > 0,
  ).length };
}

function monthKey(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const year = parts.find(part => part.type === 'year').value;
  const month = parts.find(part => part.type === 'month').value;
  return `${year}-${month}`;
}

export function purchasedSummary(products, now, windowMonths) {
  if (![6, 12, 24].includes(windowMonths)) throw new Error('Months must be 6, 12, or 24.');
  const [year, month] = monthKey(now).split('-').map(Number);
  const currentAbsolute = year * 12 + month - 1;
  const months = Array.from({ length: windowMonths }, (_, index) => {
    const absolute = currentAbsolute - windowMonths + 1 + index;
    return `${String(Math.floor(absolute / 12)).padStart(4, '0')}-${String(absolute % 12 + 1).padStart(2, '0')}`;
  });
  const totals = Array(windowMonths).fill(0);
  const byCategory = new Map();
  for (const [, product] of products) {
    const date = product.purchasedAt?.toDate?.() ?? product.purchasedAt;
    if (product.purchased !== true || !(date instanceof Date) || Number.isNaN(date.getTime())) continue;
    const index = months.indexOf(monthKey(date));
    if (index < 0) continue;
    const category = product.categoryId ?? '';
    if (!byCategory.has(category)) byCategory.set(category, Array(windowMonths).fill(0));
    byCategory.get(category)[index]++;
    totals[index]++;
  }
  return {
    months,
    categories: [...byCategory.keys()].sort().map(categoryId => ({ categoryId, monthlyCounts: byCategory.get(categoryId) })),
    monthlyTotals: totals,
    chartMaximum: Math.max(3, Math.ceil(Math.max(...totals) / 3) * 3),
    currentMonthCount: totals.at(-1),
    previousMonthCount: totals.at(-2),
  };
}

export function demographicSummary(categoryId, products, profiles, cities) {
  const owners = new Set(products.filter(([, product]) => product.categoryId === categoryId).map(([, product]) => product.ownerId));
  const users = profiles.filter(([uid]) => owners.has(uid)).map(([, profile]) => profile);
  const total = users.length;
  const ages = users.map(user => user.age ?? 0).sort((a, b) => a - b);
  const middle = total ? (ages[Math.floor((total - 1) / 2)] + ages[Math.floor(total / 2)]) / 2 : null;
  const ageCounts = Array(6).fill(0);
  const genderCounts = new Map();
  const cityCounts = new Map();
  for (const user of users) {
    const age = user.age ?? 0;
    ageCounts[age <= 17 ? 0 : age <= 24 ? 1 : age <= 34 ? 2 : age <= 44 ? 3 : age <= 54 ? 4 : 5]++;
    genderCounts.set(user.gender, (genderCounts.get(user.gender) ?? 0) + 1);
    const city = user.cityId || 'other';
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const group = (label, count) => ({ label, count, percent: total ? Math.floor((count * 100 + total / 2) / total) : 0 });
  const cityNames = new Map(cities.map(([uid, city]) => [uid, city.name ?? uid]));
  const ranked = [...cityCounts.entries()]
    .filter(([uid]) => uid !== 'other' && cityNames.has(uid))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4);
  const other = total - ranked.reduce((sum, [, count]) => sum + count, 0);
  return {
    userCount: total,
    medianAge: middle == null ? '—' : String(middle),
    ages: ageLabels.map((label, index) => group(label, ageCounts[index])),
    genders: ['Female', 'Male', 'Other'].map((gender, index) => group(['Women', 'Men', 'Other'][index], genderCounts.get(gender) ?? 0)),
    cities: [...ranked.map(([uid, count]) => group(cityNames.get(uid), count)), group('Other / unknown', other)],
  };
}

export async function loadAnalytics(db, view, { months = 6, categoryId } = {}) {
  if (view === 'saved') {
    const [products, users] = await Promise.all([readCollection(db, 'products'), readCollection(db, 'users')]);
    return savedSummary(products, users);
  }
  if (view === 'recommended') {
    const events = await readCollection(db, 'productEvents', where('eventType', '==', 'recommendation_shown'));
    return recommendedSummary(events);
  }
  if (view === 'purchased') {
    return purchasedSummary(await readCollection(db, 'products'), new Date(), months);
  }
  if (view === 'demographic') {
    const [categories, products, users, cities] = await Promise.all([
      readCollection(db, 'categories'), readCollection(db, 'products'),
      readCollection(db, 'users'), readCollection(db, 'cities'),
    ]);
    if (!categories.length) return { categories: [], categoryId: null };
    const sortedCategories = categories.sort(([a], [b]) => a.localeCompare(b));
    const selected = categoryId || sortedCategories[0][0];
    if (!sortedCategories.some(([uid]) => uid === selected)) throw new Error('Unknown category.');
    return {
      ...demographicSummary(selected, products, users, cities),
      categories: sortedCategories.map(([id, category]) => ({ id, name: category.name ?? id })),
      categoryId: selected,
    };
  }
  throw new Error(`Unknown view: ${view}.`);
}
