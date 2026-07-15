import { CHECKS, STORAGE_KEY, buildTimeline, calculateReadiness, createMarkdown, defaultState, dependencyList, formatMoment, normalizeState } from './src/planner.js';

const app = document.querySelector('#app');
let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return normalizeState(saved ? JSON.parse(saved) : defaultState());
  } catch {
    return defaultState();
  }
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function render() {
  const readiness = calculateReadiness(state);
  const timeline = buildTimeline(state.releaseDate, state.responseHours);
  const dependencies = dependencyList(state.dependencies);

  app.innerHTML = `
    <form class="plan-form" id="plan-form">
      <div class="form-intro">
        <span class="step-number">01</span>
        <div><h3>Set the release contract</h3><p>Define who owns the first decision and how quickly a verified patch should move.</p></div>
      </div>
      <div class="field-grid">
        <label>Service or app<input name="service" maxlength="80" value="${escapeHtml(state.service)}" required /></label>
        <label>Response owner<input name="owner" maxlength="80" value="${escapeHtml(state.owner)}" placeholder="Name or rotation" /></label>
        <label>Expected release date<input name="releaseDate" type="date" value="${state.releaseDate}" required /></label>
        <label>Verified response window
          <select name="responseHours">
            ${[2, 4, 8, 24, 48].map((hours) => `<option value="${hours}" ${state.responseHours === hours ? 'selected' : ''}>${hours < 24 ? `${hours} hours` : `${hours / 24} day${hours > 24 ? 's' : ''}`}</option>`).join('')}
          </select>
        </label>
      </div>
      <label class="dependency-field">Watched dependencies <span>one per line or comma-separated</span>
        <textarea name="dependencies" rows="4" placeholder="next&#10;react">${escapeHtml(state.dependencies)}</textarea>
      </label>
      <fieldset>
        <legend><span class="step-number">02</span><span><strong>Mark what is actually ready</strong><small>Honest gaps create a useful drill, not a bad score.</small></span></legend>
        <div class="check-list">
          ${CHECKS.map((item) => `<label class="check-row"><input type="checkbox" name="check-${item.id}" ${state.checks[item.id] ? 'checked' : ''} /><span class="fake-check" aria-hidden="true"></span><span><strong>${item.label}</strong><small>${item.weight} readiness points</small></span></label>`).join('')}
        </div>
      </fieldset>
    </form>

    <aside class="readiness-panel" aria-live="polite">
      <div class="score-topline"><span>Readiness pulse</span><span>${readiness.score}/100</span></div>
      <div class="score-track" role="progressbar" aria-valuenow="${readiness.score}" aria-valuemin="0" aria-valuemax="100" aria-label="Patch readiness"><span style="width:${readiness.score}%"></span></div>
      <p class="tier" data-tier="${readiness.score >= 80 ? 'good' : readiness.score >= 55 ? 'mid' : 'low'}">${readiness.tier}</p>
      <p class="next-action"><span>Next move</span>${readiness.nextAction}</p>
      <div class="watch-list">
        <span>Watch surface</span>
        ${dependencies.length ? `<ul>${dependencies.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="empty-copy">Add at least one dependency to define the watch surface.</p>'}
      </div>
      <div class="timeline-block">
        <div class="timeline-heading"><span>Release drill</span><span>UTC</span></div>
        ${timeline.length ? `<ol class="timeline">${timeline.map((item) => `<li class="${item.offset === 0 ? 'release-point' : ''}"><time datetime="${item.date.toISOString()}">${formatMoment(item.date)}</time><strong>${item.label}</strong><p>${item.detail}</p></li>`).join('')}</ol>` : '<p class="empty-copy">Choose a valid release date to build the drill.</p>'}
      </div>
      <div class="panel-actions"><button class="primary-button" type="button" id="copy-plan">Copy plan</button><button class="ghost-button" type="button" id="reset-plan">Reset</button></div>
      <p class="save-note" id="save-note">Saved locally when a field changes</p>
    </aside>
  `;

  bindEvents();
}

function readForm(formElement) {
  const form = new FormData(formElement);
  return normalizeState({
    service: form.get('service'),
    owner: form.get('owner'),
    releaseDate: form.get('releaseDate'),
    responseHours: form.get('responseHours'),
    dependencies: form.get('dependencies'),
    checks: Object.fromEntries(CHECKS.map(({ id }) => [id, form.get(`check-${id}`) === 'on'])),
  }, state);
}

function bindEvents() {
  document.querySelector('#plan-form').addEventListener('change', (event) => {
    state = readForm(event.currentTarget);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
  });

  document.querySelector('#copy-plan').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(createMarkdown(state));
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy plan'; }, 1600);
    } catch {
      document.querySelector('#save-note').textContent = 'Clipboard unavailable — try a secure browser context.';
    }
  });

  document.querySelector('#reset-plan').addEventListener('click', () => {
    state = defaultState();
    localStorage.removeItem(STORAGE_KEY);
    render();
  });
}

render();
