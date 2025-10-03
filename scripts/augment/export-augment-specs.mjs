#!/usr/bin/env node

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const defaultStoriesDir = path.join(projectRoot, 'docs', 'stories');
const defaultOutputDir = path.join(projectRoot, 'augment', 'specs');
const SUPPORTED_FORMATS = new Set(['json', 'yaml']);
const SUMMARY_FORMATS = new Set(['json', 'yaml', 'md']);

const SECTION_VALIDATORS = {
  'Story': (story) => !!(story.userStory && story.userStory.trim()),
  'Acceptance Criteria': (story) => Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0,
  'Tasks / Subtasks': (story) => Array.isArray(story.tasks) && story.tasks.length > 0,
  'Dev Notes': (story) => story.devNotes && Object.keys(story.devNotes).length > 0,
  'Testing': (story) => Array.isArray(story.testing) && story.testing.length > 0,
};

const SECTION_ALIASES = {
  story: 'Story',
  'acceptance criteria': 'Acceptance Criteria',
  'acceptancecriteria': 'Acceptance Criteria',
  'tasks / subtasks': 'Tasks / Subtasks',
  tasks: 'Tasks / Subtasks',
  taskssubtasks: 'Tasks / Subtasks',
  'dev notes': 'Dev Notes',
  devnotes: 'Dev Notes',
  testing: 'Testing',
};

const DEFAULT_REQUIRED_SECTIONS = Object.keys(SECTION_VALIDATORS);

