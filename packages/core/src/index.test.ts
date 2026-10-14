import { describe, expect, it } from 'vitest';
import { VERSION } from './index';

describe('@charted/core', () => {
  it('exports a version', () => {
    expect(VERSION).toBe('0.0.0');
  });
});
