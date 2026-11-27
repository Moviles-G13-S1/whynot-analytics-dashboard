const number = value =>
  (Number(value) || 0).toLocaleString('en-US');

const escape = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const card = body =>
  `<section class="card">${body}</section>`;

function correlationInsight(data) {
  const r = data.correlation;

  if (data.status === 'empty') {
    return 'No registered users were found.';
  }

  if (r === null || !Number.isFinite(r)) {
    return 'There is not enough variation to calculate a correlation.';
  }

  const magnitude = Math.abs(r);

  if (magnitude < 0.1) {
    return 'There is little or no linear association between recorded errors and saved products.';
  }

  let strength;

  if (magnitude < 0.3) {
    strength = 'weak';
  } else if (magnitude < 0.7) {
    strength = 'moderate';
  } else {
    strength = 'strong';
  }

  const direction = r < 0 ? 'negative' : 'positive';

  const relationship = r < 0
    ? 'fewer'
    : 'more';

  return `There is a ${strength} ${direction} correlation between recorded errors and saved products. Users with more recorded errors tend to have ${relationship} saved products.`;
}

function renderScatterPlot(points = []) {
  if (!points.length) {
    return `
      <p class="muted">
        No user records available for this period.
      </p>
    `;
  }

  const width = 760;
  const height = 340;

  const left = 75;
  const right = 35;
  const top = 25;
  const bottom = 65;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxErrors = points.reduce(
    (max, point) => Math.max(max, point.errors),
    1
  );

  const maxProducts = points.reduce(
    (max, point) => Math.max(max, point.products),
    1
  );

  const xStep = Math.max(1, Math.ceil(maxErrors / 5));
  const yStep = Math.max(1, Math.ceil(maxProducts / 5));

  const xMax = Math.ceil(maxErrors / xStep) * xStep;
  const yMax = Math.ceil(maxProducts / yStep) * yStep;

  const x = value =>
    left + (value / xMax) * plotWidth;

  const y = value =>
    top + plotHeight - (value / yMax) * plotHeight;

  let grid = '';

  for (let value = 0; value <= xMax; value += xStep) {
    grid += `
      <line
        x1="${x(value)}"
        y1="${top}"
        x2="${x(value)}"
        y2="${height - bottom}"
        class="error-scatter-grid"
      />

      <text
        x="${x(value)}"
        y="${height - bottom + 22}"
        text-anchor="middle"
        class="error-scatter-label"
      >
        ${number(value)}
      </text>
    `;
  }

  for (let value = 0; value <= yMax; value += yStep) {
    grid += `
      <line
        x1="${left}"
        y1="${y(value)}"
        x2="${width - right}"
        y2="${y(value)}"
        class="error-scatter-grid"
      />

      <text
        x="${left - 12}"
        y="${y(value) + 4}"
        text-anchor="end"
        class="error-scatter-label"
      >
        ${number(value)}
      </text>
    `;
  }

  // Group overlapping points for visualization only.
  // All business metrics are calculated in the backend.

  const grouped = new Map();

  for (const point of points) {
    const key = `${point.errors}:${point.products}`;

    if (grouped.has(key)) {
      grouped.get(key).users += 1;
    } else {
      grouped.set(key, {
        errors: point.errors,
        products: point.products,
        users: 1,
      });
    }
  }

  const circles = [...grouped.values()].map(point => {
    const radius = Math.min(
      16,
      5 + Math.sqrt(point.users - 1) * 3
    );

    const description =
      `${point.errors} errors, ` +
      `${point.products} products, ` +
      `${point.users} user(s)`;

    return `
      <circle
        cx="${x(point.errors)}"
        cy="${y(point.products)}"
        r="${radius}"
        class="error-scatter-point"
        tabindex="0"
        aria-label="${escape(description)}"
      >
        <title>${escape(description)}</title>
      </circle>
    `;
  }).join('');

  return `
    <div class="error-scatter-container">
      <svg
        viewBox="0 0 ${width} ${height}"
        class="error-scatter-chart"
        role="img"
        aria-label="Scatter plot of recorded errors and saved products per user"
      >
        ${grid}

        <line
          x1="${left}"
          y1="${top}"
          x2="${left}"
          y2="${height - bottom}"
          class="error-scatter-axis"
        />

        <line
          x1="${left}"
          y1="${height - bottom}"
          x2="${width - right}"
          y2="${height - bottom}"
          class="error-scatter-axis"
        />

        ${circles}

        <text
          x="${left + plotWidth / 2}"
          y="${height - 10}"
          text-anchor="middle"
          class="error-scatter-axis-title"
        >
          Application errors per user
        </text>

        <text
          transform="translate(18 ${top + plotHeight / 2}) rotate(-90)"
          text-anchor="middle"
          class="error-scatter-axis-title"
        >
          Saved products per user
        </text>

      </svg>
    </div>

    <p class="muted">
      Each point represents one or more users.
      Larger points indicate overlapping observations.
      Hover over a point to see its details.
    </p>
  `;
}


