
export interface Surface {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  /* current size in pixels */
  readonly width: number;
  readonly height: number;
  destroy(): void;
}

export const createSurface = (
  container: HTMLElement,
  onResize: (width: number, height: number) => void
): Surface => {
  if (!container) throw new Error("createSurface: No chart container provided");

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext("2d");
  let _width: number = 0;
  let _height: number = 0;
  let isDestroyed = false;

  if (!ctx) throw new Error("createSurface: No canvas context found");

  const resize = (width: number, height: number) => {
    /* Scale canvas for Retina displays */
    const dpr = window.devicePixelRatio;

    /*
      Set actual width of the canvas scaled for different monitors.
      Rounding is done to not end up with fractional pixels in canvas.
    */
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Set the "drawn" size of the canvas
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    _width = width;
    _height = height;

    /* Scale the context to ensure correct drawing operations */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]!;
    const { width, height } = entry.contentRect;
    resize(width, height);
    onResize(width, height);
  });

  observer.observe(container);

  const destroy = () => {
    /* Skip if canvas already destroyed */
    if (isDestroyed) return;

    observer.disconnect();
    container.removeChild(canvas);
    isDestroyed = true;
  }

  container.appendChild(canvas);

  return {
    canvas,
    ctx,
    get width() { return _width; },
    get height() { return _height; },
    destroy
  }
}
