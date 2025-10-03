import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { exportStories } from '../export-augment-specs.mjs';
import YAML from 'yaml';

const sampleStory = `# Story 42: Sample Story

## Status
In Progress

## Story
**As a** developer
**I want** tooling
**so that** I can ship faster.

## Acceptance Criteria
1. Create tooling scaffolding
2. Support filtering
3. Provide manifest output

## Tasks / Subtasks
- [ ] Prepare environment
  - [x] Install dependencies
- [x] Build exporter

## Dev Notes
### Context
- Use minimal dependencies
- Ensure compatibility

## Testing
- Validate parser handles bullets
- Ensure manifest references new file
`;

async function withTempDirs(fn) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'augment-specs-test-'));
  const storiesDir = path.join(base, 'stories');
  const outDir = path.join(base, 'out');
  await mkdir(storiesDir, { recursive: true });
  try {
    return await fn({ base, storiesDir, outDir });
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

test('exports JSON specs with manifest', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const storyPath = path.join(storiesDir, 'sample.md');
    await writeFile(storyPath, sampleStory, 'utf8');

    const entries = await exportStories({
      tokens: [],
      format: 'json',
      outDir,
      storiesDir,
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    const [entry] = entries;
    assert.equal(entry.storyId, '42');
    assert.match(entry.file, /\.json$/);
    assert.deepEqual(entry.files, [entry.file]);

    const specPath = path.join(outDir, path.basename(entry.file));
    const spec = JSON.parse(await readFile(specPath, 'utf8'));
    assert.equal(spec.story.status, 'In Progress');
    assert.equal(spec.story.acceptanceCriteria.length, 3);
    assert.equal(spec.story.tasks.length, 2);

    const manifestPath = path.join(outDir, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    assert.equal(manifest.entries.length, 1);
  });
});

test('supports YAML format and skipping manifest', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const storyPath = path.join(storiesDir, 'sample.md');
    await writeFile(storyPath, sampleStory, 'utf8');

    const entries = await exportStories({
      tokens: [],
      format: 'yaml',
      outDir,
      storiesDir,
      manifest: false,
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    const [entry] = entries;
    assert.match(entry.file, /\.yaml$/);

    const specPath = path.join(outDir, path.basename(entry.file));
    const yamlContents = await readFile(specPath, 'utf8');
    assert.match(yamlContents, /story:/);

    const manifestExists = await readFile(path.join(outDir, 'manifest.json')).then(() => true).catch(() => false);
    assert.equal(manifestExists, false);
  });
});

test('supports multiple formats and status filtering', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const readyStory = sampleStory.replace('In Progress', 'Ready');
    await writeFile(path.join(storiesDir, 'ready.md'), readyStory, 'utf8');
    await writeFile(path.join(storiesDir, 'progress.md'), sampleStory, 'utf8');

    const entries = await exportStories({
      formats: ['json', 'yaml'],
      outDir,
      storiesDir,
      statusFilters: ['ready'],
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    const [entry] = entries;
    assert.equal(entry.status, 'Ready');
    assert.ok(entry.files.length === 2);
    assert(entry.files.some((file) => file.endsWith('.json')));
    assert(entry.files.some((file) => file.endsWith('.yaml')));
  });
});

test('dry run with stats does not write files but returns summary', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    await writeFile(path.join(storiesDir, 'sample.md'), sampleStory, 'utf8');

    const logs = [];
    const summaryPath = path.join(outDir, 'reports', 'summary.json');
    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      stats: true,
      summaryFile: summaryPath,
      log: (message) => logs.push(message),
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    assert(logs.some((line) => line.includes('Dry run enabled')));
    assert(logs.some((line) => line.includes('Export Summary')));
    assert(logs.some((line) => line.includes('Summary written to')));

    const manifestExists = await readFile(path.join(outDir, 'manifest.json')).then(() => true).catch(() => false);
    assert.equal(manifestExists, false);

    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    assert.equal(summary.stats.processed, 1);
    assert.equal(summary.entries.length, 1);
    assert.equal(summary.stats.tasksTopLevel, 2);
    assert.equal(summary.stats.missingSectionsBySeverity.critical, 0);
    assert.equal(summary.options.summaryFormat, 'json');
    assert.deepEqual(summary.stats.topMissingSections, []);
  });
});

