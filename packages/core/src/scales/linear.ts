/**
 * The scale converts data values into pixel positions and
 * picks the axis tick values. It's plain math with no DOM
 * or canvas code, and every chart will be built on it.
 */

export type Range = [min: number, max: number];
export interface Scale {
  map: (value: number) => number
  invert: (pixel: number) => number
  ticks: (count?: number) => number[]
  /* Range of full data values */
  readonly domain: Readonly<Range>
  /* The pixel range the values will be drawn across */
  readonly range: Readonly<Range>
}

interface LinearScaleOptions {
  domain: Range;
  range: Range;
  nice?: boolean
}

const mapBetweenScales = (
  value: number,
  source: Range,
  target: Range
): number => {
  // Empty source span (e.g. domain [5, 5]): avoid dividing by zero, use the middle of the target
  if (source[0] === source[1]) return (target[0] + target[1]) / 2;

  const t = (value - source[0]) / (source[1] - source[0]);

  return target[0] + t * (target[1] - target[0]);
}

const DEFAULT_TICK_COUNT = 10;
const EPSILON = 1e-9;

/**
 * Returns nice tick step (1, 2 or 5 x 10n) for splitting [min, max]  into count parts.
 * Returns 0 when the span is empty.
 * @splits roughly to how many steps to split the range
 */
const tickStep = (range: Range, splits: number): number => {
  const min = range[0];
  const max = range[1];
  const span = Math.abs(max - min);

  if (span === 0 || splits <= 0) return 0;

  const rawStep = span / splits;
  const size = 10 ** Math.floor(Math.log10(rawStep));
  const digits = rawStep / size;

  const niceDigits =
    digits < 1.5 ? 1 :
      digits < 3.5 ? 2 :
        digits < 7.5 ? 5 :
          10;

  return niceDigits * size;
}

/** Removes float noise while leaving fractions like 1.3 alone. */
const snap = (x: number): number => {
  const rounded = Math.round(x);
  return Math.abs(x - rounded) < EPSILON ? rounded : x;
};

/** Rounds `value` down to a multiple of `step`, without float noise. */
const floorToStep = (value: number, step: number): number => {
  if (step < 1) {
    const inverse = Math.round(1 / step);
    return Math.floor(snap(value * inverse)) / inverse;
  }
  return Math.floor(snap(value / step)) * step;
};

/** Rounds `value` up to a multiple of `step`, without float noise.*/
const ceilToStep = (value: number, step: number): number => {
  if (step < 1) {
    const inverse = Math.round(1 / step);
    return Math.ceil(snap(value * inverse)) / inverse;
  }
  return Math.ceil(snap(value / step)) * step;
}

/* Gets a nice range [0.3, 9.4] -> [0, 10] */
const getNiceRange = (range: Range, count = DEFAULT_TICK_COUNT): Range => {
  const min = Math.min(range[0], range[1]);
  const max = Math.max(range[0], range[1]);
  const step = tickStep([min, max], count);

  if (step > 0) {
    const niceMin = floorToStep(min, step);   // round down
    const niceMax = ceilToStep(max, step);    // round up

    return [niceMin, niceMax];
  }

  return range;
}


export const linearScale = ({ domain, range, nice }: LinearScaleOptions): Scale => {
  const _dataRange: Range = [...domain];
  const _pixelRange: Range = [...range];

  if (nice) {
    /** Extend the domain nicely */
    const [niceMin, niceMax]: Range = getNiceRange(_dataRange);

      // keep a reversed domain reversed
      _dataRange[0] = domain[0] <= domain[1] ? niceMin : niceMax;
      _dataRange[1] = domain[0] <= domain[1] ? niceMax : niceMin;
  }

  /* Takes chart value and converts it to pixel value */
  const map = (value: number): number => {
    return mapBetweenScales(value, _dataRange, _pixelRange);
  }

  /* Takes pixel value and converts it to chart value */
  const invert = (pixel: number): number => {
    return mapBetweenScales(pixel, _pixelRange, _dataRange);
  }

  /* Returns the values to label on the axis */
  const ticks = (count = DEFAULT_TICK_COUNT): number[] => {
    const min = Math.min(_dataRange[0], _dataRange[1]);
    const max = Math.max(_dataRange[0], _dataRange[1]);
    const step = tickStep([min, max], count);

    if (step === 0) return [min];

    // whole-number indexes of the first and last tick, rounding inward
    const first = Math.ceil(snap(min / step));
    const last = Math.floor(snap(max / step));
    const inverse = Math.round(1 / step);

    const result: number[] = [];
    for (let i = first; i <= last; i++) {
      result.push(step < 1 ? i / inverse : i * step);
    }
    return result;
  }

  return Object.freeze({
    map,
    invert,
    ticks,
    domain: _dataRange,
    range: _pixelRange
  })
}
