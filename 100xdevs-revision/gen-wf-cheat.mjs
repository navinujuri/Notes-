// gen-wf-cheat.mjs — emit a self-contained workflow that generates a quick-reference
// CHEAT SHEET for every track, one agent per track.
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
  name: 'cheatsheet-100x',
  description: 'Generate a code-forward quick-reference cheat sheet for every 100xDevs track',
  phases: [{ title: 'Generate', detail: 'one agent per track' }],
};

const TRACKS = ${JSON.stringify(compact)};

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    trackId: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              properties: { label: { type: 'string' }, code: { type: 'string' }, note: { type: 'string' } },
              required: ['label'],
            },
          },
        },
        required: ['title', 'items'],
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['trackId', 'sections', 'tips'],
};

function promptFor(t) {
  const steps = t.steps.map((s, i) => (i + 1) + '. ' + s).join('\\n');
  return [
    'You are a staff-level engineer writing a CONCISE, CODE-FORWARD cheat sheet for quick reference (the kind you glance at while coding or right before an interview) on the topic below. Prioritise real commands/syntax/snippets over prose. Be technically accurate and idiomatic.',
    '',
    'TOPIC: "' + t.title + '"',
    'Lessons it covers (for scope):',
    steps,
    '',
    'Produce JSON with:',
    '1) sections: 4-8 grouped sections, each with a short title and a list of items. Each item has: label (the thing / when to use it), OPTIONAL code (a minimal correct snippet or command — include whenever code helps; multi-line allowed with \\n), and OPTIONAL note (a terse gotcha or usage detail). Cover setup/commands, core syntax/APIs, common patterns, and config a dev needs at a glance for THIS topic.',
    '2) tips: 4-8 short quick-tips / common gotchas.',
    'Keep it dense and scannable — this is a reference, not a tutorial. Set trackId to exactly: ' + t.id,
  ].join('\\n');
}

phase('Generate');
log('Generating cheat sheets for ' + TRACKS.length + ' tracks...');
const results = await parallel(
  TRACKS.map((t) => () =>
    agent(promptFor(t), { label: 'cheat:' + t.id, phase: 'Generate', schema: SCHEMA })
      .then((r) => (r ? { ...r, trackId: r.trackId || t.id } : null))
  )
);
const ok = results.filter(Boolean);
log('Done: ' + ok.length + '/' + TRACKS.length + ' cheat sheets generated.');
return ok;
`;

fs.writeFileSync(path.resolve("wf-cheat.mjs"), script, "utf8");
console.log(`Wrote wf-cheat.mjs (${script.length} chars) for ${compact.length} tracks.`);