test('strict mode throws when required sections missing', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const minimalStory = `# Story 10: Minimal\n\n## Status\nDraft\n\n## Story\nPlaceholder\n`;
    await writeFile(path.join(storiesDir, 'minimal.md'), minimalStory, 'utf8');

    await assert.rejects(
      () => exportStories({
        outDir,
        storiesDir,
        strict: true,
        log: () => {},
        warn: () => {},
      }),
      /Strict mode failure/,
    );
  });
});

test('records missing sections metadata when sections absent', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const partialStory = sampleStory.replace(/## Testing[\s\S]*/, '');
    await writeFile(path.join(storiesDir, 'partial.md'), partialStory, 'utf8');

    const summaryPath = path.join(outDir, 'summary.json');
    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: summaryPath,
      topMissingSections: 1,
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    assert(entries[0].missingSections.includes('Testing'));
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    assert.equal(summary.stats.missingSections.Testing, 1);
    assert.equal(summary.entries[0].missingSectionsDetail[0].severity, 'critical');
    assert.equal(summary.entries[0].missingScore, 2);
    assert(summary.stats.missingScoreTotal >= 2);
    assert(summary.stats.topMissingSections.some((item) => item.section === 'Testing'));
  });
});

test('missingOnly only exports stories with missing required sections', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    await writeFile(path.join(storiesDir, 'complete.md'), sampleStory, 'utf8');
    const partial = sampleStory.replace(/## Testing[\s\S]*/, '');
    await writeFile(path.join(storiesDir, 'partial.md'), partial, 'utf8');

    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      missingOnly: true,
      requiredSections: ['Testing'],
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    assert(entries[0].source.endsWith('partial.md'));
  });
});

test('custom required sections respected in strict mode', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const noDevNotes = sampleStory.replace('## Dev Notes\n### Context\n- Use minimal dependencies\n- Ensure compatibility\n\n', '');
    await writeFile(path.join(storiesDir, 'nodev.md'), noDevNotes, 'utf8');

    await assert.rejects(
      () => exportStories({
        outDir,
        storiesDir,
        strict: true,
        requiredSections: ['Dev Notes'],
        log: () => {},
        warn: () => {},
      }),
      /Strict mode failure/,
    );
  });
});

test('invalid section alias raises helpful error', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    await writeFile(path.join(storiesDir, 'sample.md'), sampleStory, 'utf8');

    await assert.rejects(
      () => exportStories({
        outDir,
        storiesDir,
        requiredSections: ['UnknownSection'],
        log: () => {},
        warn: () => {},
      }),
      /Unknown section/,
    );
  });
});

test('summary supports yaml output with quiet mode', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    await writeFile(path.join(storiesDir, 'sample.md'), sampleStory, 'utf8');
    const summaryPath = path.join(outDir, 'summary.yaml');
    const logs = [];
    const entries = await exportStories({
      outDir,
      storiesDir,
      summaryFile: summaryPath,
      summaryFormat: 'yaml',
      quiet: true,
      log: (message) => logs.push(message),
      warn: () => {},
    });

    assert.equal(entries.length, 1);
    assert.equal(logs.filter((line) => line.includes('Would export') || line.includes('Exported')).length, 0);
    const summary = YAML.parse(await readFile(summaryPath, 'utf8'));
    assert.equal(summary.options.summaryFormat, 'yaml');
    assert.equal(summary.entries.length, 1);
    assert(Array.isArray(summary.stats.topMissingSections));
  });
});

test('markdown summary renders readable snapshot', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const partialStory = sampleStory.replace(/## Testing[\s\S]*/, '');
    await writeFile(path.join(storiesDir, 'partial.md'), partialStory, 'utf8');
    const summaryPath = path.join(outDir, 'summary.md');

    await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: summaryPath,
      summaryFormat: 'md',
      topMissingSections: 1,
      log: () => {},
      warn: () => {},
    });

    const markdown = await readFile(summaryPath, 'utf8');
    assert(markdown.includes('# Augment Export Summary'));
    assert(markdown.includes('## Top Missing Sections'));
    assert(markdown.includes('###'));
  });
});

