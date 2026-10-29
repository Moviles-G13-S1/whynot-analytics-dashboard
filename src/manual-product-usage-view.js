const number = value => Number(value || 0).toLocaleString('en-US');
const card = body => `<section class="card">${body}</section>`;

export function renderManualProductUsage(data) {
  const percentage = data.manualPercentage == null ? '—' : `${Number(data.manualPercentage).toFixed(1)}%`;
  return `<div class="kpis">${card(`<p class="eyebrow">MANUAL ENTRY SHARE</p><div class="big">${percentage}</div><small>Of ${number(data.classifiedProducts)} classified current products</small>`)}${card(`<p class="eyebrow">MANUALLY ADDED</p><div class="big">${number(data.manualProducts)}</div><small>Current products added through the product form</small>`)}</div>
    <div class="kpis">${card(`<p class="eyebrow">SAVED RECOMMENDATIONS</p><div class="big">${number(data.recommendedProducts)}</div><small>Current products linked to a confirmed recommendation save</small>`)}${card(`<p class="eyebrow">UNCLASSIFIED PRODUCTS</p><div class="big">${number(data.unclassifiedProducts)}</div><small>Excluded from the percentage</small>`)}</div>
    ${card(`<h2>How often do users add a product manually?</h2><p class="muted">Manual products / (manual products + saved recommendations) × 100.</p><p class="muted">This is the share of current saved products, not historical action frequency. Deleted products are excluded. Form entries are classified by the existing product ID convention; a product URL alone does not mean automatic add-by-link.</p><p class="muted">${number(data.totalCurrentProducts)} current products. ${data.classifiedProducts ? 'Use Refresh to request updated backend counts.' : 'No classified products yet; the percentage is unavailable.'}</p>`)}`;
}