function parseNumber(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected numeric value but received "${value}"`);
  }
  return parsed;
}

function resolvePathMaybe(relativePath) {
  if (!relativePath) {
    return null;
  }
  return path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(projectRoot, relativePath);
}

async function readStructuredFile(filePath) {
  const absolutePath = resolvePathMaybe(filePath);
  if (!absolutePath) {
    return null;
  }
  const content = await fs.readFile(absolutePath, 'utf8');
  if (absolutePath.toLowerCase().endsWith('.yaml') || absolutePath.toLowerCase().endsWith('.yml')) {
    return YAML.parse(content);
  }
  return JSON.parse(content);
}

function renderMarkdownSummary(summary) {
  const lines = [];
  lines.push(`# Augment Export Summary`);
  lines.push('');
  lines.push(`Generated at: ${summary.generatedAt}`);
  lines.push('');
  lines.push('## Stats');
  const stats = summary.stats || {};
  const entries = [
    ['Stories processed', stats.processed],
    ['Stories exported', stats.exported],
    ['Stories skipped', stats.skipped],
    ['Formats emitted', (stats.formats || []).join(', ') || '—'],
    ['Acceptance criteria', stats.acceptanceCriteria],
    ['Top-level tasks', stats.tasksTopLevel],
    ['Total tasks (incl. subtasks)', stats.tasksTotal],
    ['Missing score total', stats.missingScoreTotal],
  ];
  entries.forEach(([label, value]) => {
    if (value !== undefined && value !== null) {
      lines.push(`- **${label}:** ${value}`);
    }
  });
  if (stats.statusWarnings && stats.statusWarnings.length) {
    lines.push(`- **Status warnings:** ${stats.statusWarnings.length}`);
  }
  lines.push('');

  if (stats.topMissingSections && stats.topMissingSections.length) {
    lines.push('## Top Missing Sections');
    lines.push('| Section | Count | Severity | Weight | Goal |');
    lines.push('| --- | --- | --- | --- | --- |');
    stats.topMissingSections.forEach((item) => {
      lines.push(`| ${item.section} | ${item.count} | ${item.severity} | ${item.weight ?? '—'} | ${item.goal ?? '—'} |`);
    });
    lines.push('');
  }

  if (summary.delta) {
    const delta = summary.delta;
    lines.push('## Baseline Delta');
    lines.push(`- **Baseline file:** ${delta.baselineFile}`);
    lines.push(`- **Baseline score:** ${delta.baselineMissingScore}`);
    lines.push(`- **Current score:** ${delta.currentMissingScore}`);
    lines.push(`- **Score delta:** ${delta.missingScoreDelta}`);
    lines.push(`- **Regressions:** ${delta.regressions.length}`);
    lines.push(`- **Improvements:** ${delta.improvements.length}`);
    lines.push('');
  }

  if (summary.entries && summary.entries.length) {
    lines.push('## Entries');
    summary.entries.forEach((entry) => {
      lines.push(`### ${entry.storyId || entry.title || entry.source}`);
      if (entry.status) {
        lines.push(`- **Status:** ${entry.status}`);
      }
      if (entry.missingSectionsDetail && entry.missingSectionsDetail.length) {
        lines.push('- **Missing Sections:**');
        entry.missingSectionsDetail.forEach((detail) => {
          lines.push(`  - ${detail.section} (severity=${detail.severity}, weight=${detail.weight ?? '—'}, goal=${detail.goal ?? '—'})`);
        });
      } else {
        lines.push('- **Missing Sections:** none');
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

function getSectionMeta(section, effectiveRequiredSections, sectionOverrides, criticalWeight, optionalWeight) {
  const defaultSeverity = effectiveRequiredSections.includes(section) ? 'critical' : 'optional';
  const override = sectionOverrides.get(section) || {};
  const severity = override.severity || defaultSeverity;
  const weight = override.weight !== undefined
    ? override.weight
    : (severity === 'critical' ? criticalWeight : optionalWeight);
  const goal = override.goal || null;
  return { severity, weight, goal };
}

function countAllTasks(tasks = []) {
  let total = 0;
  for (const task of tasks || []) {
    total += 1;
    if (Array.isArray(task.subtasks) && task.subtasks.length) {
      total += countAllTasks(task.subtasks);
    }
  }
  return total;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function extractSection(content, heading) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'm');
  const match = headingPattern.exec(content);
  if (!match) {
    return '';
  }

  let sectionStart = match.index + match[0].length;
  const trailing = content.slice(sectionStart);
  const offset = trailing.match(/^[ \t]*\r?\n?/);
  if (offset && offset[0]) {
    sectionStart += offset[0].length;
  }

  const remainder = content.slice(sectionStart);
  const nextHeadingPattern = /^##(?!#)\s+|^#(?!#)\s+/m;
  const nextIndex = remainder.search(nextHeadingPattern);
  const sectionEnd = nextIndex === -1 ? content.length : sectionStart + nextIndex;
  return content.slice(sectionStart, sectionEnd).trim();
}

function extractStatus(content) {
  const section = extractSection(content, 'Status');
  if (!section) {
    return '';
  }
  const firstLine = section.split('\n')[0].trim();
  return firstLine;
}

function parseNumberedList(section) {
  const lines = section.split('\n');
  const results = [];
  let current = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match) {
      if (current) {
        results.push(current.trim());
      }
      current = match[2];
    } else if (current) {
      current += ' ' + line;
    }
  }
  if (current) {
    results.push(current.trim());
  }
  return results;
}

function parseCheckboxTree(section) {
  const lines = section.split('\n');
  const root = [];
  const stack = [{ indent: -1, list: root }];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      continue;
    }
    const match = rawLine.match(/^(\s*)- \[( |x)\] (.*)$/);
    if (!match) {
      continue;
    }
    const indent = match[1].length;
    const done = match[2] === 'x';
    const title = match[3].trim();

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const node = { title, status: done ? 'done' : 'todo', subtasks: [] };
    stack[stack.length - 1].list.push(node);
    stack.push({ indent, list: node.subtasks });
  }

  return root;
}

function parseTestingList(section) {
  if (!section) {
    return [];
  }
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim());
}

function parseDevNotes(section) {
  if (!section) {
    return {};
  }
  const results = {};
  const lines = section.split('\n');
  let currentKey = null;
  let buffer = [];

  const flush = () => {
    if (!currentKey) {
      buffer = [];
      return;
    }
    const entries = buffer
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[-*+]\s+/, ''));
    results[currentKey] = entries;
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('### ')) {
      flush();
      currentKey = line.trim().replace(/^###\s+/, '');
    } else {
      buffer.push(line);
    }
  }

  flush();
  return results;
}

function normalizeSections(values = []) {
  const result = [];
  for (const raw of values) {
    if (!raw) {
      continue;
    }
    const key = raw.toString().trim().toLowerCase();
    if (!key) {
      continue;
    }
    const normalizedKey = SECTION_ALIASES[key] || SECTION_ALIASES[key.replace(/\s+/g, ' ')] || null;
    const target = normalizedKey && SECTION_VALIDATORS[normalizedKey] ? normalizedKey : null;
    if (!target) {
      throw new Error(`Unknown section "${raw}". Supported sections: ${DEFAULT_REQUIRED_SECTIONS.join(', ')}`);
    }
    if (!result.includes(target)) {
      result.push(target);
    }
  }
  return result;
}

