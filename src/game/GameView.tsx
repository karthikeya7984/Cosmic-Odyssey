import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, Shield, X, Zap, Crosshair } from 'lucide-react';
import { createGame, EMPTY_CONTROLS, Game, HEIGHT, POWER_NAMES, QUOTAS, Save, SECTORS, Settings, step, togglePause, WIDTH } from './model';
import { getPalette, render } from './render';
import { Sound } from './audio';
interface Props { save: Save; onExit: () => void; onProgress: (score: number, earned: string[]) => void }
export default function GameView({ save, onExit, onProgress }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), model = useRef<Game>(createGame(save.ship));
  const settings = useRef<Settings>(save.settings), controls = useRef({ ...EMPTY_CONTROLS });
  const [hud, setHud] = useState(() => snapshot(model.current));
  const progress = useRef(onProgress); progress.current = onProgress; settings.current = save.settings;
  const sound = useRef<Sound>();
  function refresh() { setHud(snapshot(model.current)); }
  function pause() { togglePause(model.current); controls.current = { ...EMPTY_CONTROLS }; refresh(); }
  function restart() { model.current = createGame(save.ship); controls.current = { ...EMPTY_CONTROLS }; refresh(); }
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    const ctx = element.getContext('2d'); if (!ctx) return;
    const audio = new Sound(); sound.current = audio;
    const palette = getPalette(), keys = new Set<string>();
    let raf = 0, last = 0, nextHud = 0, lastProgress = '';
    const resize = () => { const rect = element.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1); element.width = Math.round(rect.width * dpr); element.height = Math.round(rect.height * dpr); ctx.setTransform(element.width / WIDTH, 0, 0, element.height / HEIGHT, 0, 0); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const valid = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'Shift', 'e', 'Escape'];
    const down = (e: KeyboardEvent) => { const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (!valid.includes(key)) return; e.preventDefault(); audio.unlock(); if (key === 'Escape') { if (!e.repeat) { togglePause(model.current); keys.clear(); controls.current = { ...EMPTY_CONTROLS }; refresh(); } return; } keys.add(key); };
    const up = (e: KeyboardEvent) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const loseFocus = () => { keys.clear(); controls.current = { ...EMPTY_CONTROLS }; if (model.current.phase === 'playing') { model.current.phase = 'paused'; refresh(); } };
    const visibility = () => { if (document.hidden) loseFocus(); };
    const aim = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; const r = element.getBoundingClientRect(); controls.current.aim = { x: (e.clientX - r.left) / r.width * WIDTH, y: (e.clientY - r.top) / r.height * HEIGHT }; };
    const unlock = () => audio.unlock();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', loseFocus); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility); element.addEventListener('pointermove', aim); element.addEventListener('pointerdown', unlock);
    const frame = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0; last = now;
      const c = controls.current;
      step(model.current, dt, { x: c.x + Number(keys.has('d') || keys.has('ArrowRight')) - Number(keys.has('a') || keys.has('ArrowLeft')), y: c.y + Number(keys.has('s') || keys.has('ArrowDown')) - Number(keys.has('w') || keys.has('ArrowUp')), shoot: c.shoot || keys.has(' '), boost: c.boost || keys.has('Shift'), shield: c.shield || keys.has('e'), aim: c.aim }, settings.current);
      for (const event of model.current.events.splice(0)) audio.play(event, settings.current);
      render(ctx, model.current, palette, settings.current, save.ship);
      if (now >= nextHud) {
        setHud(snapshot(model.current)); nextHud = now + 100;
        const signature = `${model.current.score}:${model.current.earned.join(',')}`;
        if (signature !== lastProgress) { progress.current(model.current.score, model.current.earned); lastProgress = signature; }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); audio.dispose(); sound.current = undefined; window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', loseFocus); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility); element.removeEventListener('pointermove', aim); element.removeEventListener('pointerdown', unlock); };
  }, [save.ship]);
  const touches = useRef(new Map<number, string>());
  function touchUpdate() {
    const actions = [...touches.current.values()]; controls.current.x = Number(actions.includes('right')) - Number(actions.includes('left')); controls.current.y = Number(actions.includes('down')) - Number(actions.includes('up'));
    controls.current.shoot = actions.includes('shoot'); controls.current.boost = actions.includes('boost'); controls.current.shield = actions.includes('shield');
  }
  const hold = (action: string) => ({ onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); touches.current.set(e.pointerId, action); touchUpdate(); sound.current?.unlock(); }, onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { touches.current.delete(e.pointerId); touchUpdate(); }, onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => { touches.current.delete(e.pointerId); touchUpdate(); }, onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => { touches.current.delete(e.pointerId); touchUpdate(); } });
  return <main className="flight-page">
    <header className="flight-header"><span className="wordmark">COSMIC ODYSSEY<span> / FLIGHT LOG</span></span><div className="flex gap-2"><Button variant="ghost" size="icon" aria-label="Pause game" title="Pause game" onClick={pause}><Pause /></Button><Button variant="ghost" size="icon" aria-label="Return to menu" title="Return to menu" onClick={onExit}><X /></Button></div></header>
    <div className="hud-top"><div><span className="eyebrow">SCORE</span><strong>{String(hud.score).padStart(6, '0')}</strong></div><div className="sector-info"><span className="eyebrow">SECTOR 0{hud.level} / 03</span><strong>{SECTORS[hud.level - 1]}</strong></div><div className="text-right"><span className="eyebrow">OBJECTIVE</span><strong>{hud.level === 3 ? 'Defeat the Sentinel' : `Clear hostiles ${hud.levelKills}/${QUOTAS[hud.level - 1]}`}</strong></div></div>
    <div className="arena"><canvas ref={canvas} aria-label="Cosmic Odyssey game arena" />
      {hud.noticeTime > 0 && hud.phase === 'playing' && <div className="game-notice" role="status">{hud.notice}</div>}
      {hud.phase !== 'playing' && <div className="game-overlay"><span className="eyebrow">{hud.phase === 'transition' ? 'SIGNAL CLEAR' : 'FLIGHT STATUS'}</span><h1>{hud.phase === 'paused' ? 'Flight paused.' : hud.phase === 'gameover' ? 'Lost in space.' : hud.phase === 'victory' ? 'Home among stars.' : 'Sector cleared.'}</h1><p>{hud.phase === 'transition' ? 'Jumping to the next orbit… Hull repaired +25.' : hud.phase === 'paused' ? 'Your odyssey is waiting.' : `${hud.kills} hostiles destroyed · ${hud.score} points`}</p>{hud.phase !== 'transition' && <div className="overlay-actions">{hud.phase === 'paused' && <Button onClick={pause}><Play />Resume flight</Button>}<Button variant={hud.phase === 'paused' ? 'outline' : 'default'} onClick={restart}><RotateCcw />{hud.phase === 'paused' ? 'Restart' : 'Fly again'}</Button><Button variant="ghost" onClick={onExit}>Main menu</Button></div>}</div>}
    </div>
    <div className="hud-bottom"><div className="hull"><span className="eyebrow">HULL {Math.ceil(hud.hp)} / {hud.maxHp}</span><progress value={hud.hp} max={hud.maxHp} /></div><div className="hull boost-meter"><span className="eyebrow">BOOST {Math.round(hud.energy)}%</span><progress value={hud.energy} max={100} /></div><div><span className="eyebrow">SHIELD</span><span>{hud.shield > 0 ? `${hud.shield.toFixed(1)}s active` : hud.shieldCooldown > 0 ? `${Math.ceil(hud.shieldCooldown)}s recharge` : 'READY · E'}</span></div><div><span className="eyebrow">DESTROYED</span><span>{hud.kills}</span></div><div className="active-powers">{Object.entries(hud.powers).map(([kind, time]) => <span key={kind}>{POWER_NAMES[kind as keyof typeof POWER_NAMES]} {Math.ceil(time ?? 0)}s</span>)}</div></div>
    <div className="touch-controls"><div className="dpad"><Button variant="outline" size="icon" className="pad-up" aria-label="Move up" {...hold('up')}><ArrowUp /></Button><Button variant="outline" size="icon" className="pad-left" aria-label="Move left" {...hold('left')}><ArrowLeft /></Button><Button variant="outline" size="icon" className="pad-down" aria-label="Move down" {...hold('down')}><ArrowDown /></Button><Button variant="outline" size="icon" className="pad-right" aria-label="Move right" {...hold('right')}><ArrowRight /></Button></div><div className="touch-actions"><Button variant="outline" size="icon" aria-label="Shield" title="Shield" {...hold('shield')}><Shield /></Button><Button variant="outline" size="icon" aria-label="Boost" title="Boost" {...hold('boost')}><Zap /></Button><Button className="shoot-control" aria-label="Shoot" {...hold('shoot')}><Crosshair />Fire</Button></div></div>
  </main>;
}
function snapshot(g: Game) { return { phase: g.phase, score: g.score, level: g.level, levelKills: g.levelKills, kills: g.kills, hp: g.player.hp, maxHp: g.player.maxHp, energy: g.player.energy, shield: g.player.shield, shieldCooldown: g.player.shieldCooldown, notice: g.notice, noticeTime: g.noticeTime, powers: { ...g.powers } }; }
