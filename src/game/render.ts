import { Game, HEIGHT, WIDTH, Settings, ShipId } from './model';
export interface Palette { ink: string; space: string; faint: string; effect: string; danger: string }
export function getPalette(): Palette { const s = getComputedStyle(document.documentElement); const read = (v: string) => `hsl(${s.getPropertyValue(v).trim()})`; return { ink: read('--foreground'), space: read('--background'), faint: read('--muted-foreground'), effect: read('--info'), danger: read('--destructive') }; }
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
export function rocket(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale = 1, ship: ShipId = 'explorer') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  const width = ship === 'titan' ? 14 : ship === 'phantom' ? 8 : 11;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(6, -width - 2, -13, -width); ctx.lineTo(-16, -20); ctx.lineTo(-23, -19); ctx.lineTo(-21, -5); ctx.lineTo(-17, 0); ctx.lineTo(-21, 5); ctx.lineTo(-23, 19); ctx.lineTo(-16, 20); ctx.lineTo(-13, width); ctx.quadraticCurveTo(6, width + 2, 24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  circle(ctx, 7, 0, 5); ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-9, 10); ctx.moveTo(-16, -4); ctx.lineTo(-16, 4); ctx.stroke();
  ctx.restore();
}
export function drawSpace(ctx: CanvasRenderingContext2D, width: number, height: number, palette: Palette, menu = false) {
  ctx.fillStyle = palette.space; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = palette.ink; ctx.lineWidth = 1;
  for (let i = 0; i < 145; i++) { const x = ((i * 137.31 + 43) % 997) / 997 * width, y = ((i * 231.73 + 19) % 991) / 991 * height; ctx.globalAlpha = .3 + (i % 4) * .16; if (i % 13 === 0) { ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); } else { ctx.fillStyle = palette.ink; ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1); } }
  ctx.globalAlpha = menu ? .55 : .16;
  const cx = width * .77, cy = height * .48;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.35);
  for (const r of [145, 230, 345]) { ctx.beginPath(); ctx.ellipse(0, 0, r * width / 960, r * .68 * height / 640, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  ctx.globalAlpha = menu ? .8 : .22;
  const px = width * .82, py = height * .29, r = Math.min(width, height) * .1;
  ctx.fillStyle = palette.space; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, r - 2, 0, Math.PI * 2); ctx.clip();
  for (let i = -4; i < 5; i++) { ctx.beginPath(); ctx.ellipse(px, py + i * r / 4, r * 1.1, r * .18, -.3, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(width * .61, height * .79); ctx.rotate(-.4); circle(ctx, 0, 0, r * .48); ctx.beginPath(); ctx.ellipse(0, 0, r, r * .15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  circle(ctx, width * .93, height * .76, 16); circle(ctx, width * .56, height * .18, 8);
  if (menu) {
    ctx.globalAlpha = 1; ctx.fillStyle = palette.space; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.8;
    rocket(ctx, width * .75, height * .56, -.65, Math.min(width / 960, height / 640) * 2.4);
    ctx.beginPath(); const x = width * .68, y = height * .64; ctx.moveTo(x, y); ctx.lineTo(x - 30, y + 55); ctx.moveTo(x + 8, y + 3); ctx.lineTo(x - 12, y + 48); ctx.moveTo(x - 10, y - 2); ctx.lineTo(x - 40, y + 38); ctx.stroke();
    ctx.globalAlpha = .6; circle(ctx, width * .73, height * .91, 6); circle(ctx, width * .85, height * .09, 5);
  }
  ctx.globalAlpha = 1;
}
export function render(ctx: CanvasRenderingContext2D, g: Game, palette: Palette, settings: Settings, ship: ShipId) {
  drawSpace(ctx, WIDTH, HEIGHT, palette); ctx.save();
  if (settings.shake && g.shake > 0 && g.phase === 'playing') ctx.translate(Math.sin(g.time * 190) * 4 * g.shake / .3, Math.cos(g.time * 210) * 4 * g.shake / .3);
  ctx.strokeStyle = palette.ink; ctx.fillStyle = palette.space; ctx.lineWidth = 1.5;
  for (const a of g.asteroids) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle); ctx.beginPath();
    for (let i = 0; i < 11; i++) { const angle = i * Math.PI * 2 / 11, radius = a.r * (.8 + .2 * Math.sin(i * 5 + a.seed)); if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius); else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); circle(ctx, -6, -4, a.r * .22); circle(ctx, 9, 8, a.r * .12); ctx.restore();
  }
  for (const item of g.pickups) {
    ctx.save(); ctx.translate(item.x, item.y); ctx.strokeStyle = palette.effect; ctx.globalAlpha = item.life < 4 ? .5 + Math.sin(g.time * 12) * .4 : 1;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 0); ctx.lineTo(0, 14); ctx.lineTo(-14, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = palette.effect; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText({ health: '+', shield: 'E', rapid: 'R', double: 'Ⅱ', speed: '»', crystal: '✧' }[item.kind], 0, 1); ctx.restore();
  }
  for (const e of g.enemies) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle); ctx.fillStyle = palette.space; ctx.strokeStyle = palette.ink;
    if (e.kind === 'boss') {
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 29 : 43; if (i === 0) ctx.moveTo(r, 0); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); circle(ctx, 0, 0, 18); circle(ctx, 0, 0, 10);
    } else { ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-15, -17); ctx.lineTo(-8, 0); ctx.lineTo(-15, 17); ctx.closePath(); ctx.fill(); ctx.stroke(); circle(ctx, 2, 0, 4); }
    ctx.restore(); ctx.strokeStyle = palette.faint; ctx.beginPath(); ctx.moveTo(e.x - e.r, e.y - e.r - 9); ctx.lineTo(e.x + e.r, e.y - e.r - 9); ctx.stroke(); ctx.strokeStyle = palette.ink; ctx.beginPath(); ctx.moveTo(e.x - e.r, e.y - e.r - 9); ctx.lineTo(e.x - e.r + e.r * 2 * e.hp / e.maxHp, e.y - e.r - 9); ctx.stroke();
  }
  for (const b of g.bullets) { ctx.strokeStyle = b.enemy ? palette.danger : palette.ink; ctx.lineWidth = b.enemy ? 2 : 2.5; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * .014, b.y - b.vy * .014); ctx.stroke(); }
  for (const part of g.particles) { ctx.globalAlpha = part.life / part.maxLife; ctx.fillStyle = part.accent ? palette.effect : palette.ink; ctx.fillRect(part.x, part.y, part.size, part.size); }
  ctx.globalAlpha = 1;
  if (g.phase !== 'gameover') {
    const p = g.player; ctx.strokeStyle = palette.ink; ctx.fillStyle = palette.space; ctx.lineWidth = 1.5;
    ctx.globalAlpha = p.invulnerable > 0 ? .45 + Math.sin(g.time * 30) * .25 : 1; rocket(ctx, p.x, p.y, p.angle, .85, ship); ctx.globalAlpha = 1;
    if (p.shield > 0) { ctx.strokeStyle = palette.effect; circle(ctx, p.x, p.y, 28); ctx.globalAlpha = .4; circle(ctx, p.x, p.y, 31); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}
