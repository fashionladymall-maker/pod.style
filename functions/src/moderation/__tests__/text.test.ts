import moderateText, { resetTextModerationCache } from '../text';

describe('moderateText', () => {
  afterEach(() => {
    delete process.env.MODERATION_SENSITIVE_PATTERNS;
    resetTextModerationCache();
  });

  it('returns pass when content is safe', () => {
    const result = moderateText('这是一个友好的创意描述。');
    expect(result.status).toBe('pass');
    expect(result.matches).toHaveLength(0);
  });

  it('flags default placeholder patterns as reject', () => {
    const result = moderateText('这段文本包含 bannedword 占位词。');
    expect(result.status).toBe('reject');
    expect(result.matches[0]?.ruleId).toBe('placeholder-profanity');
  });

  it('supports custom patterns defined via environment variable', () => {
    process.env.MODERATION_SENSITIVE_PATTERNS = JSON.stringify([
      {
        id: 'custom-phrase',
        label: 'Custom Rule',
        pattern: 'forbidden phrase',
        severity: 'warn',
      },
    ]);
    resetTextModerationCache();

    const result = moderateText('包含 forbidden phrase 的文本。');
    expect(result.status).toBe('warn');
    expect(result.matches[0]?.ruleId).toBe('custom-phrase');
  });
});