function toSlug(value, maxLength = 96) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength);
  const trimmed = truncated.replace(/(^-|-$)+/g, '');
  return trimmed || normalized.slice(0, Math.min(maxLength, 32));
}

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function loadStoryFiles(storiesDir, filterTokens) {
  const entries = await fs.readdir(storiesDir);
  const files = entries.filter((name) => name.endsWith('.md'));
  if (!filterTokens.length) {
    return files;
  }
  return files.filter((file) => {
    const normalized = file.toLowerCase();
    return filterTokens.every((token) => normalized.includes(token));
  });
}

function extractHeader(content) {
  const match = content.match(/^#\s+Story\s+([^\n]+)$/m);
  if (!match) {
    return { storyId: '', title: '' };
  }
  const raw = match[1];
  const parts = raw.split(':');
  if (parts.length >= 2) {
    const storyId = parts.shift().trim();
    const title = parts.join(':').trim();
    return { storyId, title };
  }
  return { storyId: raw.trim(), title: '' };
}

async function buildSpec(fileName, context) {
  const { storiesDir, warn = console.warn } = context;
  const filePath = path.join(storiesDir, fileName);
  const content = await fs.readFile(filePath, 'utf8');

  const normalizedContent = content.replace(/\r\n/g, '\n');

  const { storyId, title } = extractHeader(normalizedContent);
  const status = extractStatus(normalizedContent);
  const storySection = extractSection(normalizedContent, 'Story');
  const acceptanceCriteriaSection = extractSection(normalizedContent, 'Acceptance Criteria');
  const tasksSection = extractSection(normalizedContent, 'Tasks / Subtasks');
  const devNotesSection = extractSection(normalizedContent, 'Dev Notes');
  const testingSection = extractSection(normalizedContent, 'Testing');

  if (!storySection) {
    warn(`Warning: Story section missing for ${fileName}`);
  }
  if (!acceptanceCriteriaSection) {
    warn(`Warning: Acceptance Criteria section missing for ${fileName}`);
  }
  if (!tasksSection) {
    warn(`Warning: Tasks / Subtasks section missing for ${fileName}`);
  }
  if (!devNotesSection) {
    warn(`Warning: Dev Notes section missing for ${fileName}`);
  }
  if (!testingSection) {
    warn(`Warning: Testing section missing for ${fileName}`);
  }

  const acceptanceCriteria = parseNumberedList(acceptanceCriteriaSection);
  const tasks = parseCheckboxTree(tasksSection);
  const devNotes = parseDevNotes(devNotesSection);
  const testing = parseTestingList(testingSection);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    source: {
      type: 'bmad-story',
      file: path.relative(projectRoot, filePath),
    },
    story: {
      id: storyId,
      title,
      status,
      userStory: storySection,
      acceptanceCriteria,
      tasks,
      devNotes,
      testing,
    },
    augment: {
      recommendedPlaybooks: {
        design: acceptanceCriteria.map((item, index) => ({
          name: `AC-${index + 1}`,
          goal: item,
        })),
        implementation: tasks,
        qa: testing,
      },
    },
  };
}

async function writeSpec(fileName, spec, context) {
  const { outDir, format } = context;
  const baseName = fileName.replace(/\.md$/, '');
  const slug = spec.story && (spec.story.id || spec.story.title)
    ? toSlug(`${spec.story.id}-${spec.story.title}`)
    : toSlug(baseName);
  const extension = format === 'yaml' ? 'yaml' : 'json';
  const outputPath = path.join(outDir, `${slug || baseName}.${extension}`);
  const data = format === 'yaml' ? YAML.stringify(spec) : JSON.stringify(spec, null, 2);
  await fs.writeFile(outputPath, data, 'utf8');
  return outputPath;
}

async function buildManifest(entries, context) {
  const { outDir } = context;
  const manifestPath = path.join(outDir, 'manifest.json');
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        entries,
      },
      null,
      2,
    ),
    'utf8',
  );
}

