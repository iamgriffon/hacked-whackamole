import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CELL, DURATION } from './game.js';

test('acerto vale dez pontos, não permite duplicatas nem buraco errado', () => {
  const game = new Game(() => 0);
  game.start(0);
  assert.equal(game.hit(CELL * 2, CELL * 2, 10), false);
  assert.equal(game.hit(-1, 0, 10), false);
  assert.equal(game.hit(72, 72, 20), true);
  assert.equal(game.hit(72, 72, 21), false);
  assert.equal(game.score, 10);
});

test('expiração contabiliza perda e nunca declara vitória', () => {
  const game = new Game(() => 0);
  game.start(0);
  game.tick(1500);
  assert.equal(game.misses, 1);
  game.tick(DURATION);
  assert.equal(game.misses, 2);
  assert.equal(game.won, false);
  assert.equal(game.hit(72, 72, DURATION), false);
});

test('partida perfeita passa por todas as nove posições e termina com pontuação real', () => {
  let index = 0;
  const game = new Game(() => ((index++ % 9) + 0.5) / 9);
  game.start(0);
  for (let now = 0; now <= DURATION; now += 50) {
    game.tick(now);
    if (game.state === 'live') game.hit((game.hole % 3 + 0.5) * CELL, (Math.floor(game.hole / 3) + 0.5) * CELL, now);
  }
  assert.equal(game.won, true);
  assert.equal(game.misses, 0);
  assert.equal(game.hits, game.spawned);
  assert.equal(game.score, game.hits * 10);
  assert.ok(game.hits >= 50);
  game.start(40000);
  assert.equal(game.hits, 0);
  assert.equal(game.spawned, 1);
  assert.equal(game.won, false);
});
