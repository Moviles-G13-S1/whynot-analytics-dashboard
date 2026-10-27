const escape = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const validCount = value =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;

const number = value => {
  const count = validCount(value);
  return count === null ? '—' : count.toLocaleString('en-US');
};

export function renderCoreSavingFeatures(data) {
  if (!data || !Array.isArray(data.features) || data.features.length !== 3) {
    return `
      <section class="core-saving-view">
        <div class="card empty" role="status">
          <h2>Core saving data unavailable</h2>
          <p>The dashboard has not received a valid feature breakdown.</p>
        </div>
      </section>
    `;
  }

  const features = data.features.map(feature => ({
    id: typeof feature?.id === 'string' ? feature.id : '',
    label: typeof feature?.label === 'string'
      ? feature.label
      : 'Unknown feature',
    count: validCount(feature?.count),
  }));

  const leaders = Array.isArray(data.leaders) ? data.leaders : [];

  // The backend decides who wins. The frontend only displays that answer.
  const leaderNames = leaders
    .map(id => features.find(feature => feature.id === id)?.label)
    .filter(Boolean);

  const maximum = validCount(data.highestCount);
  const unclassified = validCount(data.unclassifiedProducts);

  const incomplete =
    data.classificationComplete === false ||
    (unclassified !== null && unclassified > 0);

  let resultTitle;
  let resultDescription;

  if (data.status === 'empty') {
    resultTitle = 'No classified saving records yet';
    resultDescription =
      'There are no current records among the three compared features.';
  } else if (data.status === 'leader' && leaderNames.length === 1) {
    resultTitle = leaderNames[0];
    resultDescription =
      `Leads with ${number(maximum)} current saved records.`;
  } else if (data.status === 'tie' && leaderNames.length > 1) {
    resultTitle = leaderNames.join(' & ');
    resultDescription =
      `These features are tied with ${number(maximum)} records each.`;
  } else {
    resultTitle = 'Result unavailable';
    resultDescription =
      'The backend did not return a valid leader or tie.';
  }

  const kpis = features.map(feature => `
    <div class="card core-saving-kpi">
      <p class="eyebrow">${escape(feature.label.toUpperCase())}</p>
      <div class="core-saving-value">${number(feature.count)}</div>
      <p class="muted">Current records</p>
    </div>
  `).join('');

  const bars = features.map(feature => {
    const width =
      maximum !== null &&
      maximum > 0 &&
      feature.count !== null
        ? Math.min(100, feature.count / maximum * 100)
        : 0;

    return `
      <div class="bq-rank-row">
        <span>${escape(feature.label)}</span>
        <div
          class="bq-track"
          role="img"
          aria-label="${escape(feature.label)}: ${number(feature.count)} current records"
        >
          <div style="width:${width.toFixed(1)}%"></div>
        </div>
        <strong>${number(feature.count)}</strong>
      </div>
    `;
  }).join('');

  return `
    <section
      class="core-saving-view"
      aria-label="Core saving feature records"
    >
      <div class="core-saving-intro">
        <p class="eyebrow">SPRINT 3 · BUSINESS QUESTION</p>
        <h2>Which core saving feature has the most saved records?</h2>
        <p class="muted">
          Comparing existing wishlists, manually saved products,
          and products saved from recommendations.
        </p>
      </div>

      <div class="core-saving-kpis">
        ${kpis}
      </div>

      <div class="card core-saving-result" role="status">
        <p class="eyebrow">
          ${incomplete ? 'PROVISIONAL RESULT' : 'MOST SAVED RECORDS'}
        </p>
        <h2>${escape(resultTitle)}</h2>
        <p>${escape(resultDescription)}</p>
      </div>

      <div class="card">
        <p class="eyebrow">CURRENT RECORD COMPARISON</p>
        <h2>Saving features ranked by current records</h2>

        <div class="core-saving-bars">
          ${bars}
        </div>

        <p class="muted">
          Total current products: ${number(data.totalCurrentProducts)}
        </p>
      </div>

      ${incomplete ? `
        <div class="card core-saving-warning" role="note">
          <h2>Some products could not be classified</h2>
          <p>
            ${number(unclassified)} current products have an
            unverified saving origin. They are not assigned to
            manual or recommendation saves. The reported leader
            may change if these products are classified.
          </p>
        </div>
      ` : ''}

      <details class="core-saving-method">
        <summary>How this is calculated</summary>

        <div class="core-saving-method-body">
          <p>
            The backend counts current Firestore documents,
            rather than historical save attempts or button clicks.
          </p>
          <p>
            A recommendation save is identified by its deterministic
            product ID and a matching successful recommendation event.
            Deleted products are excluded.
          </p>
          <p>
            Wishlists and products are different record types.
            Saving a recommendation may also create a wishlist,
            so each existing record contributes to its corresponding
            feature count.
          </p>
          <p>
            Ties and empty results are determined by the backend.
            Unverified recommendation-origin products are reported
            separately.
          </p>
        </div>
      </details>
    </section>
  `;
}