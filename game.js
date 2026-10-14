export const CELL = 144;
export const DURATION = 30_000;

// A mesma regra de acerto é usada pelo jogador e pela IA.
export class Game {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.running = false;
    this.hole = -1;
    this.state = 'empty';
    this.hits = 0;
    this.misses = 0;
    this.spawned = 0;
    this.remaining = DURATION;
  }
  start(now) {
    this.reset();
    this.running = true;
    this.endsAt = now + DURATION;
    this.spawn(now);
  }
  spawn(now) {
    this.hole = Math.floor(this.random() * 9);
    this.state = 'live';
    this.spawned++;
    this.nextAt = now + 1500;
  }
  tick(now) {
    if (!this.running) return;
    this.remaining = Math.max(0, this.endsAt - now);
    if (now >= this.endsAt) {
      if (this.state === 'live') this.misses++;
      this.running = false;
      this.state = 'empty';
      this.hole = -1;
    } else if (now >= this.nextAt) {
      if (this.state === 'live') this.misses++;
      // Não cria um alvo que não teria seus 1500ms completos para ser acertado.
      if (this.endsAt - now >= 1500) this.spawn(now);
      else { this.state = 'empty'; this.hole = -1; this.nextAt = this.endsAt; }
    }
  }
  hit(x, y, now) {
    this.tick(now);
    if (!this.running || this.state !== 'live' || x < 0 || y < 0 || x >= CELL * 3 || y >= CELL * 3) return false;
    const hole = Math.floor(y / CELL) * 3 + Math.floor(x / CELL);
    if (hole !== this.hole) return false;
    this.hits++;
    this.state = 'whacked';
    this.nextAt = now + 500;
    return true;
  }
  get score() { return this.hits * 10; }
  get won() { return !this.running && this.spawned > 0 && this.hits === this.spawned && this.misses === 0; }
}
