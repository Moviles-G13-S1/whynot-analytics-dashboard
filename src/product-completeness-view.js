// All counts and percentages come from the backend product_completeness metric.
const number = value => Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');
const percent = value => value == null ? '—' : `${Number(value).toFixed(1)}%`;
const card = body => `<section class="card">${body}</section>`;

export function renderProductCompleteness(data) {
  const d = data ?? {};
  const header = card('<p class="eyebrow">BQ TYPE 2 · JERÓNIMO · SPRINT 4</p><h2>What percentage of saved products are missing an image or a product link?</h2><p class="muted">Understand how often saved products lack the image or link that helps users recognize and revisit them.</p>');
  const overview = `<div class="kpis">${card(`<p class="eyebrow">MISSING IMAGE OR LINK</p><div class="big">${percent(d.incompletePercentage)}</div><small>${number(d.incompleteCount)} of ${number(d.totalProducts)} current saved products · Each product counts once</small>`)}${card(`<p class="eyebrow">CURRENT SAVED PRODUCTS</p><div class="big">${number(d.totalProducts)}</div><small>Includes purchased products · Deleted products are excluded</small>`)}</div>`;
  if (!d.totalProducts) {
    return `${header}${overview}${card('<div class="empty"><h2>No saved products yet</h2><p>Percentages will appear when products are saved.</p></div>')}`;
  }
  const breakdown = `<div class="kpis">${card(`<p class="eyebrow">MISSING IMAGE</p><div class="big">${percent(d.missingImagePercentage)}</div><small>${number(d.missingImageCount)} of ${number(d.totalProducts)} products</small>`)}${card(`<p class="eyebrow">MISSING PRODUCT LINK</p><div class="big">${percent(d.missingProductUrlPercentage)}</div><small>${number(d.missingProductUrlCount)} of ${number(d.totalProducts)} products</small>`)}</div>`;
  const overlap = card(`<p class="eyebrow">MISSING BOTH</p><div class="big">${number(d.missingBothCount)}</div><p class="muted">Products without an image and without a link appear in both individual counts, but only once in the overall percentage.</p>`);
  const method = '<details class="home-open-method"><summary>How this is calculated</summary><div class="home-open-method-body"><p>A field is missing when it is absent, null, empty, contains only whitespace, or is not text. Any non-empty text counts as present. This measures field presence only.</p><p>The overall percentage is products missing at least one field divided by all current saved products, multiplied by 100. This is a current snapshot across all users, without a date filter. Edits and deletions change the next refreshed result.</p></div></details>';
  return `${header}${overview}${breakdown}${overlap}${method}`;
}
