import { describe, expect, it } from 'vitest';
import { linearScale } from './linear';

/** True when step is 1, 2 or 5 × 10ⁿ (allowing for float error). */
const isNiceStep = (step: number): boolean => {
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const normalized = step / magnitude;
  return [1, 2, 5, 10].some((n) => Math.abs(normalized - n) < 1e-9);
};

/** True when value is (very nearly) an integer multiple of step. */
const isMultipleOf = (value: number, step: number): boolean => {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-9;
};

/** Asserts the general "nice ticks" contract for any domain. */
const expectNiceTicks = (ticks: number[], domain: [number, number]) => {
  const [min, max] = [Math.min(...domain), Math.max(...domain)];
  expect(ticks.length).toBeGreaterThan(1);

  const step = ticks[1]! - ticks[0]!;
  expect(isNiceStep(step)).toBe(true);

  ticks.forEach((t, i) => {
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(min);
    expect(t).toBeLessThanOrEqual(max);
    expect(isMultipleOf(t, step)).toBe(true);
    if (i > 0) expect(t - ticks[i - 1]!).toBeCloseTo(step, 9);
  });
};

describe('linearScale', () => {
  describe('map', () => {
    const scale = linearScale({ domain: [0, 100], range: [0, 500] });

    it('maps the domain ends to the range ends', () => {
      expect(scale.map(0)).toBe(0);
      expect(scale.map(100)).toBe(500);
    });

    it('maps values in between linearly', () => {
      expect(scale.map(50)).toBe(250);
      expect(scale.map(25)).toBe(125);
    });

    it('extrapolates values outside the domain instead of clamping or throwing', () => {
      expect(scale.map(120)).toBe(600);
      expect(scale.map(-20)).toBe(-100);
    });

    it('supports a reversed range (y axis: bottom → top)', () => {
      const y = linearScale({ domain: [0, 100], range: [300, 0] });
      expect(y.map(0)).toBe(300);
      expect(y.map(100)).toBe(0);
      expect(y.map(50)).toBe(150);
    });

    it('supports a reversed domain', () => {
      const s = linearScale({ domain: [100, 0], range: [0, 500] });
      expect(s.map(100)).toBe(0);
      expect(s.map(0)).toBe(500);
    });

    it('handles negative domains and domains crossing zero', () => {
      const s = linearScale({ domain: [-50, 50], range: [0, 100] });
      expect(s.map(-50)).toBe(0);
      expect(s.map(0)).toBe(50);
      expect(s.map(50)).toBe(100);
    });
  });

  describe('invert', () => {
    it('converts pixels back into data values', () => {
      const s = linearScale({ domain: [0, 100], range: [0, 500] });
      expect(s.invert(250)).toBe(50);
      expect(s.invert(0)).toBe(0);
      expect(s.invert(500)).toBe(100);
    });

    it('works with a reversed range', () => {
      const y = linearScale({ domain: [0, 100], range: [300, 0] });
      expect(y.invert(300)).toBe(0);
      expect(y.invert(150)).toBe(50);
    });

    it('extrapolates pixels outside the range', () => {
      const s = linearScale({ domain: [0, 100], range: [0, 500] });
      expect(s.invert(600)).toBe(120);
    });

    it('round-trips: invert(map(x)) ≈ x', () => {
      const s = linearScale({ domain: [-3.7, 12.4], range: [17, 913] });
      for (const x of [-3.7, -1, 0, 0.1, 3.3333, 12.4, 99]) {
        expect(s.invert(s.map(x))).toBeCloseTo(x, 9);
      }
    });
  });

  describe('ticks', () => {
    it('returns exact steps of 0.2 for [0, 1] with count 5', () => {
      const s = linearScale({ domain: [0, 1], range: [0, 100] });
      expect(s.ticks(5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    });

    it('returns steps of 10 for [0, 100] with count 10', () => {
      const s = linearScale({ domain: [0, 100], range: [0, 100] });
      expect(s.ticks(10)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    });

    it('defaults count to 10', () => {
      const s = linearScale({ domain: [0, 100], range: [0, 100] });
      expect(s.ticks()).toEqual(s.ticks(10));
    });

    it('has no floating-point noise', () => {
      const a = linearScale({ domain: [0, 0.3], range: [0, 100] });
      expect(a.ticks(3)).toEqual([0, 0.1, 0.2, 0.3]);

      const b = linearScale({ domain: [0, 1], range: [0, 100] });
      expect(b.ticks(10)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    });

    it('returns nice ticks inside an awkward domain [-3.7, 12.4]', () => {
      const s = linearScale({ domain: [-3.7, 12.4], range: [0, 100] });
      expectNiceTicks(s.ticks(5), [-3.7, 12.4]);
    });

    it('returns nice ticks for a range of awkward domains', () => {
      const domains: [number, number][] = [
        [0.13, 9.7],
        [-1000, 37],
        [0.0012, 0.0087],
        [1e6, 7.3e6],
        [-0.5, -0.05],
      ];
      for (const domain of domains) {
        const s = linearScale({ domain, range: [0, 100] });
        expectNiceTicks(s.ticks(5), domain);
      }
    });

    it('returns roughly `count` ticks (count is a target, not exact)', () => {
      const s = linearScale({ domain: [0, 1000], range: [0, 100] });
      for (const count of [2, 5, 10, 20]) {
        const n = s.ticks(count).length;
        expect(n).toBeGreaterThanOrEqual(Math.floor(count / 2));
        expect(n).toBeLessThanOrEqual(count * 2 + 1);
      }
    });

    it('returns ascending ticks for a reversed domain', () => {
      const s = linearScale({ domain: [100, 0], range: [0, 500] });
      expect(s.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
    });
  });

  describe('degenerate domain (min === max)', () => {
    const s = linearScale({ domain: [5, 5], range: [0, 500] });

    it('maps to the middle of the range instead of NaN', () => {
      expect(s.map(5)).toBe(250);
    });

    it('never produces NaN or Infinity', () => {
      expect(Number.isFinite(s.map(5))).toBe(true);
      expect(Number.isFinite(s.invert(100))).toBe(true);
    });

    it('returns the single value as the only tick', () => {
      expect(s.ticks(5)).toEqual([5]);
    });
  });

  describe('nice option', () => {
    it('leaves the domain untouched by default', () => {
      const s = linearScale({ domain: [0.13, 9.7], range: [0, 100] });
      expect(s.domain).toEqual([0.13, 9.7]);
    });

    it('extends the domain outward to nice round values', () => {
      const s = linearScale({ domain: [0.13, 9.7], range: [0, 100], nice: true });
      expect(s.domain).toEqual([0, 10]);
    });

    it('uses the extended domain for map and ticks', () => {
      const s = linearScale({ domain: [0.13, 9.7], range: [0, 100], nice: true });
      expect(s.map(0)).toBe(0);
      expect(s.map(10)).toBe(100);
      const ticks = s.ticks(5);
      expect(ticks[0]).toBe(0);
      expect(ticks.at(-1)).toBe(10);
    });

    it('works for negative domains', () => {
      const s = linearScale({ domain: [-3.7, 12.4], range: [0, 100], nice: true });
      const [min, max] = s.domain;
      expect(min).toBeLessThanOrEqual(-3.7);
      expect(max).toBeGreaterThanOrEqual(12.4);
      expect(Number.isInteger(min)).toBe(true);
      expect(Number.isInteger(max)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('returns a frozen object', () => {
      const s = linearScale({ domain: [0, 1], range: [0, 100] });
      expect(Object.isFrozen(s)).toBe(true);
    });

    it('is not affected by later mutation of the input arrays', () => {
      const domain: [number, number] = [0, 100];
      const range: [number, number] = [0, 500];
      const s = linearScale({ domain, range });
      domain[1] = 200;
      range[1] = 1000;
      expect(s.domain).toEqual([0, 100]);
      expect(s.range).toEqual([0, 500]);
      expect(s.map(50)).toBe(250);
    });
  });
});
