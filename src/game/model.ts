export const WIDTH = 960;
export const HEIGHT = 640;
export type ShipId = 'explorer' | 'phantom' | 'titan';
export type Phase = 'playing' | 'paused' | 'transition' | 'gameover' | 'victory';
export type Power = 'health' | 'shield' | 'rapid' | 'double' | 'speed' | 'crystal';
export interface Settings { volume: number; sfx: boolean; shake: boolean; particles: boolean; mouseAim: boolean; difficulty: 'easy' | 'normal' | 'hard' }
export interface Save { best: number; ship: ShipId; settings: Settings; achievements: string[] }
export const SHIPS = {
  explorer: { name: 'Explorer', hp: 100, speed: 235, description: 'A steady hand in uncharted space.', speedLabel: 'Balanced', hullLabel: '100' },
  phantom: { name: 'Phantom', hp: 70, speed: 300, description: 'Light on its feet. Gone in a flash.', speedLabel: 'Fast', hullLabel: '70' },
  titan: { name: 'Titan', hp: 150, speed: 185, description: 'Built to weather the cosmic storm.', speedLabel: 'Heavy', hullLabel: '150' },
};
export const ACHIEVEMENTS = [
  { id: 'first', name: 'First contact', detail: 'Destroy your first enemy.' },
  { id: 'collector', name: 'Cosmic scavenger', detail: 'Collect a power-up.' },
  { id: 'sector', name: 'Beyond the belt', detail: 'Clear the first sector.' },
  { id: 'victory', name: 'Odyssey complete', detail: 'Defeat the Sentinel and return home.' },
  { id: 'score', name: 'Stargazer', detail: 'Earn 2,000 points in one flight.' },
];
export const DEFAULT_SAVE: Save = { best: 0, ship: 'explorer', achievements: [], settings: { volume: .35, sfx: true, shake: true, particles: true, mouseAim: false, difficulty: 'normal' } };
export const STORAGE_KEY = 'cosmic-odyssey-v1';
export function readSave(storage?: Pick<Storage, 'getItem'>): Save {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const d = JSON.parse(raw);
    const s = d.settings ?? {};
    return { best: Number.isFinite(d.best) && d.best >= 0 ? d.best : 0, ship: d.ship in SHIPS ? d.ship : 'explorer', achievements: Array.isArray(d.achievements) ? d.achievements.filter((id: unknown) => ACHIEVEMENTS.some(a => a.id === id)) : [], settings: {
      volume: typeof s.volume === 'number' && Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : .35,
      sfx: typeof s.sfx === 'boolean' ? s.sfx : true, shake: typeof s.shake === 'boolean' ? s.shake : true,
      particles: typeof s.particles === 'boolean' ? s.particles : true, mouseAim: typeof s.mouseAim === 'boolean' ? s.mouseAim : false,
      difficulty: ['easy', 'normal', 'hard'].includes(s.difficulty) ? s.difficulty : 'normal',
    } };
  } catch { return structuredClone(DEFAULT_SAVE); }
}
export function writeSave(save: Save, storage?: Pick<Storage, 'setItem'>) { try { storage?.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* Private browsing may disable storage. */ } }
export interface Body { x: number; y: number; r: number }
export interface Player extends Body { vx: number; vy: number; angle: number; hp: number; maxHp: number; speed: number; cooldown: number; invulnerable: number; shield: number; shieldCooldown: number; energy: number }
export interface Enemy extends Body { id: number; hp: number; maxHp: number; speed: number; angle: number; fire: number; kind: 'scout' | 'strafer' | 'boss'; age: number }
export interface Bullet extends Body { vx: number; vy: number; life: number; enemy: boolean; damage: number }
export interface Asteroid extends Body { hp: number; vx: number; vy: number; spin: number; angle: number; seed: number }
export interface Pickup extends Body { kind: Power; life: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; accent: boolean }
export interface Controls { x: number; y: number; shoot: boolean; boost: boolean; shield: boolean; aim?: { x: number; y: number } }
export const EMPTY_CONTROLS: Controls = { x: 0, y: 0, shoot: false, boost: false, shield: false };
export interface Game {
  phase: Phase; player: Player; enemies: Enemy[]; bullets: Bullet[]; asteroids: Asteroid[]; pickups: Pickup[]; particles: Particle[];
  score: number; kills: number; level: number; levelKills: number; spawned: number; spawnTimer: number; time: number; transition: number;
  powers: Partial<Record<Power, number>>; notice: string; noticeTime: number; shake: number; earned: string[]; events: string[]; nextId: number; collected: number;
}
export const QUOTAS = [8, 12, 1];
export const SECTORS = ['THE QUIET BELT', 'HOSTILE ORBIT', 'THE SENTINEL'];
export const POWER_NAMES: Record<Power, string> = { health: 'Hull repaired', shield: 'Shield', rapid: 'Rapid fire', double: 'Double shot', speed: 'Overdrive', crystal: 'Score crystal' };
export function createGame(ship: ShipId = 'explorer'): Game {
  const craft = SHIPS[ship];
  const g: Game = { phase: 'playing', player: { x: WIDTH / 2, y: HEIGHT / 2, r: 15, vx: 0, vy: 0, angle: -Math.PI / 2, hp: craft.hp, maxHp: craft.hp, speed: craft.speed, cooldown: 0, invulnerable: 1.5, shield: 0, shieldCooldown: 0, energy: 100 }, enemies: [], bullets: [], asteroids: [], pickups: [], particles: [], score: 0, kills: 0, level: 1, levelKills: 0, spawned: 0, spawnTimer: 1.5, time: 0, transition: 0, powers: {}, notice: 'Sector 01 · Clear 8 hostiles', noticeTime: 4, shake: 0, earned: [], events: [], nextId: 1, collected: 0 };
  seedSector(g);
  return g;
}
function seedSector(g: Game) {
  g.asteroids = [ { x: 170, y: 170, r: 28, hp: 3, vx: 12, vy: 9, spin: .2, angle: 0, seed: 2 }, { x: 790, y: 470, r: 34, hp: 4, vx: -10, vy: -7, spin: -.15, angle: 0, seed: 6 } ];
  g.pickups = [{ x: WIDTH / 2, y: HEIGHT / 2 - 110, r: 13, kind: g.level === 1 ? 'double' : 'health', life: 35 }];
}
export function overlaps(a: Body, b: Body) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.r + b.r) ** 2; }
export function segmentHit(b: Bullet, x: number, y: number, target: Body) {
  const dx = b.x - x, dy = b.y - y;
  const t = Math.max(0, Math.min(1, ((target.x - x) * dx + (target.y - y) * dy) / (dx * dx + dy * dy || 1)));
  return (x + dx * t - target.x) ** 2 + (y + dy * t - target.y) ** 2 <= (target.r + b.r) ** 2;
}
export function earn(g: Game, id: string) { if (!g.earned.includes(id)) g.earned.push(id); }
function notify(g: Game, text: string) { g.notice = text; g.noticeTime = 3; }
export function burst(g: Game, x: number, y: number, settings: Settings, random = Math.random, count = 18, accent = false) {
  if (!settings.particles) return;
  for (let i = 0; i < count; i++) { const a = random() * Math.PI * 2, v = 35 + random() * 130, life = .25 + random() * .65; g.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, maxLife: life, size: 1 + random() * 2, accent }); }
  if (g.particles.length > 400) g.particles.splice(0, g.particles.length - 400);
}
export function damagePlayer(g: Game, damage: number, settings: Settings) {
  const p = g.player;
  if (p.invulnerable > 0 || p.shield > 0) return;
  p.hp = Math.max(0, p.hp - damage); p.invulnerable = .85; g.shake = settings.shake ? .3 : 0; g.events.push('hit');
  if (p.hp <= 0) { g.phase = 'gameover'; burst(g, p.x, p.y, settings); g.events.push('explode'); }
}
export function collect(g: Game, kind: Power) {
  g.collected++; earn(g, 'collector'); g.events.push('pickup');
  if (kind === 'health') g.player.hp = Math.min(g.player.maxHp, g.player.hp + 30);
  else if (kind === 'crystal') g.score += 150;
  else if (kind === 'shield') g.player.shield = 8;
  else g.powers[kind] = 12;
  notify(g, `${POWER_NAMES[kind]}${kind === 'crystal' ? ' +150' : kind === 'health' ? ' +30' : ' activated'}`);
}
function spawnEnemy(g: Game, settings: Settings, random: () => number) {
  const edge = Math.floor(random() * 4), boss = g.level === 3;
  const x = boss ? WIDTH / 2 : edge === 0 ? 35 : edge === 1 ? WIDTH - 35 : 40 + random() * (WIDTH - 80);
  const y = boss ? 80 : edge === 2 ? 35 : edge === 3 ? HEIGHT - 35 : 40 + random() * (HEIGHT - 80);
  const multiplier = settings.difficulty === 'easy' ? .75 : settings.difficulty === 'hard' ? 1.25 : 1;
  const hp = boss ? 65 : g.level === 1 ? 3 : 4;
  g.enemies.push({ id: g.nextId++, x, y, r: boss ? 43 : 17, hp, maxHp: hp, speed: (boss ? 36 : 48 + g.level * 9) * multiplier, angle: 0, fire: boss ? 1.2 : 1.8 + random(), kind: boss ? 'boss' : g.spawned % 2 ? 'strafer' : 'scout', age: 0 }); g.spawned++;
}
function killEnemy(g: Game, e: Enemy, settings: Settings, random: () => number) {
  g.score += e.kind === 'boss' ? 1500 : 100; g.kills++; g.levelKills++; earn(g, 'first');
  burst(g, e.x, e.y, settings, random, e.kind === 'boss' ? 60 : 22); g.events.push('explode'); g.shake = settings.shake ? .18 : 0;
  if (g.kills % 2 === 0) { const kinds: Power[] = ['health', 'shield', 'rapid', 'double', 'speed', 'crystal']; g.pickups.push({ x: e.x, y: e.y, r: 13, kind: kinds[(g.kills / 2 - 1) % kinds.length], life: 20 }); }
}
export function togglePause(g: Game) { if (g.phase === 'playing') g.phase = 'paused'; else if (g.phase === 'paused') g.phase = 'playing'; }
export function step(g: Game, dt: number, c: Controls, settings: Settings, random = Math.random) {
  if (g.phase === 'paused' || g.phase === 'gameover' || g.phase === 'victory') return;
  dt = Math.max(0, Math.min(dt, .05));
  if (g.phase === 'transition') {
    g.transition -= dt;
    if (g.transition <= 0) { g.level++; g.levelKills = 0; g.spawned = 0; g.spawnTimer = 1; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 25); g.player.invulnerable = 2; g.phase = 'playing'; seedSector(g); notify(g, `Sector 0${g.level} · ${SECTORS[g.level - 1]}`); }
    return;
  }
  g.time += dt; g.noticeTime = Math.max(0, g.noticeTime - dt); g.shake = Math.max(0, g.shake - dt);
  const p = g.player;
  p.cooldown = Math.max(0, p.cooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
  const shieldBefore = p.shield;
  p.shield = Math.max(0, p.shield - dt); p.shieldCooldown = Math.max(0, p.shieldCooldown - dt);
  if (shieldBefore > 0 && p.shield === 0) notify(g, 'Shield expired');
  for (const key of Object.keys(g.powers) as Power[]) { const remaining = (g.powers[key] ?? 0) - dt; if (remaining <= 0) { delete g.powers[key]; notify(g, `${POWER_NAMES[key]} expired`); } else g.powers[key] = remaining; }
  if (c.shield && p.shieldCooldown === 0 && p.shield === 0) { p.shield = 3; p.shieldCooldown = 14; g.events.push('pickup'); notify(g, 'Shield activated'); }
  const boost = c.boost && p.energy > 1;
  p.energy = Math.max(0, Math.min(100, p.energy + (boost ? -32 : 19) * dt));
  const length = Math.hypot(c.x, c.y), mx = length > 1 ? c.x / length : c.x, my = length > 1 ? c.y / length : c.y;
  const speed = p.speed * (boost ? 1.7 : 1) * (g.powers.speed ? 1.3 : 1);
  const blend = 1 - Math.exp(-8 * dt);
  p.vx += (mx * speed - p.vx) * blend; p.vy += (my * speed - p.vy) * blend;
  p.x = Math.max(p.r, Math.min(WIDTH - p.r, p.x + p.vx * dt)); p.y = Math.max(p.r, Math.min(HEIGHT - p.r, p.y + p.vy * dt));
  let aim = p.angle;
  if (settings.mouseAim && c.aim) aim = Math.atan2(c.aim.y - p.y, c.aim.x - p.x);
  else if (length > .05) aim = Math.atan2(my, mx);
  const diff = Math.atan2(Math.sin(aim - p.angle), Math.cos(aim - p.angle)); p.angle += diff * Math.min(1, dt * 15);
  if (settings.particles && length > .05) { const life = .25; g.particles.push({ x: p.x - Math.cos(p.angle) * 19, y: p.y - Math.sin(p.angle) * 19, vx: -Math.cos(p.angle) * 80 + (random() - .5) * 35, vy: -Math.sin(p.angle) * 80 + (random() - .5) * 35, life, maxLife: life, size: boost ? 3 : 1.8, accent: boost }); }
  if (c.shoot && p.cooldown === 0) {
    p.cooldown = g.powers.rapid ? .105 : .23;
    for (const offset of g.powers.double ? [-7, 7] : [0]) {
      g.bullets.push({ x: p.x + Math.cos(p.angle) * 21 - Math.sin(p.angle) * offset, y: p.y + Math.sin(p.angle) * 21 + Math.cos(p.angle) * offset, vx: Math.cos(p.angle) * 580, vy: Math.sin(p.angle) * 580, r: 3, life: 1.8, enemy: false, damage: 1 });
    } g.events.push('shoot');
  }
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0 && g.spawned < QUOTAS[g.level - 1] && g.enemies.length < 5) { spawnEnemy(g, settings, random); g.spawnTimer = g.level === 1 ? 2.2 : 1.6; }
  for (const e of g.enemies) {
    e.age += dt; const dx = p.x - e.x, dy = p.y - e.y, distance = Math.hypot(dx, dy) || 1; e.angle = Math.atan2(dy, dx);
    const approach = distance > (e.kind === 'boss' ? 200 : 145) ? 1 : -.25;
    const strafe = e.kind !== 'scout' ? Math.sin(e.age * 1.5) * .8 : 0;
    e.x = Math.max(e.r, Math.min(WIDTH - e.r, e.x + (dx / distance * approach - dy / distance * strafe) * e.speed * dt));
    e.y = Math.max(e.r, Math.min(HEIGHT - e.r, e.y + (dy / distance * approach + dx / distance * strafe) * e.speed * dt));
    e.fire -= dt;
    if (e.fire <= 0) {
      e.fire = (e.kind === 'boss' ? .95 : 2.7) * (settings.difficulty === 'easy' ? 1.35 : settings.difficulty === 'hard' ? .75 : 1);
      for (const offset of e.kind === 'boss' ? [-.3, -.15, 0, .15, .3] : [0]) { const a = e.angle + offset; g.bullets.push({ x: e.x + Math.cos(a) * (e.r + 6), y: e.y + Math.sin(a) * (e.r + 6), vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, r: 4, life: 6, enemy: true, damage: e.kind === 'boss' ? 16 : 12 }); }
    }
    if (overlaps(e, p)) damagePlayer(g, 20, settings);
  }
  for (const a of g.asteroids) {
    a.x += a.vx * dt; a.y += a.vy * dt; a.angle += a.spin * dt;
    if (a.x < a.r || a.x > WIDTH - a.r) a.vx *= -1;
    if (a.y < a.r || a.y > HEIGHT - a.r) a.vy *= -1;
    if (overlaps(p, a)) damagePlayer(g, 18, settings);
  }
  for (const b of g.bullets) {
    const x = b.x, y = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.enemy) { if (segmentHit(b, x, y, p)) { damagePlayer(g, b.damage, settings); b.life = 0; } }
    else { for (const e of g.enemies) { if (e.hp > 0 && segmentHit(b, x, y, e)) { e.hp -= b.damage; b.life = 0; burst(g, b.x, b.y, settings, random, 3); if (e.hp <= 0) killEnemy(g, e, settings, random); break; } } }
    if (b.life > 0) for (const a of g.asteroids) { if (a.hp > 0 && segmentHit(b, x, y, a)) { a.hp -= b.enemy ? 0 : 1; b.life = 0; if (a.hp <= 0) { burst(g, a.x, a.y, settings, random); g.score += 25; g.events.push('explode'); } break; } }
  }
  g.bullets = g.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < WIDTH + 20 && b.y > -20 && b.y < HEIGHT + 20);
  g.enemies = g.enemies.filter(e => e.hp > 0); g.asteroids = g.asteroids.filter(a => a.hp > 0);
  for (const item of g.pickups) { item.life -= dt; if (overlaps(p, item)) { collect(g, item.kind); item.life = 0; } }
  g.pickups = g.pickups.filter(i => i.life > 0);
  for (const part of g.particles) { part.x += part.vx * dt; part.y += part.vy * dt; part.life -= dt; }
  g.particles = settings.particles ? g.particles.filter(part => part.life > 0).slice(-400) : [];
  if (g.score >= 2000) earn(g, 'score');
  if (g.phase === 'playing' && g.levelKills >= QUOTAS[g.level - 1]) {
    g.bullets = []; g.pickups = []; g.powers = {};
    if (g.level === 3) { g.phase = 'victory'; earn(g, 'victory'); g.events.push('win'); }
    else { g.phase = 'transition'; g.transition = 3; earn(g, 'sector'); g.events.push('win'); }
  }
}
