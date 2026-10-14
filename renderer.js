import { CELL } from './game.js';

export async function loadSprites() {
  const entries = await Promise.all(['mole', 'mole-whacked'].map(async name => {
    const image = new Image();
    image.src = new URL(`./assets/${name}.png`, import.meta.url).href;
    await image.decode();
    return [name, image];
  }));
  return Object.fromEntries(entries);
}

function drawCell(ctx, x, y, state, sprites) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#3a8100';
  ctx.fillRect(0, 0, CELL, CELL);
  ctx.beginPath();
  ctx.arc(72, 76, 57, 0, Math.PI * 2);
  ctx.fillStyle = '#a5550b';
  ctx.fill();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(72, 64, 54, 45, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#351506';
  ctx.fill();
  const sprite = state === 'live' ? sprites.mole : state === 'whacked' ? sprites['mole-whacked'] : null;
  if (sprite) ctx.drawImage(sprite, 32, 133 - 80 * sprite.height / sprite.width, 80, 80 * sprite.height / sprite.width);
  ctx.restore();
}

export function drawBoard(ctx, game, sprites) {
  for (let i = 0; i < 9; i++) drawCell(ctx, (i % 3) * CELL, Math.floor(i / 3) * CELL, i === game.hole ? game.state : 'empty', sprites);
}

export function createTemplates(sprites) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = CELL;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return ['empty', 'live', 'whacked'].map(state => {
    drawCell(ctx, 0, 0, state, sprites);
    return ctx.getImageData(0, 0, CELL, CELL);
  });
}
