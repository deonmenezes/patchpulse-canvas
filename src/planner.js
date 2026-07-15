export const STORAGE_KEY = 'patchpulse-canvas:v1';

export const CHECKS = [
  { id: 'inventory', label: 'Affected surfaces are inventoried', weight: 18, action: 'Map every deployable that carries the framework.' },
  { id: 'preview', label: 'A production-like preview is available', weight: 20, action: 'Prepare an isolated environment for the patch candidate.' },
  { id: 'tests', label: 'Critical paths have automated tests', weight: 24, action: 'Cover sign-in, data writes, and the highest-value user flow.' },
  { id: 'rollback', label: 'Rollback has been rehearsed', weight: 22, action: 'Time a rollback and record the exact command or control.' },
  { id: 'monitoring', label: 'Post-release signals have owners', weight: 16, action: 'Assign an owner to errors, latency, and auth signals.' },
];

export function defaultState(today = new Date()) {
  const release = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    service: 'Customer web app',
    owner: '',
    releaseDate: release.toISOString().slice(0, 10),
    responseHours: 8,
    dependencies: 'next\nreact\n@vercel/functions',
    checks: Object.fromEntries(CHECKS.map(({ id }) => [id, false])),
  };
}

export function normalizeState(input, fallback = defaultState()) {
  const response = Number(input?.responseHours);
  return {
    service: String(input?.service ?? fallback.service).slice(0, 80),
    owner: String(input?.owner ?? fallback.owner).slice(0, 80),
    releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(input?.releaseDate ?? '') ? input.releaseDate : fallback.releaseDate,
    responseHours: [2, 4, 8, 24, 48].includes(response) ? response : fallback.responseHours,
    dependencies: String(input?.dependencies ?? fallback.dependencies).slice(0, 1000),
    checks: Object.fromEntries(CHECKS.map(({ id }) => [id, Boolean(input?.checks?.[id])])),
  };
}

export function calculateReadiness(state) {
  const score = CHECKS.reduce((total, item) => total + (state.checks[item.id] ? item.weight : 0), 0);
  const open = CHECKS.filter((item) => !state.checks[item.id]);
  const tier = score >= 80 ? 'Ready to receive' : score >= 55 ? 'Rehearsal needed' : 'Response exposed';
  return { score, tier, open, nextAction: open[0]?.action ?? 'Keep the plan current and run the drill.' };
}

export function buildTimeline(releaseDate, responseHours) {
  const release = new Date(`${releaseDate}T14:00:00.000Z`);
  if (Number.isNaN(release.getTime())) return [];
  const points = [
    { offset: -168, label: 'Inventory lock', detail: 'Confirm affected apps, versions, and owners.' },
    { offset: -48, label: 'Dry run', detail: 'Exercise upgrade, tests, and rollback in preview.' },
    { offset: 0, label: 'Patch intake', detail: 'Read the advisory and validate scope before changing code.' },
    { offset: responseHours, label: 'Promote deadline', detail: 'Ship the verified patch inside the chosen response window.' },
    { offset: responseHours + 24, label: 'Close the loop', detail: 'Review signals, document drift, and close the incident.' },
  ];
  return points.map((point) => ({ ...point, date: new Date(release.getTime() + point.offset * 60 * 60 * 1000) }));
}

export function dependencyList(value) {
  return [...new Set(String(value).split(/[\n,]/).map((item) => item.trim()).filter(Boolean))].slice(0, 12);
}

export function formatMoment(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(date);
}

export function createMarkdown(state) {
  const readiness = calculateReadiness(state);
  const timeline = buildTimeline(state.releaseDate, state.responseHours);
  const dependencies = dependencyList(state.dependencies);
  return [
    `# ${state.service} — patch response canvas`, '',
    `- Owner: ${state.owner || 'Unassigned'}`,
    `- Readiness: ${readiness.score}% — ${readiness.tier}`,
    `- Target security release: ${state.releaseDate}`,
    `- Response window: ${state.responseHours} hours`,
    `- Watched dependencies: ${dependencies.join(', ') || 'None listed'}`, '',
    '## Readiness checks', ...CHECKS.map((item) => `- [${state.checks[item.id] ? 'x' : ' '}] ${item.label}`), '',
    '## Drill timeline', ...timeline.map((item) => `- **${formatMoment(item.date)} — ${item.label}:** ${item.detail}`), '',
    `Next move: ${readiness.nextAction}`, '', '_Generated locally with PatchPulse Canvas._',
  ].join('\n');
}
