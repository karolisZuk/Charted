
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

  // TODO:
  // change the display of canvas, as canvas is inline by default
  // export it through src/index.ts and use it in playground, giving canvas a background
  if (!container) {
    throw new Error("createSurface: No chart container provided")
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'charted-canvas';
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  const ctx = canvas.getContext("2d")!;
  const destroy = () => {
    container.removeChild(canvas);
  }

  container.appendChild(canvas);

  return {
    canvas,
    ctx,
    width: container.clientWidth,
    height: container.clientHeight,
    destroy
  }

}
