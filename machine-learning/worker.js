// Worker clássico: importScripts não funciona em workers do tipo module.
let templates;
const SIZE = 24;

function pixels(image) {
  return tf.image.resizeBilinear(tf.browser.fromPixels(image), [SIZE, SIZE]).toFloat().div(255);
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
      // CPU evita depender de WebGL/OffscreenCanvas no worker para apenas 9 células.
      await tf.setBackend('cpu');
      await tf.ready();
      templates?.dispose();
      templates = tf.tidy(() => tf.stack(data.templates.map(pixels)));
      postMessage({ type: 'ready' });
    } else if (data.type === 'predict' && templates) {
      const started = performance.now();
      const predictions = tf.tidy(() => {
        const board = tf.browser.fromPixels(data.image);
        const matches = [];
        for (let i = 0; i < 9; i++) {
          const cell = board.slice([Math.floor(i / 3) * data.cellSize, (i % 3) * data.cellSize, 0], [data.cellSize, data.cellSize, 3]);
          const input = tf.image.resizeBilinear(cell, [SIZE, SIZE]).toFloat().div(255);
          const distances = templates.sub(input).square().mean([1, 2, 3]);
          const values = distances.dataSync();
          const label = distances.argMin().dataSync()[0];
          // Distância, não probabilidade: só aceitar correspondência muito próxima.
          if (label === 1 && values[1] < 0.001) matches.push({ x: (i % 3 + 0.5) * data.cellSize, y: (Math.floor(i / 3) + 0.5) * data.cellSize, similarity: 1 - values[1] });
        }
        return matches;
      });
      postMessage({ type: 'prediction', id: data.id, predictions, elapsed: performance.now() - started, tensors: tf.memory().numTensors });
    }
  } catch (error) {
    postMessage({ type: 'error', message: error.message });
  }
};