function parseArgs(argv) {
  const options = {
    tokens: [],
    format: 'json',
    formats: undefined,
    outDir: defaultOutputDir,
    manifest: true,
    statusFilters: [],
    dryRun: false,
    strict: false,
    stats: false,
    summaryFile: null,
    quiet: false,
    requiredSections: null,
    missingOnly: false,
    summaryFormat: null,
    criticalWeight: 2,
    optionalWeight: 1,
    statusWarn: [],
    topMissingSections: 0,
    weightsConfig: null,
    baselineSummary: null,
  };

  const toBoolean = (value) => {
    if (value === undefined) {
      return true;
    }
    return !['false', '0', 'no'].includes(String(value).toLowerCase());
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      options.tokens.push(arg.toLowerCase());
      continue;
    }

    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey.replace(/^--/, '');
    const nextValue = rawValue ?? argv[i + 1];

    switch (key) {
      case 'format':
        if (!rawValue) {
          i += 1;
        }
        options.formats = (nextValue || 'json');
        break;
      case 'formats':
        if (!rawValue) {
          i += 1;
        }
        options.formats = nextValue || 'json';
        break;
      case 'out':
      case 'output':
        if (!rawValue) {
          i += 1;
        }
        options.outDir = path.resolve(projectRoot, nextValue || defaultOutputDir);
        break;
      case 'status':
        if (!rawValue) {
          i += 1;
        }
        options.statusFilters = (nextValue || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0);
        break;
      case 'dry-run':
      case 'dryrun':
        if (rawValue !== undefined) {
          options.dryRun = toBoolean(rawValue);
        } else if (nextValue && /^(true|false|0|1|yes|no)$/i.test(nextValue)) {
          options.dryRun = toBoolean(nextValue);
          i += 1;
        } else {
          options.dryRun = true;
        }
        break;
      case 'strict':
        if (rawValue !== undefined) {
          options.strict = toBoolean(rawValue);
        } else if (nextValue && /^(true|false|0|1|yes|no)$/i.test(nextValue)) {
          options.strict = toBoolean(nextValue);
          i += 1;
        } else {
          options.strict = true;
        }
        break;
      case 'stats':
        if (rawValue !== undefined) {
          options.stats = toBoolean(rawValue);
        } else if (nextValue && /^(true|false|0|1|yes|no)$/i.test(nextValue)) {
          options.stats = toBoolean(nextValue);
          i += 1;
        } else {
          options.stats = true;
        }
        break;
      case 'summary':
        if (!rawValue) {
          i += 1;
        }
        options.summaryFile = nextValue ? nextValue.trim() : null;
        break;
      case 'summary-format':
      case 'summaryformat':
        if (!rawValue) {
          i += 1;
        }
        options.summaryFormat = (nextValue || '').trim().toLowerCase();
        break;
      case 'quiet':
        if (rawValue !== undefined) {
          options.quiet = toBoolean(rawValue);
        } else if (nextValue && /^(true|false|0|1|yes|no)$/i.test(nextValue)) {
          options.quiet = toBoolean(nextValue);
          i += 1;
        } else {
          options.quiet = true;
        }
        break;
      case 'require':
      case 'required':
      case 'sections':
        if (!rawValue) {
          i += 1;
        }
        options.requiredSections = (nextValue || '')
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.length > 0);
        break;
      case 'missing-only':
      case 'missingonly':
        if (rawValue !== undefined) {
          options.missingOnly = toBoolean(rawValue);
        } else if (nextValue && /^(true|false|0|1|yes|no)$/i.test(nextValue)) {
          options.missingOnly = toBoolean(nextValue);
          i += 1;
        } else {
          options.missingOnly = true;
        }
        break;
      case 'status-warn':
      case 'statuswarn':
        if (!rawValue) {
          i += 1;
        }
        options.statusWarn = (nextValue || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0);
        break;
      case 'critical-weight':
      case 'criticalweight':
        if (!rawValue) {
          i += 1;
        }
        options.criticalWeight = parseNumber(nextValue, options.criticalWeight);
        break;
      case 'optional-weight':
      case 'optionalweight':
        if (!rawValue) {
          i += 1;
        }
        options.optionalWeight = parseNumber(nextValue, options.optionalWeight);
        break;
      case 'top-missing':
      case 'topmissing':
        if (!rawValue) {
          i += 1;
        }
        options.topMissingSections = parseNumber(nextValue, options.topMissingSections);
        break;
      case 'weights-config':
      case 'weightsconfig':
        if (!rawValue) {
          i += 1;
        }
        options.weightsConfig = nextValue ? nextValue.trim() : null;
        break;
      case 'baseline':
        if (!rawValue) {
          i += 1;
        }
        options.baselineSummary = nextValue ? nextValue.trim() : null;
        break;
      case 'manifest':
        if (!rawValue) {
          i += 1;
        }
        options.manifest = toBoolean(nextValue);
        break;
      case 'no-manifest':
        options.manifest = false;
        break;
      default:
        // Unknown flags are ignored but captured as tokens for backward compatibility.
        if (!rawValue) {
          options.tokens.push(rawKey.toLowerCase());
        }
        break;
    }
  }

  return options;
}