test('optional sections marked with optional severity when not required', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const noDevNotes = sampleStory.replace('## Dev Notes\n### Context\n- Use minimal dependencies\n- Ensure compatibility\n\n', '');
    await writeFile(path.join(storiesDir, 'nodev.md'), noDevNotes, 'utf8');

    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: path.join(outDir, 'summary.json'),
      requiredSections: ['Story'],
      log: () => {},
      warn: () => {},
    });

    const detail = entries[0].missingSectionsDetail.find((item) => item.section === 'Dev Notes');
    assert.equal(detail.severity, 'optional');
    assert.equal(detail.weight, 1);
    assert.equal(entries[0].missingScore, 1);
  });
});

test('statusWarn records warnings for unexpected statuses', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    await writeFile(path.join(storiesDir, 'sample.md'), sampleStory, 'utf8');
    const warnings = [];
    await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      statusWarn: ['ready'],
      log: () => {},
      warn: (message) => warnings.push(message),
    });

    assert.equal(warnings.length, 1);
    assert(/Status warning/.test(warnings[0]));
  });
});

test('custom weights adjust missing score totals', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const partialStory = sampleStory.replace(/## Testing[\s\S]*/, '');
    await writeFile(path.join(storiesDir, 'partial.md'), partialStory, 'utf8');

    const summaryPath = path.join(outDir, 'summary.json');
    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: summaryPath,
      criticalWeight: 5,
      optionalWeight: 3,
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries[0].missingScore, 5); // Testing treated as critical by default
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    assert.equal(summary.stats.missingScoreTotal, 5);
  });
});

test('weights config file overrides section metadata and goals', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const partialStory = sampleStory.replace(/## Testing[\s\S]*/, '');
    await writeFile(path.join(storiesDir, 'partial.md'), partialStory, 'utf8');

    const config = {
      criticalWeight: 6,
      sections: {
        Testing: {
          weight: 8,
          goal: 'Ensure QA coverage',
        },
        'Dev Notes': {
          severity: 'optional',
          goal: 'Capture context',
        },
      },
    };
    const configPath = path.join(outDir, 'weights.json');
    await mkdir(outDir, { recursive: true });
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: path.join(outDir, 'summary.json'),
      weightsConfig: configPath,
      log: () => {},
      warn: () => {},
    });

    const detail = entries[0].missingSectionsDetail.find((item) => item.section === 'Testing');
    assert.equal(detail.weight, 8);
    assert.equal(detail.goal, 'Ensure QA coverage');
  });
});

test('baseline summary comparison reports regressions and improvements', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const partialStory = sampleStory.replace(/## Testing[\s\S]*/, '');
    const storyPath = path.join(storiesDir, 'story.md');
    await writeFile(storyPath, partialStory, 'utf8');

    const baselinePath = path.join(outDir, 'baseline.json');
    await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: baselinePath,
      log: () => {},
      warn: () => {},
    });

    // Update story to include testing section
    await writeFile(storyPath, sampleStory, 'utf8');
    const summaryPath = path.join(outDir, 'summary.json');
    const entries = await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: summaryPath,
      baselineSummary: baselinePath,
      log: () => {},
      warn: () => {},
    });

    assert.equal(entries[0].missingSections, undefined);
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    assert(summary.delta);
    assert.equal(summary.delta.improvements.length, 1);
    assert.equal(summary.delta.regressions.length, 0);
  });
});

test('top missing sections surfaces highest counts', async () => {
  await withTempDirs(async ({ storiesDir, outDir }) => {
    const noTesting = sampleStory.replace('## Testing\n- Validate parser handles bullets\n- Ensure manifest references new file\n', '');
    const noDevNotes = sampleStory.replace('## Dev Notes\n### Context\n- Use minimal dependencies\n- Ensure compatibility\n\n', '');
    await writeFile(path.join(storiesDir, 'notesting.md'), noTesting, 'utf8');
    await writeFile(path.join(storiesDir, 'nodev.md'), noDevNotes, 'utf8');

    const summaryPath = path.join(outDir, 'summary.json');
    const logs = [];
    await exportStories({
      outDir,
      storiesDir,
      dryRun: true,
      summaryFile: summaryPath,
      topMissingSections: 2,
      stats: true,
      log: (message) => logs.push(message),
      warn: () => {},
    });

    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    const top = summary.stats.topMissingSections;
    assert.equal(top.length, 2);
    const sections = top.map((item) => item.section).sort();
    assert.deepEqual(sections, ['Dev Notes', 'Testing']);
    assert(top[0].count >= top[1].count);
    assert(logs.some((line) => line.startsWith('Top missing sections')));
  });
});
