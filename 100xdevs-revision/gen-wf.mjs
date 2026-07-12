// gen-wf.mjs — emit a self-contained workflow script (data embedded) that generates
// SDE-2 interview-prep content for every track, one agent per track.
import fs from "node:fs";
import path from "node:path";

const tracks = JSON.parse(fs.readFileSync(path.resolve("out/tracks.json"), "utf8"));
const compact = tracks.map((t) => ({
  id: t.id,
  title: (t.title || t.id).trim(),
  cohort: t.cohort,
  steps: t.lessons.map((l) => (l.title || l.id).trim()),
}));

const script = `export const meta = {
  name: 'interview-prep-100x',
  description: 'Generate SDE-2 interview-prep notes for every 100xDevs track (bullets + example + Q&A)',
  phases: [{ title: 'Generate', detail: 'one agent per track' }],
};

const TRACKS = ${JSON.stringify(compact)};

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    trackId: { type: 'string' },
    bullets: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { step: { type: 'string' }, point: { type: 'string' } },
        required: ['step', 'point'],
      },
    },
    example: {
      type: 'object', additionalProperties: false,
      properties: { title: { type: 'string' }, body: { type: 'string' } },
      required: ['title', 'body'],
    },
    qa: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { q: { type: 'string' }, a: { type: 'string' } },
        required: ['q', 'a'],
      },
    },
  },
  required: ['trackId', 'bullets', 'example', 'qa'],
};

function promptFor(t) {
  const steps = t.steps.map((s, i) => (i + 1) + '. ' + s).join('\\n');
  return [
    'You are a staff-level engineer writing crisp revision + interview-prep notes for a developer with 3+ years of experience (SDE-2 level) revising the topic below. Be technically accurate and specific; no fluff, no marketing tone. If a step title is vague, infer the standard concept it teaches.',
    '',
    'TOPIC: "' + t.title + '"',
    'It contains these lessons/steps (in order):',
    steps,
    '',
    'Produce JSON with:',
    '1) bullets: ONE bullet per step above, SAME order and count. Each bullet: step = a short clean label for that step; point = 1-3 sentences on what it is AND why it matters / the interview angle. Consolidate only if a step is truly trivial.',
    '2) example: ONE concrete, realistic real-world scenario that ties the whole topic together (title + a short paragraph). Prefer a scenario an SDE-2 would actually build/debug.',
    '3) qa: 5-8 interview questions an SDE-2 would face on this topic, each with a strong, correct, concise answer (2-5 sentences). Favor depth/trade-offs over trivia.',
    'Set trackId to exactly: ' + t.id,
  ].join('\\n');
}

phase('Generate');
log('Generating interview prep for ' + TRACKS.length + ' tracks...');
const results = await parallel(
  TRACKS.map((t) => () =>
    agent(promptFor(t), { label: 'prep:' + t.id, phase: 'Generate', schema: SCHEMA })
      .then((r) => (r ? { ...r, trackId: r.trackId || t.id } : null))
  )
);
const ok = results.filter(Boolean);
log('Done: ' + ok.length + '/' + TRACKS.length + ' tracks generated.');
return ok;
`;

fs.writeFileSync(path.resolve("wf-interview.mjs"), script, "utf8");
console.log(`Wrote wf-interview.mjs (${script.length} chars) for ${compact.length} tracks.`);
