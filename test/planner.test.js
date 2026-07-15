import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKS,
  buildTimeline,
  calculateReadiness,
  createMarkdown,
  defaultState,
  dependencyList,
  normalizeState,
} from '../src/planner.js';

test('default state schedules a release seven days ahead', () => {
  const state = defaultState(new Date('2026-07-15T04:00:00.000Z'));
  assert.equal(state.releaseDate, '2026-07-22');
  assert.equal(state.responseHours, 8);
});

test('normalization accepts valid dates and rejects unsupported response windows', () => {
  const fallback = defaultState(new Date('2026-07-15T00:00:00.000Z'));
  const state = normalizeState({ ...fallback, releaseDate: '2026-08-01', responseHours: 99 }, fallback);
  assert.equal(state.releaseDate, '2026-08-01');
  assert.equal(state.responseHours, 8);
});

test('readiness uses transparent weights and reports the first open action', () => {
  const state = defaultState();
  state.checks.inventory = true;
  state.checks.preview = true;
  state.checks.tests = true;
  const result = calculateReadiness(state);
  assert.equal(result.score, 62);
  assert.equal(result.tier, 'Rehearsal needed');
  assert.match(result.nextAction, /rollback/i);
});

test('all readiness checks total exactly one hundred', () => {
  const state = defaultState();
  state.checks = Object.fromEntries(CHECKS.map(({ id }) => [id, true]));
  assert.deepEqual(calculateReadiness(state), { score: 100, tier: 'Ready to receive', open: [], nextAction: 'Keep the plan current and run the drill.' });
});

test('timeline includes intake and response deadline at the selected offset', () => {
  const timeline = buildTimeline('2026-07-22', 8);
  assert.equal(timeline.length, 5);
  assert.equal(timeline[2].date.toISOString(), '2026-07-22T14:00:00.000Z');
  assert.equal(timeline[3].date.toISOString(), '2026-07-22T22:00:00.000Z');
});

test('dependency parsing trims, deduplicates, and accepts commas or lines', () => {
  assert.deepEqual(dependencyList('next, react\nnext, @vercel/functions'), ['next', 'react', '@vercel/functions']);
});

test('Markdown export contains ownership, checks, and timeline', () => {
  const state = defaultState(new Date('2026-07-15T00:00:00.000Z'));
  state.owner = 'Platform rotation';
  const markdown = createMarkdown(state);
  assert.match(markdown, /Platform rotation/);
  assert.match(markdown, /## Readiness checks/);
  assert.match(markdown, /## Drill timeline/);
});