export async function exportStories(inputOptions = {}) {
  const {
    tokens = [],
    format,
    formats,
    outDir = defaultOutputDir,
    storiesDir = defaultStoriesDir,
    manifest = true,
    log = console.log,
    warn = console.warn,
    statusFilters: rawStatusFilters = [],
    dryRun = false,
    strict = false,
    stats: printStats = false,
    summaryFile = null,
    quiet = false,
    requiredSections: requiredSectionsInput = null,
    missingOnly = false,
    summaryFormat: summaryFormatInput = null,
    criticalWeight: criticalWeightInput = 2,
    optionalWeight: optionalWeightInput = 1,
    statusWarn = [],
    topMissingSections = 0,
    weightsConfig = null,
    baselineSummary = null,
  } = inputOptions;

  let criticalWeight = criticalWeightInput;
  let optionalWeight = optionalWeightInput;

  const resolvedFormats = (() => {
    if (Array.isArray(formats) && formats.length) {
      return formats;
    }
    if (typeof formats === 'string' && formats.trim().length) {
      return formats.split(',');
    }
    if (typeof format === 'string' && format.trim().length) {
      return format.split(',');
    }
    return ['json'];
  })()
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  const normalizedFormats = Array.from(new Set(resolvedFormats.length ? resolvedFormats : ['json']));
  for (const entry of normalizedFormats) {
    if (!SUPPORTED_FORMATS.has(entry)) {
      throw new Error(`Unsupported format "${entry}". Supported formats: ${Array.from(SUPPORTED_FORMATS).join(', ')}`);
    }
  }

  const statusFilters = Array.isArray(rawStatusFilters)
    ? rawStatusFilters
        .map((value) => value && value.toString().trim().toLowerCase())
        .filter((value) => value && value.length > 0)
    : [];

  const resolvedRequiredSections = Array.isArray(requiredSectionsInput)
    ? normalizeSections(requiredSectionsInput)
    : null;
  let effectiveRequiredSections = (resolvedRequiredSections && resolvedRequiredSections.length)
    ? resolvedRequiredSections
    : DEFAULT_REQUIRED_SECTIONS;

  const sectionOverrides = new Map();

  if (weightsConfig) {
    const configData = await readStructuredFile(weightsConfig);
    if (!configData || typeof configData !== 'object') {
      throw new Error(`Invalid weights config: ${weightsConfig}`);
    }
    if (configData.criticalWeight !== undefined) {
      criticalWeight = parseNumber(configData.criticalWeight, criticalWeight);
    }
    if (configData.optionalWeight !== undefined) {
      optionalWeight = parseNumber(configData.optionalWeight, optionalWeight);
    }
    if (configData.sections && typeof configData.sections === 'object') {
      for (const [sectionName, value] of Object.entries(configData.sections)) {
        const normalizedSection = normalizeSections([sectionName]);
        if (!normalizedSection.length) {
          throw new Error(`Unknown section in config: "${sectionName}"`);
        }
        const section = normalizedSection[0];
        const override = {
          severity: value && value.severity ? value.severity.toLowerCase() : undefined,
          weight: value && value.weight !== undefined ? parseNumber(value.weight, undefined) : undefined,
          goal: value && value.goal ? String(value.goal) : undefined,
        };
        if (override.severity && !['critical', 'optional'].includes(override.severity)) {
          throw new Error(`Invalid severity "${override.severity}" for section ${section}`);
        }
        sectionOverrides.set(section, override);
      }
    }
  }

  const requiredSet = new Set(effectiveRequiredSections);
  sectionOverrides.forEach((override, section) => {
    if (override.severity === 'critical') {
      requiredSet.add(section);
    }
    if (override.severity === 'optional') {
      requiredSet.delete(section);
    }
  });
  effectiveRequiredSections = Array.from(requiredSet);

  let summaryFormat = summaryFormatInput ? summaryFormatInput.toLowerCase() : null;
  if (summaryFormat && !SUMMARY_FORMATS.has(summaryFormat)) {
    throw new Error(`Unsupported summary format "${summaryFormat}". Supported: ${Array.from(SUMMARY_FORMATS).join(', ')}`);
  }

  const statusWarnSet = new Set((statusWarn || []).map((value) => value && value.toString().trim().toLowerCase()).filter((value) => value));

  const fileLog = quiet ? () => {} : log;

  const filterTokens = tokens.map((token) => token.toLowerCase());
  const storyFiles = await loadStoryFiles(storiesDir, filterTokens);

  if (!storyFiles.length) {
    log('No matching story files found.');
    return [];
  }

  if (!dryRun) {
    await ensureDir(outDir);
  }

  const manifestEntries = [];
  const statsData = {
    processed: 0,
    skipped: 0,
    exported: 0,
    formats: new Set(),
    statuses: new Map(),
    acceptanceCriteria: 0,
    tasksTopLevel: 0,
    tasksTotal: 0,
    missingSections: new Map(),
    missingSectionsBySeverity: { critical: 0, optional: 0 },
    missingScoreTotal: 0,
    statusWarnings: [],
  };
  const sectionMetaSummary = new Map();

  for (const file of storyFiles) {
    const spec = await buildSpec(file, { storiesDir, warn });
    statsData.processed += 1;
    const statusValue = (spec.story.status || '').trim().toLowerCase();
    if (statusFilters.length && !statusFilters.includes(statusValue)) {
      fileLog(`Skipping ${file} (status: ${spec.story.status || 'unknown'})`);
      statsData.skipped += 1;
      continue;
    }

    if (statusWarnSet.size && !statusWarnSet.has(statusValue)) {
      const warningMessage = `Status warning for ${file}: status "${spec.story.status || 'unknown'}" not in expected set.`;
      warn(warningMessage);
      statsData.statusWarnings.push({ file: spec.source.file, status: spec.story.status || 'unknown' });
    }

    const missingSections = [];
    if (!spec.story.userStory) missingSections.push('Story');
    if (!spec.story.acceptanceCriteria.length) missingSections.push('Acceptance Criteria');
    if (!spec.story.tasks.length) missingSections.push('Tasks / Subtasks');
    if (!Object.keys(spec.story.devNotes || {}).length) missingSections.push('Dev Notes');
    if (!spec.story.testing.length) missingSections.push('Testing');

    if (missingSections.length) {
      const requiredMissing = missingSections.filter((section) => effectiveRequiredSections.includes(section));
      if (missingOnly && requiredMissing.length === 0) {
        fileLog(`Skipping ${file} (no missing sections match filter)`);
        statsData.skipped += 1;
        continue;
      }
      if (strict && requiredMissing.length) {
        throw new Error(`Strict mode failure for ${file}: missing ${requiredMissing.join(', ')}`);
      }
    } else if (missingOnly) {
      fileLog(`Skipping ${file} (no sections missing)`);
      statsData.skipped += 1;
      continue;
    }

    const currentStatusCount = statsData.statuses.get(statusValue) || 0;
    statsData.statuses.set(statusValue, currentStatusCount + 1);
    statsData.acceptanceCriteria += spec.story.acceptanceCriteria.length;
    statsData.tasksTopLevel += spec.story.tasks.length;
    statsData.tasksTotal += countAllTasks(spec.story.tasks);
    let storyMissingScore = 0;
    if (missingSections.length) {
      missingSections.forEach((section) => {
        const meta = getSectionMeta(section, effectiveRequiredSections, sectionOverrides, criticalWeight, optionalWeight);
        if (!sectionMetaSummary.has(section)) {
          sectionMetaSummary.set(section, meta);
        }
        const count = statsData.missingSections.get(section) || 0;
        statsData.missingSections.set(section, count + 1);
        statsData.missingSectionsBySeverity[meta.severity] += 1;
        storyMissingScore += meta.weight;
      });
    }
    statsData.missingScoreTotal += storyMissingScore;

    const outputPaths = [];
    for (const currentFormat of normalizedFormats) {
      const baseName = file.replace(/\.md$/, '');
      const slug = spec.story && (spec.story.id || spec.story.title)
        ? toSlug(`${spec.story.id}-${spec.story.title}`)
        : toSlug(baseName);
      const extension = currentFormat === 'yaml' ? 'yaml' : 'json';
      const projectedPath = path.join(outDir, `${slug || baseName}.${extension}`);

      const outputPath = dryRun
        ? projectedPath
        : await writeSpec(file, spec, { outDir, format: currentFormat });

      outputPaths.push(outputPath);
      const relativePath = path.relative(projectRoot, outputPath);
      fileLog(`${dryRun ? 'Would export' : 'Exported'} ${file} -> ${relativePath}`);
      statsData.formats.add(currentFormat);
    }

    if (!outputPaths.length) {
      continue;
    }

    statsData.exported += 1;
    const manifestMissingSections = missingSections.length ? missingSections : undefined;
    const manifestMissingSectionsDetail = missingSections.length
      ? missingSections.map((section) => {
        const meta = getSectionMeta(section, effectiveRequiredSections, sectionOverrides, criticalWeight, optionalWeight);
        if (!sectionMetaSummary.has(section)) {
          sectionMetaSummary.set(section, meta);
        }
        return {
          section,
          severity: meta.severity,
          weight: meta.weight,
          goal: meta.goal,
        };
      })
      : undefined;
    const relativePaths = outputPaths.map((entry) => path.relative(projectRoot, entry));
    manifestEntries.push({
      storyId: spec.story.id,
      title: spec.story.title,
      status: spec.story.status,
      file: relativePaths[0],
      files: relativePaths,
      source: spec.source.file,
      missingSections: manifestMissingSections,
      missingSectionsDetail: manifestMissingSectionsDetail,
      missingScore: storyMissingScore,
    });
  }

  if (manifest) {
    if (!dryRun) {
      await buildManifest(manifestEntries, { outDir });
      log(`Manifest written to ${path.relative(projectRoot, path.join(outDir, 'manifest.json'))}`);
    } else {
      log('Dry run enabled: manifest not written');
    }
  }

  const topMissingList = topMissingSections > 0
    ? Array.from(statsData.missingSections.entries())
        .map(([section, count]) => {
          const meta = getSectionMeta(section, effectiveRequiredSections, sectionOverrides, criticalWeight, optionalWeight);
          if (!sectionMetaSummary.has(section)) {
            sectionMetaSummary.set(section, meta);
          }
          return {
            section,
            count,
            severity: meta.severity,
            weight: meta.weight,
            goal: meta.goal,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, topMissingSections)
    : [];

  let deltaSummary = null;
  if (baselineSummary) {
    try {
      const baselineData = await readStructuredFile(baselineSummary);
      if (baselineData && Array.isArray(baselineData.entries)) {
        const baselineMap = new Map();
        baselineData.entries.forEach((entry) => {
          const key = entry && (entry.source || entry.storyId);
          if (key) {
            baselineMap.set(key, entry);
          }
        });
        const regressions = [];
        const improvements = [];
        manifestEntries.forEach((entry) => {
          const key = entry.source || entry.storyId;
          if (!key) {
            return;
          }
          const previous = baselineMap.get(key);
          const currentMissing = new Set(entry.missingSections || []);
          const previousMissing = new Set(previous && previous.missingSections ? previous.missingSections : []);
          const newMissing = Array.from(currentMissing).filter((section) => !previousMissing.has(section));
          const resolved = Array.from(previousMissing).filter((section) => !currentMissing.has(section));
          if (newMissing.length) {
            regressions.push({ source: entry.source, storyId: entry.storyId, sections: newMissing });
          }
          if (resolved.length) {
            improvements.push({ source: entry.source, storyId: entry.storyId, sections: resolved });
          }
          baselineMap.delete(key);
        });
        const baselineScore = baselineData.stats && typeof baselineData.stats.missingScoreTotal === 'number'
          ? baselineData.stats.missingScoreTotal
          : 0;
        deltaSummary = {
          baselineFile: baselineSummary,
          baselineMissingScore: baselineScore,
          currentMissingScore: statsData.missingScoreTotal,
          missingScoreDelta: statsData.missingScoreTotal - baselineScore,
          regressions,
          improvements,
        };
      }
    } catch (error) {
      warn(`Failed to load baseline summary (${baselineSummary}): ${error.message}`);
    }
  }

  if (summaryFile) {
    if (!summaryFormat) {
      if (summaryFile.toLowerCase().endsWith('.yaml') || summaryFile.toLowerCase().endsWith('.yml')) {
        summaryFormat = 'yaml';
      } else {
        summaryFormat = 'json';
      }
    }
    if (!SUMMARY_FORMATS.has(summaryFormat)) {
      throw new Error(`Unsupported summary format "${summaryFormat}". Supported: ${Array.from(SUMMARY_FORMATS).join(', ')}`);
    }
    const summaryPath = path.resolve(projectRoot, summaryFile);
    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    const summaryPayload = {
      generatedAt: new Date().toISOString(),
      options: {
        tokens: filterTokens,
        formats: normalizedFormats,
        outDir: path.relative(projectRoot, outDir),
        storiesDir: path.relative(projectRoot, storiesDir),
        manifest,
        statusFilters,
        dryRun,
        strict,
        stats: printStats,
        quiet,
        requiredSections: effectiveRequiredSections,
        missingOnly,
        summaryFormat,
        topMissingSections,
      },
      stats: {
        processed: statsData.processed,
        exported: statsData.exported,
        skipped: statsData.skipped,
        formats: Array.from(statsData.formats).sort(),
        acceptanceCriteria: statsData.acceptanceCriteria,
        tasks: statsData.tasksTopLevel,
        tasksTopLevel: statsData.tasksTopLevel,
        tasksTotal: statsData.tasksTotal,
        statuses: Object.fromEntries(statsData.statuses),
        missingSections: Object.fromEntries(statsData.missingSections),
        missingSectionsBySeverity: statsData.missingSectionsBySeverity,
        missingScoreTotal: statsData.missingScoreTotal,
        statusWarnings: statsData.statusWarnings,
        topMissingSections: topMissingList,
      },
      sectionMetadata: Object.fromEntries(Array.from(sectionMetaSummary.entries()).map(([section, meta]) => [section, meta])),
      entries: manifestEntries,
      delta: deltaSummary,
    };
    let summaryData;
    if (summaryFormat === 'yaml') {
      summaryData = YAML.stringify(summaryPayload);
    } else if (summaryFormat === 'md') {
      summaryData = renderMarkdownSummary(summaryPayload);
    } else {
      summaryData = JSON.stringify(summaryPayload, null, 2);
    }
    await fs.writeFile(summaryPath, summaryData, 'utf8');
    log(`Summary written to ${path.relative(projectRoot, summaryPath)}`);
  }

  if (printStats) {
    const formatsList = Array.from(statsData.formats).sort().join(', ') || 'none';
    log('--- Export Summary ---');
    log(`Stories processed: ${statsData.processed}`);
    log(`Stories exported: ${statsData.exported}`);
    log(`Stories skipped: ${statsData.skipped}`);
    log(`Formats emitted: ${formatsList}`);
    log(`Total acceptance criteria: ${statsData.acceptanceCriteria}`);
    log(`Total top-level tasks: ${statsData.tasksTopLevel}`);
    log(`Total tasks (including subtasks): ${statsData.tasksTotal}`);
    const statusBreakdown = Array.from(statsData.statuses.entries())
      .map(([status, count]) => `${status || 'unknown'}=${count}`)
      .join(', ');
    if (statusBreakdown) {
      log(`Status breakdown: ${statusBreakdown}`);
    }
    const severityCounts = statsData.missingSectionsBySeverity;
    if (severityCounts.critical || severityCounts.optional) {
      log(`Missing sections by severity: critical=${severityCounts.critical}, optional=${severityCounts.optional}`);
    }
    if (statsData.missingScoreTotal) {
      log(`Aggregate missing score: ${statsData.missingScoreTotal}`);
    }
    if (statsData.statusWarnings.length) {
      log(`Status warnings: ${statsData.statusWarnings.length}`);
    }
    if (topMissingList.length) {
      log('Top missing sections:');
      topMissingList.forEach((item) => {
        log(`  - ${item.section} (count=${item.count}, severity=${item.severity})`);
      });
    }
    if (deltaSummary) {
      log(`Baseline comparison: missingScoreDelta=${deltaSummary.missingScoreDelta}`);
      log(`  Regressions: ${deltaSummary.regressions.length}`);
      log(`  Improvements: ${deltaSummary.improvements.length}`);
    }
  }

  return manifestEntries;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    await exportStories(options);
  } catch (error) {
    console.error('Failed to export Augment specs:', error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export {
  buildSpec,
  parseArgs,
  parseCheckboxTree,
  parseDevNotes,
  parseNumberedList,
  parseTestingList,
  extractSection,
};