export function renderErrorsVsSavedProducts(data) {
  const correlation = Number.isFinite(data.correlation)
    ? data.correlation.toFixed(2)
    : 'N/A';

  return `
    <section aria-label="Application errors versus saved products">

      <div class="segment-row">
        ${[4, 8, 12].map(weeks => `
          <button
            class="pill ${data.windowWeeks === weeks ? 'active' : ''}"
            data-action="errorWeeks"
            data-value="${weeks}"
          >
            ${weeks} weeks
          </button>
        `).join('')}
      </div>

      <div class="kpis">

        ${card(`
          <p class="eyebrow">PEARSON CORRELATION</p>

          <div class="big">${correlation}</div>

          <small>
            Linear relationship between errors and saved products
          </small>
        `)}

        ${card(`
          <p class="eyebrow">USERS ANALYZED</p>

          <div class="big">
            ${number(data.userCount)}
          </div>

          <small>
            Registered users included in the analysis
          </small>
        `)}

        ${card(`
          <p class="eyebrow">CAPTURED ERRORS</p>

          <div class="big">
            ${number(data.totalErrors)}
          </div>

          <small>
            ${number(data.averageErrorsPerUser)} average per user
          </small>
        `)}

        ${card(`
          <p class="eyebrow">SAVED PRODUCTS</p>

          <div class="big">
            ${number(data.totalProducts)}
          </div>

          <small>
            ${number(data.averageProductsPerUser)} average per user
          </small>
        `)}

      </div>

      ${card(`
        <p class="eyebrow">TYPE T* (1+2) · JULIANA</p>

        <h2>
          Is there a relationship between the number of
          errors a user experiences and the number of
          products they save?
        </h2>

        <p class="muted">
          Analysis across ${number(data.windowWeeks)}
          calendar weeks · America/Bogota
        </p>

        ${renderScatterPlot(data.points)}
      `)}

      <div class="two-col">

        ${card(`
          <h2>Error distribution</h2>

          <dl class="error-breakdown">
            <div>
              <dt>Users with recorded errors</dt>
              <dd>${number(data.usersWithErrors)}</dd>
            </div>

            <div>
              <dt>Users without recorded errors</dt>
              <dd>${number(data.usersWithoutErrors)}</dd>
            </div>
          </dl>
        `)}

        ${card(`
          <h2>Product distribution</h2>

          <dl class="error-breakdown">
            <div>
              <dt>Users with saved products</dt>
              <dd>${number(data.usersWithProducts)}</dd>
            </div>

            <div>
              <dt>Users without saved products</dt>
              <dd>${number(data.usersWithoutProducts)}</dd>
            </div>
          </dl>
        `)}

      </div>

      ${card(`
        <p class="eyebrow">BUSINESS INSIGHT</p>

        <h2>What does this tell us?</h2>

        <p>${correlationInsight(data)}</p>

        <p class="muted">
          Correlation does not imply causation.
          Users who interact more frequently with the app
          may have more opportunities both to experience
          errors and to save products.
        </p>

        <p class="muted">
          This analysis includes captured technical errors
          and currently existing products created during
          the selected period. Deleted products and
          unrecorded errors are not included.
        </p>
      `)}

    </section>
  `;
}