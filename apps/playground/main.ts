import { VERSION, createSurface, type Surface } from '@charted/core';

document.querySelector('#version')!.textContent = `Charted v${VERSION}`;
const container = document.getElementById('chart')!;
const clearBtn = document.getElementById('clear-btn');

const onResize = (width: number, height: number) => {
  // TODO: for debugging only
  ctx.fillStyle = 'lightblue';
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 1;

  ctx.fillStyle = '#FFF';
  ctx.font = "32px Arial";
  const textString = `${Math.round(width)} / ${Math.round(height)}`;
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(textString, width / 2, height / 2);

  ctx.strokeStyle = '#FFF';
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

const { ctx, destroy }: Surface = createSurface(container, onResize);

clearBtn!.addEventListener('click', () => {
  destroy();
});
