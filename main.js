import { Game, CELL } from './game.js';
import { loadSprites, drawBoard, createTemplates } from './renderer.js';

const $ = id => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const game = new Game();
const sound = new Audio('./assets/smash.mp3');
let worker, sprites, ready = false, pending = false, requestId = 0, lastRequest = 0, watchdog;

function updateHUD() {
  $('score').textContent = game.score;
  $('time').textContent = `${Math.ceil(game.remaining / 1000)}s`;
  $('hits').textContent = game.hits;
  $('misses').textContent = game.misses;
}

function hit(x, y) {
  if (game.hit(x, y, performance.now())) {
    if ($('sound').checked) { sound.currentTime = 0; sound.play().catch(() => {}); }
    drawBoard(ctx, game, sprites);
    updateHUD();
  }
}

function fail(message) {
  clearTimeout(watchdog);
  worker?.terminate();
  ready = false;
  pending = false;
  $('auto').checked = false;
  $('auto').disabled = true;
  $('status').textContent = `IA indisponível: ${message}. Recarregue para tentar novamente.`;
  $('start').disabled = !sprites;
}

$('start').addEventListener('click', () => {
  requestId++; // invalida respostas da partida anterior
  game.start(performance.now());
  $('result').textContent = 'Partida em andamento. Meta: nenhuma toupeira perdida.';
  $('start').textContent = 'Reiniciar partida';
  $('aim').hidden = true;
  drawBoard(ctx, game, sprites);
  updateHUD();
});
$('auto').addEventListener('change', () => {
  requestId++;
  $('aim').hidden = true;
});
canvas.addEventListener('pointerdown', event => {
  if ($('auto').checked) return;
  const rect = canvas.getBoundingClientRect();
  hit((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
});
canvas.addEventListener('keydown', event => {
  if ($('auto').checked || !/^[1-9]$/.test(event.key)) return;
  event.preventDefault();
  const i = Number(event.key) - 1;
  hit((i % 3 + 0.5) * CELL, (Math.floor(i / 3) + 0.5) * CELL);
});

function frame(now) {
  const wasRunning = game.running;
  game.tick(now);
  drawBoard(ctx, game, sprites);
  updateHUD();
  if (wasRunning && !game.running) {
    $('aim').hidden = true;
    $('result').textContent = game.won ? `Vitória perfeita! ${game.hits}/${game.spawned} toupeiras, ${game.score} pontos.` : `Fim de jogo: ${game.hits}/${game.spawned} acertos e ${game.misses} perdidas.`;
  }
  if (game.running && ready && $('auto').checked && !pending && now - lastRequest >= 50) {
    pending = true;
    lastRequest = now;
    watchdog = setTimeout(() => fail('tempo limite da inferência excedido'), 5000);
    worker.postMessage({ type: 'predict', id: ++requestId, cellSize: CELL, image: ctx.getImageData(0, 0, canvas.width, canvas.height) });
  }
  requestAnimationFrame(frame);
}

try {
  sprites = await loadSprites();
  drawBoard(ctx, game, sprites);
  requestAnimationFrame(frame);
  worker = new Worker(new URL('./machine-learning/worker.js', import.meta.url));
  worker.onerror = event => fail(event.message || 'erro ao carregar o worker');
  worker.onmessage = ({ data }) => {
    clearTimeout(watchdog);
    if (data.type === 'error') return fail(data.message);
    if (data.type === 'ready') {
      ready = true;
      $('start').disabled = false;
      $('status').textContent = 'TensorFlow.js pronto · visão por pixels';
    }
    if (data.type === 'prediction') {
      pending = false;
      if (data.id !== requestId || !game.running || !$('auto').checked) return;
      $('latency').textContent = `${data.elapsed.toFixed(1)} ms`;
      $('aim').hidden = data.predictions.length === 0;
      for (const prediction of data.predictions) {
        $('match').textContent = `${(prediction.similarity * 100).toFixed(1)}%`;
        $('aim').style.left = `${prediction.x / canvas.width * 100}%`;
        $('aim').style.top = `${prediction.y / canvas.height * 100}%`;
        hit(prediction.x, prediction.y);
      }
    }
  };
  watchdog = setTimeout(() => fail('TensorFlow.js não carregou em 20 segundos'), 20000);
  worker.postMessage({ type: 'init', templates: createTemplates(sprites) });
} catch (error) { fail(error.message); }

window.addEventListener('pagehide', () => { clearTimeout(watchdog); worker?.terminate(); });
