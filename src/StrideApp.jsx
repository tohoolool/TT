import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Activity, Heart, Moon, Gauge, TrendingUp, Zap, MessageCircle, Send,
  Flame, Timer, Sparkles, Wind, ChevronRight, CalendarRange,
  Compass, FlaskConical, BedDouble, Target,
  Utensils, NotebookPen, Search, MapPin, Trophy, Globe, Plus, Trash2, Check,
  Footprints, Thermometer, Play, Pause, Rocket, Brain, Award, Download,
  Mountain, Sunrise, Crown, Medal, Repeat, Lock, UtensilsCrossed, Gamepad2, Map, Headphones,
  Sun, CloudRain, Clock, Smile, Dumbbell, Music, Sprout, Users, Leaf, Milestone, Settings as SettingsIcon, Volume2, VolumeX,
} from "lucide-react";

/* ============================ ATHLETE DATA (from Apple Health, Apr–May 2026) ============================ */
const ATHLETE = {
  name: "Tracy",
  vo2: 48.9, rhr: 46, maxhr: 190, weight: 50.5, bmi: 19.8, bf: 24.5, lean: 38.4,
  hrvAvg: 76, hrvCeil: 107, acwr: 1.3,
  latest: { hrv: 65, rhr: 54, sleep: 6.5, spo2: 96 },
};
const VO2_TREND = [{ m: "Nov", v: 37.7 }, { m: "Apr", v: 42.8 }, { m: "May", v: 48.9 }];
const RECOVERY = [
  { wk: "Apr 1", hrv: 72.8, rhr: 45.3 }, { wk: "Apr 8", hrv: 83.3, rhr: 47.3 },
  { wk: "Apr 15", hrv: 74.7, rhr: 52.0 }, { wk: "Apr 22", hrv: 75.7, rhr: 47.0 },
  { wk: "Apr 29", hrv: 80.2, rhr: 50.5 }, { wk: "May 6", hrv: 75.4, rhr: 46.7 },
  { wk: "May 13", hrv: 92.6, rhr: 48.0 }, { wk: "May 20", hrv: 67.2, rhr: 50.0 },
  { wk: "May 27", hrv: 67.6, rhr: 51.7 },
];
const WEEKLY_KM = [
  { wk: "Apr 1", km: 22.3 }, { wk: "Apr 8", km: 41.1 }, { wk: "Apr 15", km: 46.9 },
  { wk: "Apr 22", km: 34.3 }, { wk: "Apr 29", km: 35.3 }, { wk: "May 6", km: 24.8 },
  { wk: "May 13", km: 36.7 }, { wk: "May 20", km: 23.7 },
];
const RUNS = [
  [7.25,6.32],[6.94,6.27],[10.0,6.40],[7.32,6.43],[10.63,6.48],[7.23,6.42],[17.26,6.47],
  [7.21,6.32],[7.15,6.23],[10.91,6.47],[8.22,6.08],[7.16,6.32],[18.91,6.70],[5.63,6.67],
  [7.28,6.28],[18.04,6.77],[7.24,6.35],[7.04,5.77],[7.47,6.50],[7.89,6.12],[10.05,5.95],
  [5.01,6.91],[11.59,7.25],
].map(([x, y]) => ({ x, y }));
const DAILY_LOAD = [
  552,591,974,773,11,1137,653,902,576,701,1017,1224,594,620,561,787,1215,1361,383,317,
  572,1195,569,430,604,1461,294,392,633,723,1008,462,813,694,589,786,584,478,1085,48,
  176,320,20,612,1118,560,1130,513,217,11,556,1075,1039,253,437,672,984,
];
const ACTIVITY_MIX = [
  { name: "Running", v: 36, c: "#E2441F" }, { name: "Climbing", v: 22, c: "#C98A12" },
  { name: "Walking", v: 7, c: "#2F7D52" }, { name: "Cycling", v: 4, c: "#1E5F8C" },
  { name: "Skating", v: 4, c: "#7A5CC0" }, { name: "Strength", v: 3, c: "#4A463C" },
  { name: "HIIT", v: 1, c: "#B5330F" },
];
const DNA = [
  { k: "Aerobic engine", v: 88 }, { k: "Top-end speed", v: 45 }, { k: "Endurance", v: 90 },
  { k: "Recovery", v: 60 }, { k: "Consistency", v: 92 }, { k: "Versatility", v: 95 },
];
const SLEEP_ARCH = [
  { name: "Deep", h: 1.0, c: "#1E3A5F" }, { name: "REM", h: 1.4, c: "#1E5F8C" },
  { name: "Core", h: 3.8, c: "#5A9D4E" }, { name: "Awake", h: 0.4, c: "#C98A12" },
];

/* ============================ SCIENCE HELPERS ============================ */
const secToPace = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${m}:${String(s).padStart(2, "0")}`;
};
const riegel = (t1, d1, d2) => t1 * Math.pow(d2 / d1, 1.06);
const danielsVDOT = (distM, timeMin) => {
  const v = distM / timeMin;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMin) + 0.2989558 * Math.exp(-0.1932605 * timeMin);
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  return vo2 / pct;
};
const karvonen = (max, rest) => {
  const hrr = max - rest;
  const z = (lo, hi) => [Math.round(rest + lo * hrr), Math.round(rest + hi * hrr)];
  return [
    { name: "Z1 Recovery", r: z(0.5, 0.6), c: "#3a7d52", use: "flush / easy spin" },
    { name: "Z2 Endurance", r: z(0.6, 0.7), c: "#5a9d4e", use: "aerobic base — most of the week" },
    { name: "Z3 Tempo", r: z(0.7, 0.8), c: "#c98a12", use: "steady, comfortably hard" },
    { name: "Z4 Threshold", r: z(0.8, 0.9), c: "#E2441F", use: "race-pace / lactate work" },
    { name: "Z5 VO₂max", r: z(0.9, 1.0), c: "#B5330F", use: "short sharp intervals" },
  ];
};
function fitnessModel(load) {
  let ctl = load[0], atl = load[0];
  return load.map((v, i) => {
    ctl += (v - ctl) / 28; atl += (v - atl) / 7;
    return { d: i + 1, load: v, ctl: Math.round(ctl), atl: Math.round(atl), tsb: Math.round(ctl - atl) };
  });
}

/* ============================ THEME ============================ */
const C = {
  paper: "#F4F0E7", card: "#FBF8F1", ink: "#17150F", soft: "#4A463C", line: "#D6CDB8",
  accent: "#E2441F", deep: "#B5330F", green: "#2F7D52", amber: "#C98A12", blue: "#1E5F8C",
};
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Fraunces', serif" };

/* persistent storage (artifact-sanctioned; falls back to memory) */
const todayKey = () => new Date().toISOString().slice(0, 10);
let SOUND_ON = true;
const store = {
  get: async (k) => { try { if (!window.storage) return null; const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch (e) { return null; } },
  set: async (k, v) => { try { if (window.storage) await window.storage.set(k, JSON.stringify(v)); } catch (e) {} },
};

/* ============================ SMALL UI ============================ */
const Card = ({ children, style }) => (
  <div className="card" style={{ background: "linear-gradient(180deg,#FFFDF7,#F7F2E8)", border: "1px solid #E2D9C5", borderRadius: 16, boxShadow: "inset 0 1px 0 rgba(255,255,255,.65), 0 1px 2px rgba(23,21,15,.04), 0 10px 24px -20px rgba(23,21,15,.3)", ...style }}>{children}</div>
);
function CountUp({ value, decimals = 0, dur = 850 }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let raf; const to = Number(value) || 0, start = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - start) / dur); const e = 1 - Math.pow(1 - p, 3); setD(to * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, dur]);
  return <>{d.toFixed(decimals)}</>;
}
const Stat = ({ k, v, n, color }) => (
  <Card style={{ padding: 15 }}>
    <div style={{ ...mono, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.soft }}>{k}</div>
    <div style={{ ...serif, fontSize: 30, fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1, margin: "7px 0 3px", color: color || C.ink, textShadow: color ? `0 0 20px ${color}22` : "none" }}>{typeof v === "number" ? <CountUp value={v} decimals={Number.isInteger(v) ? 0 : 1} /> : v}</div>
    <div style={{ fontSize: 12, color: C.soft }}>{n}</div>
  </Card>
);
const FactorPill = ({ label, good, bad }) => (
  <span style={{ ...mono, fontSize: 10.5, padding: "4px 9px", borderRadius: 999, border: `1px solid ${good ? C.green : bad ? C.accent : C.line}`, color: good ? C.green : bad ? C.accent : C.soft }}>{label}</span>
);
const SectionTitle = ({ n, children }) => (  <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "4px 0 14px" }}>
    <span style={{ ...mono, fontSize: 12, color: "#fff", fontWeight: 600, background: "linear-gradient(135deg,#E2441F,#C98A12)", borderRadius: 7, padding: "3px 8px", boxShadow: "0 5px 12px -5px rgba(226,68,31,.6)", animation: "popIn .5s both" }}>{n}</span>
    <h2 style={{ ...serif, fontSize: 22, fontWeight: 600, letterSpacing: "-.01em" }}>{children}</h2>
  </div>
);

/* ============================ READINESS RING ============================ */
function Ring({ score }) {
  const [sc, setSc] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf; const from = ref.current, to = score, start = performance.now(), dur = 750;
    const tick = (t) => { const p = Math.min(1, (t - start) / dur); const e = 1 - Math.pow(1 - p, 3); const v = from + (to - from) * e; ref.current = v; setSc(v); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = 78, circ = 2 * Math.PI * r;
  const color = sc >= 72 ? C.green : sc >= 54 ? C.amber : C.accent;
  const light = sc >= 72 ? "#5FBF88" : sc >= 54 ? "#E7B557" : "#F4794F";
  return (
    <div style={{ position: "relative", width: 190, height: 190, display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${color}2e, transparent 68%)`, filter: "blur(3px)", animation: sc >= 72 ? "orbPulse 4.5s ease-in-out infinite" : "none" }} />
      <svg width="190" height="190" viewBox="0 0 190 190" style={{ position: "relative" }}>
        <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={light} /></linearGradient></defs>
        <circle cx="95" cy="95" r={r} fill="none" stroke={C.line} strokeWidth="14" />
        <circle cx="95" cy="95" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - sc / 100)}
          transform="rotate(-90 95 95)" className={sc >= 72 ? "ringpulse" : ""}
          style={{ filter: sc >= 72 ? "drop-shadow(0 0 6px rgba(47,125,82,.55))" : "none" }} />
        <text x="95" y="88" textAnchor="middle" style={{ ...serif, fontSize: 46, fontWeight: 700, fill: C.ink }}>{Math.round(sc)}</text>
        <text x="95" y="112" textAnchor="middle" style={{ ...mono, fontSize: 11, letterSpacing: ".15em", fill: C.soft }}>READINESS</text>
      </svg>
    </div>
  );
}

/* ============================ DELIGHT: confetti · onboarding · runner's high ============================ */
function Confetti({ fire }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth || window.innerWidth;
    const H = canvas.height = canvas.offsetHeight || window.innerHeight;
    const cols = [C.accent, C.green, C.amber, C.deep, "#ffffff", "#1E5F8C"];
    const P = Array.from({ length: 150 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42,
      vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 15 - 4, g: 0.36,
      r: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * cols.length)],
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.45, life: 1,
    }));
    let raf, t0 = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, W, H); let alive = false;
      P.forEach((p) => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.007;
        if (p.life > 0 && p.y < H + 30) { alive = true; ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.7); ctx.restore(); } });
      if (alive && t - t0 < 2800) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 60 }} />;
}

function Onboarding({ onDone }) {
  const items = [
    { i: Activity, t: "Readiness, alive", d: "HRV, sleep, fuel & load fused into one daily score." },
    { i: Gauge, t: "Your real paces", d: "VDOT-calibrated zones & race predictions from your data." },
    { i: Sparkles, t: "A coach that knows you", d: "Ask anything — answered from your actual numbers." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "linear-gradient(160deg,#17150F,#3a1d12)", color: C.paper, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 28px", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-12%", right: "-18%", width: 360, height: 360, background: "radial-gradient(circle,rgba(226,68,31,.42),transparent 65%)", animation: "orbPulse 5s ease-in-out infinite" }} />
      <div style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: "#ffb59f", animation: "fadeUp .6s both" }}>PERSONAL RUNNING OS</div>
      <h1 style={{ ...serif, fontSize: 66, fontWeight: 900, letterSpacing: "-.03em", margin: "6px 0 6px", animation: "fadeUp .6s .1s both" }}>STRIDE</h1>
      <p style={{ fontSize: 16, color: "#e6ddd2", maxWidth: "30ch", animation: "fadeUp .6s .2s both" }}>Your running, understood — every heartbeat, every mile, built on your own data.</p>
      <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", gap: 13, alignItems: "center", animation: `fadeUp .6s ${0.35 + idx * 0.12}s both` }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", display: "grid", placeItems: "center", flex: "none" }}><it.i size={20} color="#ffb59f" /></span>
            <div><div style={{ fontWeight: 600, fontSize: 15.5 }}>{it.t}</div><div style={{ fontSize: 13, color: "#cdbfae" }}>{it.d}</div></div>
          </div>
        ))}
      </div>
      <button onClick={onDone} style={{ marginTop: 34, alignSelf: "flex-start", background: C.accent, color: "#fff", border: "none", borderRadius: 999, padding: "15px 34px", cursor: "pointer", ...mono, fontSize: 15, fontWeight: 600, animation: `fadeUp .6s ${0.35 + items.length * 0.12 + 0.1}s both`, boxShadow: "0 14px 34px -12px rgba(226,68,31,.6)" }}>Enter STRIDE →</button>
      <button onClick={onDone} style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: "none", color: "#9a8f80", ...mono, fontSize: 12, cursor: "pointer" }}>skip</button>
    </div>
  );
}

function RunnerHigh({ onClose }) {
  const words = ["Breathe.", "Settle into the rhythm.", "Let it flow.", "You are the engine.", "This is the runner's high."];
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => Math.min(x + 1, words.length - 1)), 1900); return () => clearInterval(id); }, []);
  const dots = Array.from({ length: 28 }, (_, k) => k);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, overflow: "hidden", cursor: "pointer", background: "#0d0b07", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#3a1d12,#b5330f,#e2441f,#c98a12,#2f7d52)", backgroundSize: "300% 300%", animation: "auroraShift 12s ease infinite", opacity: 0.55 }} />
      <div style={{ position: "absolute", left: "50%", top: "56%", width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,228,185,.92),rgba(226,68,31,.42) 45%,transparent 70%)", animation: "orbPulse 4s ease-in-out infinite", filter: "blur(2px)" }} />
      {dots.map((k) => { const left = Math.random() * 100, dur = 4 + Math.random() * 5, delay = Math.random() * 6, size = 4 + Math.random() * 7; return <span key={k} style={{ position: "absolute", bottom: -20, left: `${left}%`, width: size, height: size, borderRadius: "50%", background: "rgba(255,240,220,.85)", boxShadow: "0 0 8px rgba(255,220,180,.9)", animation: `floatUp ${dur}s linear ${delay}s infinite` }} />; })}
      <div style={{ position: "relative", textAlign: "center", padding: 24 }}>
        <div key={i} style={{ ...serif, fontSize: "clamp(30px,8vw,54px)", fontWeight: 800, color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,.45)", animation: "popIn .8s", maxWidth: "16ch", lineHeight: 1.15, margin: "0 auto" }}>{words[i]}</div>
        <div style={{ ...mono, fontSize: 12, color: "rgba(255,255,255,.72)", marginTop: 26, letterSpacing: ".15em", animation: "fadeUp 1s 1s both" }}>tap anywhere to return</div>
      </div>
    </div>
  );
}

function LevelUp({ level, onClose }) {
  const [n, setN] = useState(0);
  useEffect(() => { let r; const s = performance.now(); const tick = (t) => { const p = Math.min(1, (t - s) / 950); setN(Math.round(level * (1 - Math.pow(1 - p, 3)))); if (p < 1) r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, [level]);
  const dots = Array.from({ length: 26 }, (_, k) => k);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 92, overflow: "hidden", cursor: "pointer", background: "#0d0b07", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#3a1d12,#C98A12,#E2441F,#1E5F8C)", backgroundSize: "300% 300%", animation: "auroraShift 9s ease infinite", opacity: 0.5 }} />
      <div style={{ position: "absolute", left: "50%", top: "48%", width: 360, height: 360, marginLeft: -180, marginTop: -180, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,228,185,.92),rgba(201,138,18,.4) 45%,transparent 70%)", animation: "orbPulse 3.4s ease-in-out infinite", filter: "blur(2px)" }} />
      {dots.map((k) => { const left = Math.random() * 100, dur = 4 + Math.random() * 5, delay = Math.random() * 6, size = 4 + Math.random() * 7; return <span key={k} style={{ position: "absolute", bottom: -20, left: `${left}%`, width: size, height: size, borderRadius: "50%", background: "rgba(255,240,220,.9)", boxShadow: "0 0 8px rgba(255,220,180,.95)", animation: `floatUp ${dur}s linear ${delay}s infinite` }} />; })}
      <div style={{ position: "relative", textAlign: "center", padding: 24 }}>
        <div style={{ ...mono, fontSize: 14, letterSpacing: ".42em", color: "#ffe4b9", animation: "fadeUp .6s both" }}>LEVEL UP</div>
        <div style={{ ...serif, fontSize: "clamp(78px,24vw,160px)", fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 6px 40px rgba(0,0,0,.5)", animation: "popIn .8s" }}>{n}</div>
        <div style={{ ...serif, fontSize: "clamp(24px,7vw,42px)", fontWeight: 800, color: "#ffd27a", animation: "fadeUp .7s .3s both" }}>{titleFor(level)}</div>
        <div style={{ ...mono, fontSize: 12, color: "rgba(255,255,255,.72)", marginTop: 26, letterSpacing: ".15em", animation: "fadeUp 1s 1s both" }}>tap anywhere to continue</div>
      </div>
    </div>
  );
}

function PreRunRitual({ sess, onGo }) {
  const [phase, setPhase] = useState("center");
  useEffect(() => {
    const seq = [["center", 2500], ["3", 850], ["2", 850], ["1", 850], ["go", 650]];
    let i = 0, to;
    const run = () => { setPhase(seq[i][0]); const ms = seq[i][1]; i++; to = setTimeout(i < seq.length ? run : onGo, ms); };
    run();
    return () => clearTimeout(to);
  }, []);
  const col = sess.color;
  return (
    <div onClick={onGo} style={{ position: "fixed", inset: 0, zIndex: 92, overflow: "hidden", cursor: "pointer", background: `linear-gradient(160deg,#0d0b07,${col}28)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 320, height: 320, marginLeft: -160, marginTop: -160, borderRadius: "50%", background: `radial-gradient(circle,${col}cc,${col}30 50%,transparent 72%)`, animation: "orbPulse 3s ease-in-out infinite", filter: "blur(2px)" }} />
      <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
        {phase === "center" ? (
          <div style={{ animation: "fadeUp .6s both" }}>
            <div style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: "#ffd9c8" }}>{sess.name.toUpperCase()}</div>
            <div style={{ ...serif, fontSize: "clamp(28px,8vw,46px)", fontWeight: 800, margin: "10px 0", maxWidth: "16ch", lineHeight: 1.15 }}>Centre yourself</div>
            <p style={{ fontSize: 14.5, color: "#e6ddd2", maxWidth: "26ch", margin: "0 auto", lineHeight: 1.5 }}>{sess.cue}</p>
          </div>
        ) : (
          <div key={phase} style={{ ...serif, fontWeight: 900, color: "#fff", fontSize: phase === "go" ? "clamp(56px,18vw,120px)" : "clamp(90px,30vw,200px)", lineHeight: 1, textShadow: "0 6px 40px rgba(0,0,0,.5)", animation: "popIn .55s" }}>{phase === "go" ? "GO" : phase}</div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 30, ...mono, fontSize: 11.5, color: "rgba(255,255,255,.6)", letterSpacing: ".12em" }}>tap to skip the ritual</div>
    </div>
  );
}

function BoxBreathe({ onClose }) {
  const PHASES = [["Breathe in", 1], ["Hold", 1], ["Breathe out", 0.55], ["Hold", 0.55]];
  const [p, setP] = useState(0);
  const [cycle, setCycle] = useState(1);
  useEffect(() => { const id = setInterval(() => setP((x) => { const nx = (x + 1) % 4; if (nx === 0) setCycle((c) => c + 1); return nx; }), 4000); return () => clearInterval(id); }, []);
  const [label, scale] = PHASES[p];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 92, cursor: "pointer", background: "linear-gradient(160deg,#0b1620,#10261f)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#10261f,#1E5F8C,#2F7D52)", backgroundSize: "300% 300%", animation: "auroraShift 16s ease infinite", opacity: 0.3 }} />
      <div style={{ position: "relative", display: "grid", placeItems: "center", width: 300, height: 300 }}>
        <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(180,230,220,.85),rgba(30,95,140,.42) 55%,transparent 72%)", transform: `scale(${scale})`, transition: "transform 4s linear", filter: "blur(1px)" }} />
        <div style={{ position: "relative", textAlign: "center", color: "#eaf5f1" }}>
          <div key={p} style={{ ...serif, fontSize: 34, fontWeight: 800, animation: "popIn .6s" }}>{label}</div>
          <div style={{ ...mono, fontSize: 12, color: "rgba(234,245,241,.7)", marginTop: 6, letterSpacing: ".18em" }}>4 · 4 · 4 · 4</div>
        </div>
      </div>
      <div style={{ position: "relative", ...mono, fontSize: 12, color: "rgba(234,245,241,.85)", marginTop: 28, letterSpacing: ".12em" }}>cycle {cycle} · tap anywhere to finish</div>
      <div style={{ position: "relative", fontSize: 12.5, color: "rgba(234,245,241,.6)", marginTop: 8, maxWidth: "27ch", textAlign: "center", lineHeight: 1.5 }}>Box breathing nudges your nervous system toward recovery — lovely before sleep or after a hard day.</div>
    </div>
  );
}

function RaceTakeover({ race, days, goalTime, onClose }) {
  const dots = Array.from({ length: 24 }, (_, k) => k);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 92, overflow: "hidden", cursor: "pointer", background: "#0d0b07", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#1E5F8C,#3a1d12,#E2441F,#C98A12)", backgroundSize: "320% 320%", animation: "auroraShift 11s ease infinite", opacity: 0.5 }} />
      <div style={{ position: "absolute", left: "50%", top: "46%", width: 360, height: 360, marginLeft: -180, marginTop: -180, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,228,185,.85),rgba(226,68,31,.4) 45%,transparent 70%)", animation: "orbPulse 3.4s ease-in-out infinite", filter: "blur(2px)" }} />
      {dots.map((k) => { const left = Math.random() * 100, dur = 4 + Math.random() * 5, delay = Math.random() * 6, size = 4 + Math.random() * 7; return <span key={k} style={{ position: "absolute", bottom: -20, left: `${left}%`, width: size, height: size, borderRadius: "50%", background: "rgba(255,240,220,.9)", boxShadow: "0 0 8px rgba(255,220,180,.95)", animation: `floatUp ${dur}s linear ${delay}s infinite` }} />; })}
      <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
        <div style={{ ...mono, fontSize: 13, letterSpacing: ".4em", color: "#ffe4b9", animation: "fadeUp .6s both" }}>{days <= 0 ? "IT'S RACE DAY" : "RACE WEEK"}</div>
        <div style={{ ...serif, fontSize: "clamp(80px,26vw,170px)", fontWeight: 900, lineHeight: 1, textShadow: "0 6px 40px rgba(0,0,0,.5)", animation: "popIn .8s" }}>{days <= 0 ? "GO" : days}</div>
        {days > 0 && <div style={{ ...mono, fontSize: 14, letterSpacing: ".2em", color: "#fff", opacity: 0.9 }}>DAY{days === 1 ? "" : "S"} TO GO</div>}
        <div style={{ ...serif, fontSize: "clamp(22px,6vw,34px)", fontWeight: 800, color: "#ffd27a", marginTop: 14, maxWidth: "18ch" }}>{race}</div>
        {goalTime && <div style={{ ...mono, fontSize: 14, color: "#e6ddd2", marginTop: 8 }}>goal · {goalTime}</div>}
        <p style={{ fontSize: 14.5, color: "#e6ddd2", maxWidth: "24ch", margin: "16px auto 0", lineHeight: 1.5 }}>The work is done. Trust your training, sharpen up, and let it fly.</p>
        <div style={{ ...mono, fontSize: 11.5, color: "rgba(255,255,255,.6)", marginTop: 24, letterSpacing: ".15em" }}>tap anywhere to close</div>
      </div>
    </div>
  );
}

function BloomBurst({ stage, onClose }) {
  const petals = Array.from({ length: 26 }, (_, k) => k);
  const cols = ["#E58AA0", "#E2441F", "#C98A12", "#2F7D52", "#1E5F8C"];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 92, overflow: "hidden", cursor: "pointer", background: "linear-gradient(160deg,#10261f,#1d3a24)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#2F7D52,#9CC487,#C98A12)", backgroundSize: "300% 300%", animation: "auroraShift 12s ease infinite", opacity: 0.35 }} />
      {petals.map((k) => { const left = Math.random() * 100, dur = 4 + Math.random() * 4, delay = Math.random() * 4, size = 8 + Math.random() * 10, c = cols[k % cols.length]; return <span key={k} style={{ position: "absolute", top: -20, left: `${left}%`, width: size, height: size, borderRadius: "50% 0 50% 50%", background: c, opacity: 0.9, animation: `petalFall ${dur}s linear ${delay}s infinite` }} />; })}
      <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 64, animation: "popIn .8s" }}>🌸</div>
        <div style={{ ...mono, fontSize: 13, letterSpacing: ".3em", color: "#dff0e4", marginTop: 8, animation: "fadeUp .6s .2s both" }}>YOUR GARDEN GREW</div>
        <div style={{ ...serif, fontSize: "clamp(34px,10vw,60px)", fontWeight: 900, textShadow: "0 5px 30px rgba(0,0,0,.4)", animation: "popIn .9s" }}>{stage}</div>
        <p style={{ fontSize: 14, color: "#dff0e4", maxWidth: "24ch", margin: "12px auto 0", lineHeight: 1.5 }}>All those sessions, rides and rest days — they added up. Beautiful work.</p>
        <div style={{ ...mono, fontSize: 11.5, color: "rgba(255,255,255,.6)", marginTop: 24, letterSpacing: ".15em" }}>tap anywhere to continue</div>
      </div>
    </div>
  );
}

function Dots({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px" }}>
      <span style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map((i) => (<span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `bounceDot 1.2s ${i * 0.15}s infinite ease-in-out` }} />))}
      </span>
      {label && <span style={{ ...mono, fontSize: 12.5, color: C.soft }}>{label}</span>}
    </div>
  );
}

/* ============================ TABS ============================ */
const TABS = [
  { id: "today", label: "Today", icon: Activity },
  { id: "quests", label: "Quests", icon: Gamepad2 },
  { id: "engine", label: "Engine", icon: Gauge },
  { id: "zones", label: "Zones", icon: Heart },
  { id: "load", label: "Load & Trends", icon: TrendingUp },
  { id: "routes", label: "Routes", icon: Map },
  { id: "plan", label: "Plan", icon: CalendarRange },
  { id: "train", label: "Guided", icon: Headphones },
  { id: "strength", label: "Strength", icon: Dumbbell },
  { id: "insights", label: "Insights", icon: Compass },
  { id: "lab", label: "Lab", icon: FlaskConical },
  { id: "body", label: "Body", icon: Footprints },
  { id: "fuel", label: "Fuel", icon: Utensils },
  { id: "refuel", label: "Refuel", icon: UtensilsCrossed },
  { id: "log", label: "Log", icon: NotebookPen },
  { id: "events", label: "Events", icon: Trophy },
  { id: "goals", label: "Goals", icon: Target },
  { id: "pioneer", label: "Pioneer", icon: Rocket },
  { id: "card", label: "Card", icon: Award },
  { id: "garden", label: "Garden", icon: Sprout },
  { id: "journey", label: "Journey", icon: Milestone },
  { id: "marks", label: "Marks", icon: Medal },
  { id: "coach", label: "AI Coach", icon: Sparkles },
];

export default function StrideApp() {
  const [tab, setTab] = useState("today");

  /* ---- TODAY: editable inputs + logged-data integration ---- */
  const [hrv, setHrv] = useState(ATHLETE.latest.hrv);
  const [rhr, setRhr] = useState(ATHLETE.latest.rhr);
  const [sleep, setSleep] = useState(ATHLETE.latest.sleep);
  const acwr = ATHLETE.acwr;
  const [fuelDone, setFuelDone] = useState(null); // null = not logged today
  const [strain3, setStrain3] = useState(0);
  const [streak, setStreak] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [greenOn, setGreenOn] = useState(false);
  const [showHigh, setShowHigh] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => { store.get("pref-sound").then((v) => { if (v === false) SOUND_ON = false; }); }, []);
  useEffect(() => { store.get("onboarded").then((v) => { if (!v) setShowOnboard(true); }); }, []);
  const [careerXp, setCareerXp] = useState(0);
  useEffect(() => {
    store.get("sport-log").then((d) => {
      const arr = Array.isArray(d) ? d : [];
      store.get("refuel-recipes").then((rc) => {
        store.get("route-passport").then((rp) => {
          store.get("quest-xp").then((qx) => {
            store.get("prs").then((pp) => {
              const xp = baseXP(arr, Array.isArray(rc) ? rc.length : 0, routeStampCount(rp), prRealCount(pp)) + (typeof qx === "number" ? qx : 0);
              setCareerXp(xp);
              const lvl = levelInfo(xp).lvl;
              store.get("level-seen").then((seen) => { if (typeof seen === "number" && lvl > seen) setLevelUp(lvl); store.set("level-seen", lvl); });
            });
          });
        });
      });
    });
  }, [tab]);
  useEffect(() => {
    store.get(`fuel-${todayKey()}`).then((d) => { if (d && d.checks) setFuelDone(Object.values(d.checks).filter(Boolean).length); });
    store.get("sport-log").then((d) => {
      if (Array.isArray(d)) {
        const s = d.filter((x) => (Date.now() - Date.parse(x.date)) / 86400000 < 3)
          .reduce((a, x) => a + (+x.rpe || 0) * (+x.minutes || 0), 0);
        setStrain3(s);
        const days = new Set(d.map((x) => x.date));
        let st = 0; const day = new Date();
        if (!days.has(day.toISOString().slice(0, 10))) day.setDate(day.getDate() - 1);
        while (days.has(day.toISOString().slice(0, 10))) { st++; day.setDate(day.getDate() - 1); }
        setStreak(st);
      }
    });
  }, [tab]);
  const fuelAdj = fuelDone == null ? 0 : fuelDone >= 5 ? 2 : fuelDone >= 3 ? 0 : -5;
  const strainAdj = strain3 > 1200 ? -6 : strain3 > 700 ? -3 : 0;
  const readiness = useMemo(() => {
    const hrvS = Math.max(0, Math.min(1, (hrv / ATHLETE.hrvAvg - 0.5) / 0.7)) * 40;
    const rhrS = Math.max(0, Math.min(1, (ATHLETE.rhr + 8 - rhr) / 8)) * 25;
    const slpS = Math.max(0, Math.min(1, sleep / 8)) * 25;
    const ldS = acwr <= 1.3 ? 10 : Math.max(0, (1.6 - acwr) / 0.3) * 10;
    return Math.max(0, Math.min(100, Math.round(hrvS + rhrS + slpS + ldS + fuelAdj + strainAdj)));
  }, [hrv, rhr, sleep, acwr, fuelAdj, strainAdj]);
  const prevReady = useRef(readiness);
  useEffect(() => {
    const crossed = prevReady.current < 72 && readiness >= 72;
    prevReady.current = readiness;
    if (crossed) { setCelebrate((c) => c + 1); setGreenOn(true); const id = setTimeout(() => setGreenOn(false), 3200); return () => clearTimeout(id); }
  }, [readiness]);
  const verdict =
    readiness >= 72 ? { t: "GREEN — go hard", d: "Your system is primed. A quality session (threshold or intervals) is well-supported today.", c: C.green }
    : readiness >= 54 ? { t: "AMBER — keep it easy", d: "Partial recovery. Run, but hold it to easy Z2 or cross-train. Save the hard work for a greener day.", c: C.amber }
    : { t: "RED — recover", d: "Your markers are asking for it. Easy movement, sleep and fuel today; intensity now would dig a hole.", c: C.accent };

  /* ---- ENGINE: calibratable predictor ---- */
  const [ttDist, setTtDist] = useState(10);   // km
  const [ttMin, setTtMin] = useState(46);
  const [ttSec, setTtSec] = useState(10);
  const calc = useMemo(() => {
    const d1 = ttDist * 1000, t1s = ttMin * 60 + ttSec, t1m = t1s / 60;
    const vdot = danielsVDOT(d1, t1m);
    const preds = [
      { d: "5 km", m: 5000 }, { d: "10 km", m: 10000 },
      { d: "Half", m: 21097.5 }, { d: "Marathon", m: 42195 },
    ].map((p) => {
      const t = riegel(t1s, d1, p.m);
      return { ...p, time: fmtTime(t), pace: secToPace(t / (p.m / 1000)) };
    });
    const ps = {}; preds.forEach((p) => (ps[p.d] = riegel(t1s, d1, p.m) / (p.m / 1000)));
    const gears = [
      { g: "Easy", p: `${secToPace(ps.Half + 75)}–${secToPace(ps.Half + 55)}`, z: "Z2", use: "aerobic base · 75–80%" },
      { g: "Marathon", p: secToPace(ps.Marathon), z: "Z3", use: "specific endurance" },
      { g: "Threshold", p: secToPace((ps["10 km"] + ps.Half) / 2), z: "Z4", use: "raise your ceiling · 8–10%" },
      { g: "Interval", p: secToPace(ps["5 km"] - 4), z: "Z5", use: "lift VO₂max · in blocks" },
      { g: "Rep", p: secToPace(ps["5 km"] - 22), z: "max", use: "economy & speed · sparing" },
    ];
    return { vdot: vdot.toFixed(1), preds, gears };
  }, [ttDist, ttMin, ttSec]);

  /* ---- ZONES: live sliders ---- */
  const [mx, setMx] = useState(ATHLETE.maxhr);
  const [rst, setRst] = useState(ATHLETE.rhr);
  const zones = useMemo(() => karvonen(mx, rst), [mx, rst]);

  /* ---- LOAD ---- */
  const fit = useMemo(() => fitnessModel(DAILY_LOAD), []);
  const curTsb = fit[fit.length - 1].tsb;

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: "'Hanken Grotesk', sans-serif",
      backgroundImage: "radial-gradient(rgba(23,21,15,.025) 1px,transparent 1px)", backgroundSize: "4px 4px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800;9..144,900&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        input[type=range]{-webkit-appearance:none;height:6px;border-radius:99px;background:${C.line};outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${C.accent};cursor:pointer;border:3px solid ${C.paper};box-shadow:0 2px 8px -1px rgba(226,68,31,.55)}
        ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:${C.line};border-radius:8px}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border:none;border-radius:50%;background:${C.accent};cursor:pointer}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes ambientDrift{0%,100%{background-position:0% 0%}50%{background-position:12% 8%}}
        button{transition:transform .12s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease}
        button:active{transform:scale(.95)}
        .card{transition:transform .26s cubic-bezier(.2,.7,.2,1), box-shadow .26s ease}
        @media(hover:hover){.card:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 20px 42px -26px rgba(23,21,15,.5),0 3px 8px -3px rgba(23,21,15,.08)}}
        .tabwrap>div>*{animation:fadeUp .5s cubic-bezier(.2,.7,.2,1) both}
        .tabwrap>div>*:nth-child(1){animation-delay:.02s}
        .tabwrap>div>*:nth-child(2){animation-delay:.07s}
        .tabwrap>div>*:nth-child(3){animation-delay:.12s}
        .tabwrap>div>*:nth-child(4){animation-delay:.17s}
        .tabwrap>div>*:nth-child(5){animation-delay:.22s}
        .tabwrap>div>*:nth-child(6){animation-delay:.27s}
        .tabwrap>div>*:nth-child(7){animation-delay:.31s}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}12%{opacity:1}100%{transform:translateY(-108vh);opacity:0}}
        @keyframes auroraShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes orbPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.13);opacity:1}}
        @keyframes popIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
        @keyframes grow{from{width:0 !important}}
        @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 3px rgba(47,125,82,.4))}50%{filter:drop-shadow(0 0 11px rgba(47,125,82,.85))}}
        @keyframes pulseDot{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 9px transparent}100%{box-shadow:0 0 0 0 transparent}}
        @keyframes bounceDot{0%,80%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-6px);opacity:1}}
        .ringpulse{animation:glowPulse 1.8s ease-in-out infinite}
        @keyframes shineSweep{0%{transform:translateX(-160%) skewX(-18deg)}55%,100%{transform:translateX(280%) skewX(-18deg)}}
        @keyframes forgeRing{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.6);opacity:0}}
        @keyframes petalFall{0%{transform:translateY(-12vh) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translateY(110vh) rotate(420deg);opacity:.2}}
        @keyframes twinkle{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1)}}
        @keyframes floatMed{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes dropIn{0%{transform:translateY(-34px) scale(.4);opacity:0}60%{transform:translateY(5px) scale(1.13)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes jiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
        .food{transition:transform .12s ease}
        .food:hover{animation:jiggle .45s ease}
        .food:active{transform:scale(.9)}
        @keyframes heartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.28)}28%{transform:scale(1)}42%{transform:scale(1.16)}56%{transform:scale(1)}}
        @keyframes drawLine{from{stroke-dashoffset:1600}to{stroke-dashoffset:0}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`}</style>

      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(58% 42% at 14% 6%, rgba(226,68,31,.07), transparent 70%), radial-gradient(52% 38% at 90% 20%, rgba(201,138,18,.06), transparent 72%), radial-gradient(72% 55% at 82% 102%, rgba(30,95,140,.055), transparent 72%)", backgroundSize: "190% 190%", animation: "ambientDrift 28s ease-in-out infinite" }} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 90px", position: "relative", zIndex: 1 }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ ...mono, fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: C.deep, fontWeight: 600 }}>Personal Running OS</div>
            <h1 style={{ ...serif, fontSize: 44, fontWeight: 900, letterSpacing: "-.03em", lineHeight: .9, marginTop: 4 }}>STRIDE</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...mono, fontSize: 11, color: C.soft, textAlign: "right" }}>
              {ATHLETE.name} · VO₂ {ATHLETE.vo2}<br />VDOT ~{calc.vdot}
            </div>
            <button onClick={() => setShowSettings(true)} aria-label="Settings" style={{ width: 38, height: 38, flex: "none", borderRadius: 11, border: `1px solid ${C.line}`, background: C.card, display: "grid", placeItems: "center", cursor: "pointer", color: C.soft }}><SettingsIcon size={18} /></button>
          </div>
        </div>

        <div className="tabwrap" key={tab}>
        {/* TODAY */}
        {tab === "today" && (          <div>
            <TodayHero readiness={readiness} onGo={setTab} />
            <SectionTitle n="01">Today's readiness</SectionTitle>
            <Card style={{ padding: 20, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", borderLeft: `4px solid ${verdict.c}` }}>
              <Ring score={readiness} />
              <div style={{ flex: 1, minWidth: 230 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: verdict.c, color: verdict.c, animation: "pulseDot 1.9s infinite" }} />
                  <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: verdict.c }}>{verdict.t}</div>
                </div>
                <p style={{ fontSize: 14, color: C.soft, marginTop: 6, lineHeight: 1.55 }}>{verdict.d}</p>
                <div style={{ ...mono, fontSize: 11, color: C.soft, marginTop: 10 }}>
                  computed from HRV · resting HR · sleep · 7-day load (ACWR {acwr})
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <FactorPill label={fuelDone == null ? "Fuel: not logged" : `Fuel ${fuelDone}/6`} good={fuelDone != null && fuelDone >= 5} bad={fuelDone != null && fuelDone < 3} />
                  <FactorPill label={`3-day strain: ${strain3 > 1200 ? "high" : strain3 > 700 ? "moderate" : "low"}`} good={strain3 <= 700} bad={strain3 > 1200} />
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 128, display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 15px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#E2441F,#C98A12)", display: "grid", placeItems: "center", color: "#fff", ...mono, fontWeight: 700, fontSize: 15, flex: "none" }}>{levelInfo(careerXp).lvl}</span>
                <div style={{ minWidth: 0 }}><div style={{ ...serif, fontSize: 15, fontWeight: 700, lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titleFor(levelInfo(careerXp).lvl)}</div><div style={{ ...mono, fontSize: 9.5, color: C.soft, letterSpacing: ".06em" }}>LEVEL {levelInfo(careerXp).lvl}</div></div>
              </div>
              <div style={{ flex: 1, minWidth: 128, display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 15px" }}>
                <span style={{ fontSize: 24 }}>🔥</span>
                <div><div style={{ ...serif, fontSize: 23, fontWeight: 700, lineHeight: 1 }}>{streak}<span style={{ fontSize: 12, color: C.soft }}> day{streak === 1 ? "" : "s"}</span></div><div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em" }}>LOG STREAK</div></div>
              </div>
              <button onClick={() => setShowHigh(true)} style={{ flex: 1, minWidth: 150, border: "none", borderRadius: 14, padding: "12px 15px", cursor: "pointer", color: "#fff", background: "linear-gradient(120deg,#E2441F,#C98A12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...mono, fontSize: 13, fontWeight: 600, boxShadow: "0 10px 26px -14px rgba(226,68,31,.7)" }}>
                <Sparkles size={16} /> Runner's High
              </button>
            </div>

            <p style={{ ...mono, fontSize: 11, color: C.soft, margin: "18px 0 8px", letterSpacing: ".08em" }}>LOG TODAY — watch the score respond</p>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
              {[
                { lbl: "HRV (ms)", val: hrv, set: setHrv, min: 30, max: 120, icon: Wind },
                { lbl: "Resting HR", val: rhr, set: setRhr, min: 40, max: 70, icon: Heart },
                { lbl: "Sleep (hrs)", val: sleep, set: setSleep, min: 3, max: 9, step: 0.5, icon: Moon },
              ].map((s) => (
                <Card key={s.lbl} style={{ padding: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.soft }}>
                    <s.icon size={15} /><span style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.lbl}</span>
                  </div>
                  <div style={{ ...serif, fontSize: 28, fontWeight: 600, margin: "6px 0" }}>{s.val}</div>
                  <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.val}
                    onChange={(e) => s.set(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </Card>
              ))}
            </div>

            <SectionTitle n="02"><span style={{ marginTop: 8, display: "inline-block" }}>Vitals at a glance</span></SectionTitle>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))" }}>
              <Stat k="VO₂ max" v={ATHLETE.vo2} n="↑ from 38 in 6mo" color={C.green} />
              <Stat k="HRV avg" v={ATHLETE.hrvAvg} n={`ceiling ${ATHLETE.hrvCeil}`} />
              <Stat k="Resting HR" v={ATHLETE.rhr} n="athlete-grade" />
              <Stat k="Load ACWR" v={acwr} n="upper-safe" color={C.amber} />
              <Stat k="Form (TSB)" v={curTsb} n={curTsb < -10 ? "fatigued" : "fresh"} color={curTsb < -10 ? C.accent : C.green} />
            </div>

            <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Best time to run today</span></SectionTitle>
            <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>Live London weather, scored for running — so you pick the cool, dry, calm window and save the heat for easy days.</p>
            <WeatherWindow />

            <SectionTitle n="04"><span style={{ marginTop: 18, display: "inline-block" }}>Mood &amp; energy</span></SectionTitle>
            <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>How you feel is training data too. Over time, patterns surface — and on heavy weeks, this is the gentlest early-warning you have.</p>
            <MoodJournal />
          </div>
        )}

        {/* QUESTS */}
        {tab === "quests" && <Quests />}

        {/* ROUTES */}
        {tab === "routes" && <Routes />}

        {/* GUIDED */}
        {tab === "train" && <Train />}

        {/* ENGINE */}
        {tab === "engine" && (
          <div>
            <SectionTitle n="01">Calibrate your engine</SectionTitle>
            <p style={{ fontSize: 14, color: C.soft, marginBottom: 14 }}>
              Enter any recent hard effort or time trial. Everything below — race predictions and all five training paces — recomputes from <b style={{ color: C.deep }}>your</b> number, not an estimate.
            </p>
            <Tachometer vdot={calc.vdot} vo2={ATHLETE.vo2} />
            <GhostRace />
            <Card style={{ padding: 18, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ ...mono, fontSize: 11, color: C.soft, marginBottom: 6 }}>DISTANCE (km)</div>
                <input type="number" value={ttDist} step="0.1" onChange={(e) => setTtDist(parseFloat(e.target.value) || 1)}
                  style={{ ...mono, width: 90, fontSize: 18, padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper }} />
              </div>
              <div>
                <div style={{ ...mono, fontSize: 11, color: C.soft, marginBottom: 6 }}>TIME (min : sec)</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" value={ttMin} onChange={(e) => setTtMin(parseInt(e.target.value) || 0)}
                    style={{ ...mono, width: 64, fontSize: 18, padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper }} />
                  <span style={{ ...serif, fontSize: 20 }}>:</span>
                  <input type="number" value={ttSec} onChange={(e) => setTtSec(parseInt(e.target.value) || 0)}
                    style={{ ...mono, width: 64, fontSize: 18, padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper }} />
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ ...mono, fontSize: 11, color: C.soft }}>VDOT</div>
                <div style={{ ...serif, fontSize: 38, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{calc.vdot}</div>
              </div>
            </Card>

            <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>Equivalent race performances</span></SectionTitle>
            <Card style={{ overflow: "hidden" }}>
              {calc.preds.map((p, i) => (
                <div key={p.d} style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderTop: i ? `1px solid ${C.line}` : "none", background: p.d === "Half" ? "rgba(226,68,31,.06)" : "transparent" }}>
                  <div style={{ ...serif, fontSize: 17, fontWeight: 600, flex: 1 }}>{p.d}</div>
                  <div style={{ ...mono, fontSize: 19, fontWeight: 600, color: C.deep, width: 110, textAlign: "right" }}>{p.time}</div>
                  <div style={{ ...mono, fontSize: 13, color: C.soft, width: 90, textAlign: "right" }}>{p.pace}/km</div>
                </div>
              ))}
            </Card>

            <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Your five training gears</span></SectionTitle>
            <Card style={{ overflow: "hidden" }}>
              {calc.gears.map((g, i) => (
                <div key={g.g} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <div style={{ width: 96 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{g.g}</div><div style={{ ...mono, fontSize: 10, color: C.soft }}>{g.z}</div></div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 600, color: C.deep, width: 110 }}>{g.p}</div>
                  <div style={{ fontSize: 12.5, color: C.soft, flex: 1, textAlign: "right" }}>{g.use}</div>
                </div>
              ))}
            </Card>
            <p style={{ ...mono, fontSize: 11, color: C.soft, marginTop: 12 }}>↑ Seeded with your VO₂-estimated 10K. Run a real TT and type it in to ground-truth everything.</p>
          </div>
        )}

        {/* ZONES */}
        {tab === "zones" && (
          <div>
            <SectionTitle n="01">Live heart-rate zones</SectionTitle>
            <p style={{ fontSize: 14, color: C.soft, marginBottom: 14 }}>Karvonen method (HR reserve). Drag the sliders — calibrate to your own max and resting HR and the zones recompute instantly.</p>
            <HeartLadder zones={zones} />
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginBottom: 18 }}>
              {[{ lbl: "Max HR", v: mx, set: setMx, min: 170, max: 205 }, { lbl: "Resting HR", v: rst, set: setRst, min: 38, max: 60 }].map((s) => (
                <Card key={s.lbl} style={{ padding: 15 }}>
                  <div style={{ ...mono, fontSize: 11, color: C.soft, textTransform: "uppercase", letterSpacing: ".08em" }}>{s.lbl}</div>
                  <div style={{ ...serif, fontSize: 30, fontWeight: 600, margin: "6px 0" }}>{s.v} <span style={{ fontSize: 13, color: C.soft }}>bpm</span></div>
                  <input type="range" min={s.min} max={s.max} value={s.v} onChange={(e) => s.set(parseInt(e.target.value))} style={{ width: "100%" }} />
                </Card>
              ))}
            </div>
            {zones.map((z) => (
              <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: C.card, border: `1px solid ${C.line}`, borderLeft: `5px solid ${z.c}`, borderRadius: 12, marginBottom: 9 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...serif, fontSize: 16, fontWeight: 600 }}>{z.name}</div>
                  <div style={{ fontSize: 12.5, color: C.soft }}>{z.use}</div>
                </div>
                <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: z.c }}>{z.r[0]}–{z.r[1]}</div>
              </div>
            ))}
          </div>
        )}

        {/* LOAD & TRENDS */}
        {tab === "load" && (
          <div>
            <SectionTitle n="01">Fitness · Fatigue · Form</SectionTitle>
            <p style={{ fontSize: 14, color: C.soft, marginBottom: 12 }}>
              The TrainingPeaks model, built from your daily load. <b style={{ color: C.green }}>Fitness</b> (chronic) is your engine; <b style={{ color: C.accent }}>Fatigue</b> (acute) is recent cost; <b>Form</b> = the gap. Form is currently <b style={{ color: curTsb < -10 ? C.accent : C.green }}>{curTsb}</b> — {curTsb < -10 ? "you're carrying fatigue, as your recovery dip confirms." : "fresh and ready."}
            </p>
            <FormBattery tsb={curTsb} />
            <Card style={{ padding: "14px 8px 6px" }}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={fit}>
                  <defs>
                    <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.34} /><stop offset="100%" stopColor={C.green} stopOpacity={0.02} /></linearGradient>
                    <linearGradient id="atlFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.26} /><stop offset="100%" stopColor={C.accent} stopOpacity={0.02} /></linearGradient>
                    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.green} floodOpacity="0.45" /></filter>
                    <filter id="glowAccent" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.accent} floodOpacity="0.4" /></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="d" tick={{ ...mono, fontSize: 10, fill: C.soft }} />
                  <YAxis tick={{ ...mono, fontSize: 10, fill: C.soft }} />
                  <Tooltip contentStyle={{ ...mono, fontSize: 12, borderRadius: 10, border: `1px solid ${C.line}` }} />
                  <Area type="monotone" dataKey="ctl" stroke={C.green} fill="url(#ctlFill)" strokeWidth={2.5} name="Fitness" filter="url(#glowGreen)" />
                  <Area type="monotone" dataKey="atl" stroke={C.accent} fill="url(#atlFill)" strokeWidth={2.5} name="Fatigue" filter="url(#glowAccent)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>Recovery markers (weekly)</span></SectionTitle>
            <Card style={{ padding: "14px 8px 6px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={RECOVERY}>
                  <defs>
                    <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={C.blue} floodOpacity="0.5" /></filter>
                    <filter id="glowAccent2" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={C.accent} floodOpacity="0.45" /></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="wk" tick={{ ...mono, fontSize: 9, fill: C.soft }} />
                  <YAxis tick={{ ...mono, fontSize: 10, fill: C.soft }} />
                  <Tooltip contentStyle={{ ...mono, fontSize: 12, borderRadius: 10, border: `1px solid ${C.line}` }} />
                  <Line type="monotone" dataKey="hrv" stroke={C.blue} strokeWidth={2.5} dot={{ r: 3 }} name="HRV (ms)" filter="url(#glowBlue)" />
                  <Line type="monotone" dataKey="rhr" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3 }} name="RHR (bpm)" filter="url(#glowAccent2)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>The 80/20 gap</span></SectionTitle>
            <Card style={{ padding: 16 }}>
              {[{ l: "YOU (last 2 months)", e: 97, h: 3 }, { l: "Evidence-based target", e: 80, h: 20 }].map((row) => (
                <div key={row.l} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <b>{row.l}</b><span style={{ ...mono, color: C.soft }}>{row.e}/{row.h}</span>
                  </div>
                  <div style={{ display: "flex", height: 24, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.line}` }}>
                    <div style={{ width: `${row.e}%`, background: C.green, color: "#fff", ...mono, fontSize: 10, display: "grid", placeItems: "center", animation: "grow 1.2s cubic-bezier(.2,.7,.2,1) both" }}>{row.e}% EASY</div>
                    <div style={{ width: `${row.h}%`, background: row.h > 5 ? C.accent : C.line, color: row.h > 5 ? "#fff" : C.soft, ...mono, fontSize: 10, display: "grid", placeItems: "center", animation: "grow 1.2s .15s cubic-bezier(.2,.7,.2,1) both" }}>{row.h > 5 ? `${row.h}% HARD` : ""}</div>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 13, color: C.soft, marginTop: 4 }}>The missing 20% (threshold + VO₂) is the fastest, easiest gain available to you.</p>
            </Card>

            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
              <Card style={{ padding: "14px 8px 6px" }}>
                <div style={{ ...mono, fontSize: 11, color: C.soft, padding: "0 8px 6px" }}>VO₂ MAX TREND</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={VO2_TREND}>
                    <defs><linearGradient id="vo2Bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5FBF88" /><stop offset="100%" stopColor={C.green} /></linearGradient></defs>
                    <XAxis dataKey="m" tick={{ ...mono, fontSize: 10, fill: C.soft }} />
                    <YAxis domain={[30, 55]} tick={{ ...mono, fontSize: 9, fill: C.soft }} width={28} />
                    <Tooltip contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>{VO2_TREND.map((e, i) => <Cell key={i} fill={i === 2 ? "url(#vo2Bar)" : C.line} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card style={{ padding: "14px 8px 6px" }}>
                <div style={{ ...mono, fontSize: 11, color: C.soft, padding: "0 8px 6px" }}>RUNS — PACE vs DISTANCE</div>
                <ResponsiveContainer width="100%" height={150}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis type="number" dataKey="x" name="km" domain={[3, 20]} tick={{ ...mono, fontSize: 9, fill: C.soft }} />
                    <YAxis type="number" dataKey="y" name="pace" domain={[4.5, 7.6]} reversed tick={{ ...mono, fontSize: 9, fill: C.soft }} width={28} />
                    <Tooltip contentStyle={{ ...mono, fontSize: 11, borderRadius: 10 }} />
                    <ReferenceLine y={4.97} stroke={C.accent} strokeDasharray="4 4" />
                    <Scatter data={RUNS} fill={C.blue} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* PLAN */}
        {tab === "plan" && <PlanGenerator />}

        {/* INSIGHTS */}
        {tab === "insights" && <Insights />}

        {/* LAB */}
        {tab === "lab" && <Lab />}

        {/* BODY */}
        {tab === "body" && <Body />}
        {tab === "strength" && <Strength />}
        {tab === "garden" && <Garden />}
        {tab === "journey" && <Journey />}

        {/* FUEL */}
        {tab === "fuel" && <FuelLog />}

        {/* REFUEL */}
        {tab === "refuel" && <Refuel />}

        {/* LOG */}
        {tab === "log" && <SportLog />}

        {/* EVENTS */}
        {tab === "events" && <Events />}

        {/* GOALS */}
        {tab === "goals" && <Goals />}

        {/* PIONEER */}
        {tab === "pioneer" && <Pioneer />}

        {/* CARD */}
        {tab === "card" && <AthleteCard />}

        {/* MARKS */}
        {tab === "marks" && <Marks />}

        {/* COACH */}
        {tab === "coach" && <Coach />}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(251,248,241,.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "flex-start", gap: 4, padding: "8px 6px", boxShadow: "0 -8px 24px -18px rgba(0,0,0,.3)", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {TABS.map((t) => {
          const on = tab === t.id; const I = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 9px", border: "none",
              background: on ? "rgba(226,68,31,.1)" : "transparent", borderRadius: 12, cursor: "pointer", color: on ? C.accent : C.soft, minWidth: 52, flexShrink: 0 }}>
              <I size={19} />
              <span style={{ ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: ".03em" }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <Confetti fire={celebrate} />
      {greenOn && (
        <div style={{ position: "fixed", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 70, pointerEvents: "none" }}>
          <div style={{ ...mono, fontSize: 13, fontWeight: 600, background: C.green, color: "#fff", padding: "10px 18px", borderRadius: 999, boxShadow: "0 10px 30px -10px rgba(47,125,82,.6)", animation: "popIn .4s" }}>🟢 You're primed — green light to go hard!</div>
        </div>
      )}
      {showHigh && <RunnerHigh onClose={() => setShowHigh(false)} />}
      {levelUp != null && <LevelUp level={levelUp} onClose={() => setLevelUp(null)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} onReplayIntro={() => { setShowSettings(false); setShowOnboard(true); }} />}
      {showOnboard && <Onboarding onDone={() => { store.set("onboarded", true); setShowOnboard(false); }} />}
    </div>
  );
}

/* ============================ LIVING INSTRUMENTS (tachometer · heart ladder · form battery) ============================ */
const polar = (cx, cy, r, deg) => { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
const arcPath = (cx, cy, r, a0, a1) => { const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1); const large = Math.abs(a0 - a1) > 180 ? 1 : 0; return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
function Tachometer({ vdot, vo2 }) {
  const cx = 110, cy = 116, r = 80, A0 = 225, A1 = -45;
  const ang = (f) => A0 - (A0 - A1) * Math.max(0, Math.min(1, f));
  const f = Math.max(0, Math.min(1, (vdot - 30) / 40));
  const [na, setNa] = useState(A0);
  const ref = useRef(A0), rafRef = useRef(0);
  const tween = (to, dur, after) => {
    cancelAnimationFrame(rafRef.current);
    const from = ref.current, s = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - s) / dur); const e = 1 - Math.pow(1 - p, 3); const v = from + (to - from) * e; ref.current = v; setNa(v); if (p < 1) rafRef.current = requestAnimationFrame(tick); else if (after) after(); };
    rafRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => { tween(ang(f), 950); return () => cancelAnimationFrame(rafRef.current); }, [vdot]);
  const rev = () => tween(ang(0.98), 320, () => tween(ang(f), 760));
  const [nx, ny] = polar(cx, cy, r - 15, na);
  return (
    <Card style={{ padding: "12px 0 8px", marginBottom: 14 }}>
      <svg viewBox="0 0 220 170" width="100%" style={{ maxWidth: 330, display: "block", margin: "0 auto" }}>
        <path d={arcPath(cx, cy, r, A0, A1)} stroke={C.line} strokeWidth="13" fill="none" strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, A0, ang(0.6))} stroke={C.green} strokeWidth="13" fill="none" />
        <path d={arcPath(cx, cy, r, ang(0.6), ang(0.85))} stroke={C.amber} strokeWidth="13" fill="none" />
        <path d={arcPath(cx, cy, r, ang(0.85), A1)} stroke={C.accent} strokeWidth="13" fill="none" />
        {Array.from({ length: 11 }).map((_, i) => { const [x1, y1] = polar(cx, cy, r - 6, ang(i / 10)); const [x2, y2] = polar(cx, cy, r - 15, ang(i / 10)); return <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="#fff" strokeWidth="1.5" />; })}
        <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke={C.ink} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="8" fill={C.ink} />
        <text x={cx} y={cy + 34} textAnchor="middle" style={{ ...serif, fontSize: 32, fontWeight: 800, fill: C.ink }}>{vdot}</text>
        <text x={cx} y={cy + 50} textAnchor="middle" style={{ ...mono, fontSize: 9, letterSpacing: ".18em", fill: C.soft }}>ENGINE · VDOT</text>
      </svg>
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <button onClick={rev} style={{ ...mono, fontSize: 12, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 999, padding: "7px 16px", cursor: "pointer" }}>🔥 Rev it</button>
        <span style={{ ...mono, fontSize: 12, color: C.soft, marginLeft: 12 }}>VO₂ max {vo2} · redline = race effort</span>
      </div>
    </Card>
  );
}
function HeartLadder({ zones }) {
  const [sel, setSel] = useState(Math.min(1, zones.length - 1));
  const z = zones[sel] || zones[0];
  const mid = (z.r[0] + z.r[1]) / 2;
  const dur = Math.max(0.42, 60 / mid).toFixed(2);
  return (
    <Card style={{ padding: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 84, textAlign: "center", flex: "none" }}>
          <div style={{ fontSize: 52, lineHeight: 1, animation: `heartBeat ${dur}s ease-in-out infinite` }}>❤️</div>
          <div style={{ ...mono, fontSize: 11, color: C.soft, marginTop: 2 }}>~{Math.round(mid)} bpm</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...serif, fontSize: 21, fontWeight: 700, color: z.c }}>{z.name}</div>
          <div style={{ ...mono, fontSize: 13, color: C.deep }}>{z.r[0]}–{z.r[1]} bpm</div>
          <p style={{ fontSize: 13, color: C.soft, marginTop: 5, lineHeight: 1.4 }}>{z.use}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 5, marginTop: 14 }}>
        {zones.map((zz, i) => (
          <button key={zz.name} onClick={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 11, border: "none", cursor: "pointer", borderRadius: 9, padding: "8px 11px", background: i === sel ? zz.c : "transparent", transition: "all .25s" }}>
            <span style={{ width: `${28 + i * 15}%`, height: 9, borderRadius: 9, flex: "none", background: i === sel ? "rgba(255,255,255,.75)" : zz.c, opacity: i === sel ? 1 : 0.5, transition: "all .3s" }} />
            <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: i === sel ? "#fff" : C.soft }}>{zz.name}</span>
          </button>
        ))}
      </div>
      <div style={{ ...mono, fontSize: 10.5, color: C.soft, textAlign: "center", marginTop: 10 }}>tap a zone — feel your heart find its rhythm</div>
    </Card>
  );
}
function FormBattery({ tsb }) {
  const charge = Math.max(5, Math.min(100, Math.round((tsb + 30) / 55 * 100)));
  const col = tsb < -10 ? C.accent : tsb < 5 ? C.amber : C.green;
  const label = tsb < -10 ? "Drained — recovering" : tsb < 5 ? "Charging up" : tsb < 15 ? "Charged & ready" : "Fully peaked";
  return (
    <Card style={{ padding: 18, marginBottom: 18, display: "flex", gap: 18, alignItems: "center" }}>
      <div style={{ position: "relative", width: 66, height: 34, border: `3px solid ${C.ink}`, borderRadius: 7, flex: "none" }}>
        <div style={{ position: "absolute", right: -7, top: 9, width: 5, height: 14, background: C.ink, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 2, top: 2, bottom: 2, width: `calc(${charge}% - 4px)`, background: col, borderRadius: 4, animation: "grow 1.1s cubic-bezier(.2,.7,.2,1) both", transition: "width .5s, background .3s" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...serif, fontSize: 20, fontWeight: 700, color: col }}>{label}</div>
        <div style={{ ...mono, fontSize: 12, color: C.soft }}>Form battery · TSB {tsb} · {charge}% charged</div>
      </div>
    </Card>
  );
}

/* ============================ PLAN GENERATOR (adaptive 12-week) ============================ */
function PlanGenerator() {
  const T1 = 46 * 60 + 10, D1 = 10000;
  const pace = (m) => riegel(T1, D1, m) / (m / 1000);
  const pHalf = pace(21097.5), p10 = pace(10000), p5 = pace(5000), pM = pace(42195);
  const PACE = {
    easy: `${secToPace(pHalf + 75)}–${secToPace(pHalf + 55)}`,
    mp: secToPace(pM),
    thr: secToPace((p10 + pHalf) / 2),
    vo2: secToPace(p5 - 4),
  };

  const SES = {
    strides: { title: "Easy + strides", detail: `30–35 min easy (${PACE.easy}) + 6×20s strides, full recovery`, tag: "quality" },
    tempoIntro: { title: "Tempo introduction", detail: `15' wu → 2×8 min @ tempo (~${PACE.thr}) w/ 2' float → 10' cd`, tag: "quality" },
    threshold: { title: "Threshold", detail: `15' wu → 3×10 min @ ${PACE.thr} (Z4) w/ 3' jog → 10' cd`, tag: "quality" },
    thresholdLong: { title: "Threshold — extended", detail: `15' wu → 4×10 min @ ${PACE.thr} (Z4) w/ 2' jog → cd`, tag: "quality" },
    tempo: { title: "Tempo", detail: `15' wu → 20 min steady @ ~${PACE.thr} → 10' cd`, tag: "quality" },
    vo2: { title: "VO₂ intervals", detail: `15' wu → 5×3 min @ ${PACE.vo2} (Z5) w/ 2.5' jog → 10' cd`, tag: "vo2" },
    vo2Short: { title: "VO₂ sharpener", detail: `15' wu → 6×2 min @ ${PACE.vo2} (Z5) w/ full recovery → cd`, tag: "vo2" },
    test: { title: "5K / 10K time trial", detail: `Full warm-up → all-out TT when fresh → type the result into the Engine tab to recalibrate everything`, tag: "vo2" },
  };
  const easy = { title: "Easy run", detail: `40–45 min easy (${PACE.easy}), Z2`, tag: "easy" };
  const easyStr = { title: "Easy + strides", detail: `35 min easy + 4×20s strides`, tag: "easy" };
  const cross = { title: "Cross-train", detail: `60 min Z2 cycle or skill climb — away from quality days`, tag: "cross" };
  const rest = { title: "Rest / mobility", detail: `Full rest, or 25 min strength + mobility`, tag: "rest" };
  const recov = { title: "Recovery", detail: `30 min very easy spin/walk, or rest`, tag: "rest" };
  const longRun = (km, mp) => ({ title: `Long run · ${km} km`, detail: mp ? `Easy Z2, final 15 min @ marathon pace (${PACE.mp})` : `Easy Z2 throughout (${PACE.easy})`, tag: "long" });

  const PLAN = [
    { w: 1, phase: "Base Consolidation", focus: "Re-introduce light structure", vol: "~35 km", q: ["strides"], long: 14 },
    { w: 2, phase: "Base Consolidation", focus: "First threshold touch", vol: "~38 km", q: ["tempoIntro"], long: 16 },
    { w: 3, phase: "Base Consolidation", focus: "Deload — absorb the work", vol: "~26 km", q: [], long: 12 },
    { w: 4, phase: "Threshold Development", focus: "Threshold + marathon-pace long", vol: "~40 km", q: ["threshold"], long: 17, mp: true },
    { w: 5, phase: "Threshold Development", focus: "Extend the threshold", vol: "~42 km", q: ["thresholdLong"], long: 18, mp: true },
    { w: 6, phase: "Threshold Development", focus: "Two quality sessions", vol: "~44 km", q: ["threshold", "tempo"], long: 18 },
    { w: 7, phase: "Threshold Development", focus: "Deload — absorb", vol: "~30 km", q: [], long: 13 },
    { w: 8, phase: "VO₂ & Sharpening", focus: "Introduce VO₂ max work", vol: "~42 km", q: ["vo2", "threshold"], long: 16 },
    { w: 9, phase: "VO₂ & Sharpening", focus: "VO₂ + threshold combo", vol: "~44 km", q: ["vo2", "threshold"], long: 17 },
    { w: 10, phase: "VO₂ & Sharpening", focus: "Peak quality block", vol: "~45 km", q: ["vo2", "thresholdLong"], long: 18 },
    { w: 11, phase: "VO₂ & Sharpening", focus: "Sharpen — cut volume, keep edge", vol: "~34 km", q: ["vo2Short"], long: 13 },
    { w: 12, phase: "Test / Race", focus: "Time-trial & re-calibrate", vol: "~28 km", q: ["test"], long: 10 },
  ];
  const PHASE_C = { "Base Consolidation": C.green, "Threshold Development": C.amber, "VO₂ & Sharpening": C.accent, "Test / Race": C.ink };
  const TAG_C = { easy: C.green, quality: C.amber, vo2: C.accent, long: C.blue, cross: C.soft, rest: C.line };

  const [wk, setWk] = useState(1);
  const [rd, setRd] = useState("green");

  const buildDays = (s) => {
    const q1 = s.q[0] ? SES[s.q[0]] : easyStr;
    const thu = s.q[1] ? SES[s.q[1]] : cross;
    const fri = s.q[1] ? rest : easyStr;
    return [
      { dow: "Mon", ...rest },
      { dow: "Tue", ...q1 },
      { dow: "Wed", ...easy },
      { dow: "Thu", ...thu },
      { dow: "Fri", ...fri },
      { dow: "Sat", ...longRun(s.long, s.mp) },
      { dow: "Sun", ...recov },
    ];
  };
  const adapt = (days) => days.map((d) => {
    if (rd === "green") return d;
    if (rd === "amber") {
      if (d.tag === "quality" || d.tag === "vo2")
        return { ...d, title: "Easy (quality deferred)", detail: `Markers amber — 40 min easy Z2 (${PACE.easy}); reschedule the hard set to a green day.`, tag: "easy" };
      if (d.tag === "long") return { ...d, detail: d.detail + " · trim 15–20% if legs feel heavy" };
      return d;
    }
    if (d.tag === "quality" || d.tag === "vo2")
      return { ...d, title: "Recover — skip quality", detail: "Markers red. Rest or 20–30 min very easy. Adaptation beats intensity today.", tag: "rest" };
    if (d.tag === "long") return { ...d, title: "Easy (deload)", detail: `45 min easy Z2 max (${PACE.easy})`, tag: "easy" };
    if (d.tag === "easy") return { ...d, detail: `30 min very easy (${PACE.easy})`, title: "Very easy" };
    return d;
  });

  const spec = PLAN[wk - 1];
  const days = adapt(buildDays(spec));
  const ratio = rd === "green" ? "≈ 80 / 20" : rd === "amber" ? "≈ 90 / 10" : "≈ 100 / 0";

  return (
    <div>
      <SectionTitle n="01">Adaptive 12-week plan</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 14 }}>
        Built from your VDOT paces and the 80/20 model: base → threshold → VO₂ → test. Pick a week, then set this week's readiness — the plan rewrites its hard sessions so you never force a quality day onto a tired body.
      </p>

      {/* periodization map */}
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {PLAN.map((p) => (
          <button key={p.w} onClick={() => setWk(p.w)} title={`Week ${p.w} · ${p.phase}`} style={{
            flex: 1, height: 38, border: wk === p.w ? `2px solid ${C.ink}` : "1px solid transparent",
            borderRadius: 7, cursor: "pointer", background: PHASE_C[p.phase], opacity: wk === p.w ? 1 : 0.5,
            color: p.phase === "VO₂ & Sharpening" || p.phase === "Test / Race" ? "#fff" : C.ink, ...mono, fontSize: 11, fontWeight: 600 }}>
            {p.w}
          </button>
        ))}
      </div>

      {/* readiness selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ k: "green", l: "Green — go", c: C.green }, { k: "amber", l: "Amber — easy", c: C.amber }, { k: "red", l: "Red — recover", c: C.accent }].map((o) => (
          <button key={o.k} onClick={() => setRd(o.k)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 11, cursor: "pointer", ...mono, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${o.c}`, background: rd === o.k ? o.c : "transparent", color: rd === o.k ? "#fff" : o.c }}>
            {o.l}
          </button>
        ))}
      </div>

      {/* week header */}
      <Card style={{ padding: 16, borderLeft: `4px solid ${PHASE_C[spec.phase]}`, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ ...mono, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: PHASE_C[spec.phase] === C.ink ? C.deep : PHASE_C[spec.phase], fontWeight: 600 }}>{spec.phase}</div>
            <div style={{ ...serif, fontSize: 22, fontWeight: 600, marginTop: 2 }}>Week {spec.w} — {spec.focus}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...mono, fontSize: 11, color: C.soft }}>VOLUME · EASY:HARD</div>
            <div style={{ ...mono, fontSize: 15, fontWeight: 600, color: C.deep }}>{rd === "red" ? "reduced" : spec.vol} · {ratio}</div>
          </div>
        </div>
      </Card>

      {/* days */}
      {days.map((d, i) => (
        <div key={i} style={{ display: "flex", gap: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ width: 56, background: C.paper2 || "#EDE7D9", display: "grid", placeItems: "center", borderRight: `1px solid ${C.line}` }}>
            <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.soft }}>{d.dow}</span>
          </div>
          <div style={{ flex: 1, padding: "11px 14px", borderLeft: `4px solid ${TAG_C[d.tag]}` }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.title}</div>
            <div style={{ fontSize: 12.5, color: C.soft, marginTop: 2 }}>{d.detail}</div>
          </div>
        </div>
      ))}

      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "14px 16px", fontSize: 12.5, color: C.soft, marginTop: 8 }}>
        <b style={{ color: C.ink }}>The closed loop:</b> check Today's readiness each morning, set it here, and run the session the plan gives you. Re-test in the Engine tab every 6–8 weeks and your paces — and this whole plan — recalibrate to the new you.
      </div>
    </div>
  );
}

/* ============================ INSIGHTS (DNA · mix · curve · monotony) ============================ */
/* ============================ CONSISTENCY HEATMAP + RACE YOUR PAST SELF ============================ */
function Heatmap({ sessions }) {
  const dayMap = {};
  (sessions || []).forEach((s) => { if (!dayMap[s.date]) dayMap[s.date] = { c: 0, m: 0 }; dayMap[s.date].c++; dayMap[s.date].m += (+s.minutes || 0); });
  const WEEKS = 18;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const cols = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today); date.setDate(today.getDate() - dow - w * 7 + d);
      const key = date.toISOString().slice(0, 10);
      days.push({ key, info: dayMap[key], future: date > today, date });
    }
    cols.push(days);
  }
  const [sel, setSel] = useState(null);
  const shade = (info) => !info ? "#E7E1D1" : info.m < 20 ? "#cfe3c8" : info.m < 45 ? "#9fcfa8" : info.m < 75 ? "#5fae78" : C.green;
  const active = Object.keys(dayMap).length;
  const dset = new Set(Object.keys(dayMap));
  let streak = 0; const dd = new Date(today);
  if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1);
  while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".08em" }}>{WEEKS} WEEKS · {active} ACTIVE DAYS</span>
        <span style={{ ...mono, fontSize: 11, color: C.deep }}>🔥 {streak}d streak</span>
      </div>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3, flex: "none" }}>
            {col.map((day) => (
              <button key={day.key} onClick={() => !day.future && setSel(day)} disabled={day.future}
                style={{ width: 13, height: 13, borderRadius: 3, border: sel && sel.key === day.key ? `1.5px solid ${C.ink}` : "none", background: day.future ? "transparent" : shade(day.info), cursor: day.future ? "default" : "pointer", padding: 0 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, ...mono, fontSize: 10, color: C.soft, marginTop: 10 }}>
        less {["#E7E1D1", "#cfe3c8", "#9fcfa8", "#5fae78", C.green].map((c, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c, display: "inline-block" }} />)} more
      </div>
      <div style={{ marginTop: 12, minHeight: 22, fontSize: 13, color: C.soft }}>
        {sel ? (sel.info ? <span><b style={{ color: C.ink }}>{sel.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b> — {sel.info.c} session{sel.info.c > 1 ? "s" : ""}, {sel.info.m} min</span> : <span><b style={{ color: C.ink }}>{sel.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b> — rest day</span>) : <span style={{ ...mono, fontSize: 11.5 }}>tap any square to see that day</span>}
      </div>
    </Card>
  );
}

const GR_REF = { "5K": 1335, "10K": 2770, "Half": 6150 };
function GhostRace() {
  const [dist, setDist] = useState("Half");
  const [past, setPast] = useState("nov");
  const pastVO2 = past === "nov" ? 37.7 : 42.8, pastLabel = past === "nov" ? "Nov" : "Apr";
  const tNow = GR_REF[dist], tPast = Math.round(GR_REF[dist] * (48.9 / pastVO2));
  const Tf = 4.2, Ts = Tf * (tPast / tNow);
  const [t, setT] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => { setT(0); cancelAnimationFrame(rafRef.current); }, [dist, past]);
  const race = () => {
    cancelAnimationFrame(rafRef.current); const s = performance.now();
    const tick = (now) => { const el = (now - s) / 1000; if (el < Ts) { setT(el); rafRef.current = requestAnimationFrame(tick); } else setT(Ts); };
    rafRef.current = requestAnimationFrame(tick);
  };
  const pNow = Math.min(1, t / Tf), pPast = Math.min(1, t / Ts);
  const finished = t >= Ts;
  const gap = tPast - tNow;
  const Lane = ({ p, label, vo2, col, done }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: C.soft, marginBottom: 4 }}><span style={{ color: col, fontWeight: 700 }}>{label} · VO₂ {vo2}</span>{done && <span style={{ color: col }}>finished</span>}</div>
      <div style={{ position: "relative", height: 30, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8 }}>
        <div style={{ position: "absolute", right: 6, top: 0, bottom: 0, width: 2, background: C.line }} />
        <div style={{ position: "absolute", top: 2, left: `calc(${(p * 88).toFixed(1)}% + 2px)`, fontSize: 20, transition: "left .05s linear" }}>🏃</div>
      </div>
    </div>
  );
  return (
    <Card style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: ".1em", color: C.soft, marginBottom: 10 }}>🏁 RACE YOUR PAST SELF</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["5K", "10K", "Half"].map((d) => (<button key={d} onClick={() => setDist(d)} style={{ ...mono, fontSize: 12, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${dist === d ? C.accent : C.line}`, background: dist === d ? C.accent : "transparent", color: dist === d ? "#fff" : C.soft }}>{d}</button>))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["nov", "vs Nov"], ["apr", "vs Apr"]].map(([k, l]) => (<button key={k} onClick={() => setPast(k)} style={{ ...mono, fontSize: 12, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${past === k ? C.deep : C.line}`, background: past === k ? C.deep : "transparent", color: past === k ? "#fff" : C.soft }}>{l}</button>))}
        </span>
      </div>
      <Lane p={pNow} label="You now" vo2="48.9" col={C.green} done={pNow >= 1} />
      <Lane p={pPast} label={`You in ${pastLabel}`} vo2={pastVO2} col={C.soft} done={pPast >= 1} />
      <div style={{ textAlign: "center", marginTop: 6 }}>
        {finished && t > 0 ? (
          <div style={{ animation: "popIn .5s" }}>
            <div style={{ ...serif, fontSize: 20, fontWeight: 800, color: C.green }}>You'd win by {fmtTime(gap)} 🎉</div>
            <div style={{ ...mono, fontSize: 12, color: C.soft, marginTop: 3 }}>now {fmtTime(tNow)} · {pastLabel} {fmtTime(tPast)}</div>
          </div>
        ) : (
          <button onClick={race} style={{ ...mono, fontSize: 14, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 999, padding: "11px 26px", cursor: "pointer" }}>{t > 0 ? "Racing…" : "▶ Race!"}</button>
        )}
      </div>
      <div style={{ ...mono, fontSize: 10, color: C.soft, textAlign: "center", marginTop: 10 }}>estimated from your VO₂ max rise — proof your engine is growing</div>
    </Card>
  );
}

/* ============================ TAPPABLE ATHLETE DNA ============================ */
const DNA_DETAIL = {
  "Aerobic engine": { v: 88, what: "The size of your engine — how much effort you can sustain on oxygen alone.", drives: "VO₂ max 48.9 (up from 38 in six months), resting HR 46, and a deep base of easy miles.", up: "Already elite-leaning. Hold it with steady easy volume and a weekly threshold touch.", col: C.green },
  "Top-end speed": { v: 45, what: "Your raw high gear — neuromuscular power and turnover at VO₂ pace.", drives: "Almost no strides, sprints or VO₂ intervals appear in your log — untrained, not absent.", up: "Your single biggest upside. Add the VO₂ 5×3′ session (Guided tab) and 4–6 strides twice a week.", col: C.accent },
  "Endurance": { v: 90, what: "How long you hold pace before the wheels come off.", drives: "Regular 17–19 km long runs and a durable aerobic base.", up: "Extend the long run gradually toward 24–28 km as the marathon block opens.", col: C.green },
  "Recovery": { v: 60, what: "How fast you bounce back between hard days.", drives: "Fragmented 5–7.5 h sleep is the main limiter; HRV dips when strain stacks up.", up: "Sleep is the biggest lever you have — protect 7.5 h+ and take genuine rest days.", col: C.amber },
  "Consistency": { v: 92, what: "Showing up, week after week.", drives: "80 sessions in 59 days — you rarely leave a gap.", up: "Outstanding. The only risk is monotony, so build in real easy/rest contrast.", col: C.green },
  "Versatility": { v: 95, what: "Breadth across disciplines.", drives: "Seven sports: running, climbing, cycling, skating, strength, walking, HIIT.", up: "Your durability superpower — keep cross-training; it's why you stay healthy.", col: C.blue },
};
function DnaCard() {
  const [sel, setSel] = useState("Top-end speed");
  const d = DNA_DETAIL[sel];
  return (
    <>
      <Card style={{ padding: "10px 6px" }}>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={DNA} outerRadius="70%">
            <defs>
              <radialGradient id="dnaFill" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.accent} stopOpacity={0.5} /><stop offset="100%" stopColor={C.amber} stopOpacity={0.12} /></radialGradient>
              <filter id="dnaGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={C.accent} floodOpacity="0.4" /></filter>
            </defs>
            <PolarGrid stroke={C.line} />
            <PolarAngleAxis dataKey="k" tick={{ ...mono, fontSize: 10.5, fill: C.ink }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="v" stroke={C.accent} fill="url(#dnaFill)" fillOpacity={1} strokeWidth={2} filter="url(#dnaGlow)" />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
        {DNA.map((row) => { const det = DNA_DETAIL[row.k]; const on = sel === row.k; return (
          <button key={row.k} onClick={() => setSel(row.k)} style={{ ...mono, fontSize: 11.5, padding: "7px 11px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${on ? det.col : C.line}`, background: on ? det.col : "transparent", color: on ? "#fff" : C.soft, display: "flex", alignItems: "center", gap: 6 }}>{row.k}<span style={{ fontWeight: 700, opacity: 0.9 }}>{det.v}</span></button>
        ); })}
      </div>
      <Card key={sel} style={{ padding: 16, borderLeft: `4px solid ${d.col}`, animation: "fadeUp .35s both" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ ...serif, fontSize: 19, fontWeight: 700 }}>{sel}</span>
          <span style={{ ...serif, fontSize: 30, fontWeight: 800, color: d.col }}>{d.v}<span style={{ fontSize: 13, color: C.soft }}>/100</span></span>
        </div>
        <p style={{ fontSize: 13.5, color: C.ink, margin: "0 0 10px", lineHeight: 1.5 }}>{d.what}</p>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px" }}><span style={{ ...mono, fontSize: 10, letterSpacing: ".1em", color: C.soft }}>WHAT DRIVES IT</span><div style={{ fontSize: 13, color: C.soft, marginTop: 3 }}>{d.drives}</div></div>
          <div style={{ background: `${d.col}12`, border: `1px solid ${d.col}55`, borderRadius: 10, padding: "9px 12px" }}><span style={{ ...mono, fontSize: 10, letterSpacing: ".1em", color: d.col }}>HOW TO LEVEL IT UP</span><div style={{ fontSize: 13, color: C.ink, marginTop: 3 }}>{d.up}</div></div>
        </div>
      </Card>
    </>
  );
}

/* ============================ BEST TIME TO RUN — live weather window ============================ */
function WeatherWindow() {
  const [status, setStatus] = useState("loading");
  const [hours, setHours] = useState([]);
  const [date, setDate] = useState("");
  const load = async () => {
    setStatus("loading");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1500,
          system: "You are a weather data service. Use web search to get TODAY'S real hourly forecast for London, UK. Respond with ONLY valid JSON, no markdown fences, no prose. Shape: {\"date\":\"YYYY-MM-DD\",\"hours\":[{\"h\":\"06:00\",\"temp\":12,\"precip\":10,\"wind\":14,\"cond\":\"Cloudy\"}]}. Provide hourly entries from 05:00 to 21:00. temp in °C integer, precip = % chance of rain integer, wind in km/h integer, cond = short text like Clear/Cloudy/Light rain.",
          messages: [{ role: "user", content: "Today's hourly weather for London, UK." }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const a = text.indexOf("{"), b = text.lastIndexOf("}");
      const obj = JSON.parse(text.slice(a, b + 1));
      const hrs = (obj.hours || []).filter((h) => h && h.h);
      setHours(hrs); setDate(obj.date || todayKey()); setStatus(hrs.length ? "done" : "error");
    } catch (e) { setStatus("error"); }
  };
  useEffect(() => { load(); }, []);
  const score = (h) => { let s = 100; const t = +h.temp; if (t > 14) s -= (t - 14) * 4; if (t < 4) s -= (4 - t) * 3; s -= (+h.precip || 0) * 0.8; const w = +h.wind || 0; if (w > 20) s -= (w - 20) * 1.2; return Math.max(0, Math.min(100, Math.round(s))); };
  const scored = hours.map((h) => ({ ...h, s: score(h) }));
  const best = scored.reduce((a, b) => (b.s > (a ? a.s : -1) ? b : a), null);
  const emoji = (c) => { c = (c || "").toLowerCase(); if (c.includes("thunder")) return "⛈"; if (c.includes("rain") || c.includes("shower") || c.includes("drizzle")) return "🌧"; if (c.includes("snow")) return "❄️"; if (c.includes("fog") || c.includes("mist")) return "🌫"; if (c.includes("part")) return "🌤"; if (c.includes("cloud") || c.includes("overcast")) return "☁️"; if (c.includes("clear") || c.includes("sun")) return "☀️"; return "🌤"; };
  const col = (s) => s >= 75 ? C.green : s >= 50 ? C.amber : C.accent;
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: ".08em", color: C.soft }}>LONDON{date ? " · " + date : ""}</span>
        <button onClick={load} disabled={status === "loading"} style={{ ...mono, fontSize: 11, color: C.deep, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 11px", cursor: "pointer" }}>{status === "loading" ? "…" : "↻ refresh"}</button>
      </div>
      {status === "loading" && <Dots label="reading the sky" />}
      {status === "error" && (
        <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.55 }}>
          Couldn't reach live weather just now. As a rule for late-May London: <b style={{ color: C.ink }}>early mornings (6–8 am)</b> are usually coolest and calmest — ideal for quality threshold/VO₂ work — while warm afternoons suit easy runs. <button onClick={load} style={{ ...mono, fontSize: 12, color: C.deep, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>try again</button>
        </div>
      )}
      {status === "done" && best && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${col(best.s)}14`, border: `1px solid ${col(best.s)}55`, borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 34 }}>{emoji(best.cond)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: ".1em", color: col(best.s) }}>BEST WINDOW TO RUN</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{best.h} · {best.temp}°C</div>
              <div style={{ fontSize: 12.5, color: C.soft, marginTop: 2 }}>{best.cond} · {best.precip}% rain · {best.wind} km/h wind</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6 }}>
            {scored.map((h, i) => (
              <div key={i} style={{ flex: "none", width: 46, textAlign: "center", padding: "6px 0", borderRadius: 10, background: best && h.h === best.h ? `${col(h.s)}18` : "transparent", border: best && h.h === best.h ? `1px solid ${col(h.s)}55` : "1px solid transparent" }}>
                <div style={{ ...mono, fontSize: 9.5, color: C.soft }}>{h.h.slice(0, 5)}</div>
                <div style={{ fontSize: 17, margin: "2px 0" }}>{emoji(h.cond)}</div>
                <div style={{ ...serif, fontSize: 14, fontWeight: 700 }}>{h.temp}°</div>
                <div style={{ height: 4, borderRadius: 9, background: col(h.s), margin: "5px 7px 0", opacity: 0.35 + (h.s / 100) * 0.65 }} />
              </div>
            ))}
          </div>
          <div style={{ ...mono, fontSize: 10, color: C.soft, marginTop: 8 }}>greener bar = better running conditions (cool, dry, calm)</div>
        </>
      )}
    </Card>
  );
}

/* ============================ MOOD & ENERGY CHECK-IN ============================ */
const MOOD_EMOJI = ["😞", "😕", "😐", "🙂", "😄"];
function MoodJournal() {
  const key = todayKey();
  const [log, setLog] = useState({});
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { store.get("mood-log").then((d) => { const m = d || {}; setLog(m); if (m[key]) { setMood(m[key].mood ?? null); setEnergy(m[key].energy ?? null); setNote(m[key].note || ""); } }); }, []);
  const save = () => { if (mood == null && energy == null) return; const next = { ...log, [key]: { mood, energy, note } }; setLog(next); store.set("mood-log", next); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const recent = Object.keys(log).sort().slice(-10).map((d) => ({ d, ...log[d] }));
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: ".08em", color: C.soft, marginBottom: 4 }}>HOW ARE YOU FEELING TODAY?</div>
      <div style={{ fontSize: 12, color: C.soft, marginBottom: 14 }}>A 10-second check-in — no streaks, no pressure, just noticing.</div>
      <div style={{ ...mono, fontSize: 10.5, color: C.soft, marginBottom: 7 }}>MOOD</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {MOOD_EMOJI.map((e, i) => (
          <button key={i} onClick={() => setMood(i + 1)} style={{ flex: 1, fontSize: 26, padding: "8px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${mood === i + 1 ? C.accent : C.line}`, background: mood === i + 1 ? `${C.accent}12` : "transparent", transform: mood === i + 1 ? "scale(1.08)" : "scale(1)", transition: "transform .15s, background .15s" }}>{e}</button>
        ))}
      </div>
      <div style={{ ...mono, fontSize: 10.5, color: C.soft, marginBottom: 7 }}>ENERGY</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setEnergy(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${energy != null && n <= energy ? C.amber : C.line}`, background: energy != null && n <= energy ? `${C.amber}1a` : "transparent", color: energy != null && n <= energy ? C.amber : C.soft, display: "grid", placeItems: "center" }}><Zap size={17} fill={energy != null && n <= energy ? C.amber : "none"} /></button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="A word on today (optional)…" style={{ width: "100%", padding: "10px 12px", borderRadius: 11, border: `1px solid ${C.line}`, background: C.paper, fontSize: 13.5, outline: "none", marginBottom: 12 }} />
      <button onClick={save} style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", color: "#fff", background: saved ? C.green : C.ink, ...mono, fontSize: 13, fontWeight: 600, transition: "background .2s" }}>{saved ? "Saved ✓" : "Save check-in"}</button>
      {recent.length > 0 && (
        <>
          <div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em", margin: "16px 0 8px" }}>RECENT</div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
            {recent.map((r) => (
              <div key={r.d} style={{ flex: "none", textAlign: "center", minWidth: 40 }}>
                <div style={{ fontSize: 19 }}>{r.mood ? MOOD_EMOJI[r.mood - 1] : "·"}</div>
                <div style={{ height: 22, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1, margin: "3px 0" }}>{[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ width: 3, height: 4 + n * 3, borderRadius: 2, background: r.energy != null && n <= r.energy ? C.amber : C.line }} />)}</div>
                <div style={{ ...mono, fontSize: 8.5, color: C.soft }}>{r.d.slice(8, 10)}/{r.d.slice(5, 7)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/* ============================ PERSONAL RECORDS BOARD ============================ */
const PR_DEFS = [{ k: "1 mile", m: 1609 }, { k: "5K", m: 5000 }, { k: "10K", m: 10000 }, { k: "Half", m: 21097.5 }, { k: "Marathon", m: 42195 }];
const prPredicted = (m) => Math.round(riegel(46 * 60 + 10, 10000, m));
const prRealCount = (prs) => (prs ? Object.values(prs).filter((e) => e && e.real).length : 0);
const parsePR = (s) => { const p = String(s).trim().split(":").map((x) => Number(x)); if (p.some((x) => isNaN(x)) || p.length < 2 || p.length > 3) return null; const sec = p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2]; return sec > 0 ? Math.round(sec) : null; };
function PRBoard() {
  const [prs, setPrs] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [edit, setEdit] = useState(null);
  const [tStr, setTStr] = useState(""); const [dStr, setDStr] = useState("");
  const [fire, setFire] = useState(0); const [toast, setToast] = useState("");
  useEffect(() => { store.get("prs").then((d) => { setPrs(d || {}); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) store.set("prs", prs); }, [prs, loaded]);
  const open = (k) => { setEdit(k); const e = prs[k]; setTStr(e && e.real ? fmtTime(e.secReal) : ""); setDStr(e && e.date ? e.date : todayKey()); };
  const save = (k) => { const sec = parsePR(tStr); if (!sec) { setToast("Enter time as mm:ss or h:mm:ss"); setTimeout(() => setToast(""), 2200); return; } const prev = prs[k]; const improved = !prev || !prev.real || sec < prev.secReal; setPrs((p) => ({ ...p, [k]: { secReal: sec, date: dStr || todayKey(), real: true } })); setEdit(null); setTStr(""); if (improved) { setFire((f) => f + 1); setToast(`New ${k} PR — ${fmtTime(sec)}! 🎉`); setTimeout(() => setToast(""), 3000); } };
  return (
    <div>
      <Confetti fire={fire} />
      {toast && <div style={{ position: "fixed", left: "50%", bottom: 92, transform: "translateX(-50%)", zIndex: 70, background: C.ink, color: C.paper, ...mono, fontSize: 13, padding: "10px 18px", borderRadius: 999, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", animation: "dropIn .4s both" }}>{toast}</div>}
      <div style={{ display: "grid", gap: 11, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {PR_DEFS.map(({ k, m }) => {
          const e = prs[k]; const real = e && e.real; const sec = real ? e.secReal : prPredicted(m);
          return (
            <Card key={k} style={{ padding: 15, borderTop: `4px solid ${real ? C.amber : C.line}`, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {real ? <Trophy size={15} color={C.amber} /> : <Medal size={15} color={C.soft} />}
                <span style={{ ...mono, fontSize: 11, letterSpacing: ".06em", color: C.soft }}>{k}</span>
              </div>
              <div style={{ ...serif, fontSize: 27, fontWeight: 800, margin: "7px 0 2px", color: real ? C.ink : C.soft }}>{fmtTime(sec)}</div>
              <div style={{ fontSize: 11, color: C.soft, fontStyle: real ? "normal" : "italic" }}>{real ? e.date : "predicted"}</div>
              {edit === k ? (
                <div style={{ marginTop: 10 }}>
                  <input value={tStr} onChange={(ev) => setTStr(ev.target.value)} placeholder={m > 15000 ? "1:42:30" : "mm:ss"} style={{ width: "100%", ...mono, padding: "7px 9px", borderRadius: 9, border: `1px solid ${C.line}`, background: C.paper, fontSize: 13, outline: "none", marginBottom: 6 }} />
                  <input type="date" value={dStr} onChange={(ev) => setDStr(ev.target.value)} style={{ width: "100%", ...mono, padding: "6px 9px", borderRadius: 9, border: `1px solid ${C.line}`, background: C.paper, fontSize: 12, outline: "none", marginBottom: 7 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => save(k)} style={{ flex: 1, border: "none", borderRadius: 9, padding: "8px", cursor: "pointer", color: "#fff", background: C.green, ...mono, fontSize: 12, fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEdit(null)} style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 11px", cursor: "pointer", color: C.soft, background: "transparent", ...mono, fontSize: 12 }}>✕</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => open(k)} style={{ marginTop: 10, width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "7px", cursor: "pointer", color: C.deep, background: "transparent", ...mono, fontSize: 12, fontWeight: 600 }}>{real ? "Update" : "Log a time"}</button>
              )}
            </Card>
          );
        })}
      </div>
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 12 }}>
        <b style={{ color: C.ink }}>Predicted</b> times come from your VDOT until you log a real one. Beat a record and the board celebrates — your trophy case fills as you race.
      </div>
    </div>
  );
}

function Insights() {
  const [sessions, setSessions] = useState([]);
  useEffect(() => { store.get("sport-log").then((d) => setSessions(Array.isArray(d) ? d : [])); }, []);
  const T1 = 46 * 60 + 10, D1 = 10000;
  const curve = [1.5, 3, 5, 8, 10, 15, 21.0975, 30, 42.195].map((km) => {
    const t = riegel(T1, D1, km * 1000);
    return { km, min: +(t / 60).toFixed(1), label: km === 21.0975 ? "21.1" : String(km) };
  });
  // Foster monotony & strain on last 7 days
  const w = DAILY_LOAD.slice(-7);
  const mean = w.reduce((a, b) => a + b, 0) / w.length;
  const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / w.length);
  const monotony = +(mean / sd).toFixed(2);
  const strain = Math.round(w.reduce((a, b) => a + b, 0) * monotony);
  const monStatus = monotony > 2 ? { t: "slightly high", c: C.amber } : { t: "healthy", c: C.green };

  return (
    <div>
      <SectionTitle n="01">Your athlete DNA</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 8 }}>Six dimensions scored from your data. <b style={{ color: C.deep }}>Tap any dimension</b> to see what drives it — and exactly how to level it up.</p>
      <DnaCard />

      <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>Multi-sport signature</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 8 }}>80 workouts in 59 days across 7 disciplines — rare athletic breadth. Running leads, but climbing is a near-equal pillar.</p>
      <Card style={{ padding: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <ResponsiveContainer width={170} height={170}>
          <PieChart>
            <defs><filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#17150F" floodOpacity="0.18" /></filter></defs>
            <Pie data={ACTIVITY_MIX} dataKey="v" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2} stroke="none" cornerRadius={4} filter="url(#pieGlow)">
              {ACTIVITY_MIX.map((e, i) => <Cell key={i} fill={e.c} />)}
            </Pie>
            <Tooltip contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, minWidth: 150 }}>
          {ACTIVITY_MIX.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: a.c, flex: "none" }} />
              <span style={{ fontSize: 13, flex: 1 }}>{a.name}</span>
              <span style={{ ...mono, fontSize: 12, color: C.soft }}>{a.v}×</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Performance curve</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 8 }}>Your predicted time at every distance from 1500 m to the marathon — one continuous fitness signature, not isolated guesses.</p>
      <Card style={{ padding: "14px 8px 6px" }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={curve}>
            <defs>
              <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.deep} /><stop offset="100%" stopColor={C.accent} /></linearGradient>
              <filter id="curveGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.accent} floodOpacity="0.4" /></filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis dataKey="label" tick={{ ...mono, fontSize: 9, fill: C.soft }} label={{ value: "km", position: "insideBottomRight", offset: -2, ...mono, fontSize: 10, fill: C.soft }} />
            <YAxis tick={{ ...mono, fontSize: 9, fill: C.soft }} width={32} label={{ value: "min", angle: -90, position: "insideLeft", ...mono, fontSize: 10, fill: C.soft }} />
            <Tooltip formatter={(v) => [`${fmtTime(v * 60)}`, "time"]} contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
            <Line type="monotone" dataKey="min" stroke="url(#curveStroke)" strokeWidth={3} dot={{ r: 3, fill: C.accent }} filter="url(#curveGlow)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <SectionTitle n="04"><span style={{ marginTop: 18, display: "inline-block" }}>Training monotony &amp; strain</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 8 }}>Foster's overtraining metrics. <b>Monotony</b> = how same-y your days are; <b>strain</b> = total load × monotony. Variety protects you.</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <Stat k="Monotony (7d)" v={monotony} n={monStatus.t} color={monStatus.c} />
        <Stat k="Strain (7d)" v={strain.toLocaleString()} n="elevated this week" color={C.accent} />
      </div>
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 12 }}>
        <b style={{ color: C.ink }}>Read:</b> you rarely take a true down-day — every day carries real load. Adding genuine easy/rest contrast lowers your monotony and, with it, injury and overtraining risk. It's the same lesson your recent recovery dip taught, quantified.
      </div>

      <SectionTitle n="05"><span style={{ marginTop: 18, display: "inline-block" }}>Consistency calendar</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>Every square is a day; the greener it is, the more you moved. Your rhythm at a glance — tap any day to see what you did.</p>
      <Heatmap sessions={sessions} />

      <SectionTitle n="06"><span style={{ marginTop: 18, display: "inline-block" }}>This week's report</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>An automatic recap of your last seven days — what went well, what to watch, and where to point next week.</p>
      <WeeklyReport sessions={sessions} />
    </div>
  );
}

/* ============================ LAB (tests · simulator · sleep) ============================ */
function Lab() {
  const TESTS = [
    { name: "5K Time Trial", give: "True VDOT & every pace", proto: "10 min easy w/up + 3 strides → 5 km all-out on a flat route/track when fresh → cool down. Type the time into the Engine tab.", feeds: "→ Engine" },
    { name: "30-min Threshold Test", give: "Lactate-threshold HR (LTHR)", proto: "Solo, run hard and even for 30 min. Your average HR over the final 20 min ≈ LTHR — anchor your Z4 to it.", feeds: "→ Zones" },
    { name: "Cooper 12-min Test", give: "Field VO₂ max estimate", proto: "Run as far as possible in 12 min. VO₂max ≈ (metres − 504.9) ÷ 44.73. Re-run quarterly.", feeds: "→ Engine" },
    { name: "Aerobic (MAF) Check", give: "Aerobic-efficiency drift", proto: "Run 5 km at a fixed easy HR (~180 − age). Re-test monthly; faster at the same HR = real aerobic gains.", feeds: "→ Trends" },
    { name: "Morning HRV Baseline", give: "Daily readiness anchor", proto: "Measure HRV + resting HR on waking, same conditions each day. A rolling baseline sharpens the Today score.", feeds: "→ Today" },
  ];

  // What-if projection
  const [qs, setQs] = useState(2), [wks, setWks] = useState(8);
  const baseV = 47, baseHalf = 6120;
  const delta = Math.min(5, qs * wks * 0.06);
  const newV = baseV + delta;
  const newHalf = baseHalf * Math.pow(baseV / newV, 0.9);
  const saved = baseHalf - newHalf;

  // Sleep
  const inBed = SLEEP_ARCH.reduce((a, b) => a + b.h, 0);
  const asleep = inBed - SLEEP_ARCH.find((s) => s.name === "Awake").h;
  const eff = Math.round((asleep / inBed) * 100);
  const sleepScore = Math.round(Math.min(100, (asleep / 8) * 55 + eff * 0.3 + 12));

  return (
    <div>
      <SectionTitle n="01">Test centre</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Self-tests that turn estimates into truth. Each one feeds a different part of STRIDE — run them, log them, watch the whole system sharpen.</p>
      {TESTS.map((t) => (
        <Card key={t.name} style={{ padding: 15, marginBottom: 10, borderLeft: `4px solid ${C.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <div style={{ ...serif, fontSize: 17, fontWeight: 600 }}>{t.name}</div>
            <div style={{ ...mono, fontSize: 11, color: C.deep, fontWeight: 600 }}>{t.feeds}</div>
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.amber, marginTop: 2, marginBottom: 6 }}>GIVES: {t.give}</div>
          <p style={{ fontSize: 13, color: C.soft, margin: 0 }}>{t.proto}</p>
        </Card>
      ))}

      <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>What-if simulator</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>The pioneer feature: project forward. Add the missing quality work and watch your potential half-marathon time respond. (Model estimate — your real curve is steeper because you're starting from zero speed work.)</p>
      <Card style={{ padding: 18 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 12, color: C.soft, marginBottom: 6 }}><span>QUALITY SESSIONS / WEEK</span><b style={{ color: C.ink }}>{qs}</b></div>
          <input type="range" min={0} max={3} value={qs} onChange={(e) => setQs(+e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 12, color: C.soft, marginBottom: 6 }}><span>WEEKS OF CONSISTENT WORK</span><b style={{ color: C.ink }}>{wks}</b></div>
          <input type="range" min={4} max={16} value={wks} onChange={(e) => setWks(+e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120, textAlign: "center", padding: 14, background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
            <div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".1em" }}>PROJECTED VDOT</div>
            <div style={{ ...serif, fontSize: 34, fontWeight: 700, color: C.green }}>{newV.toFixed(1)}</div>
            <div style={{ ...mono, fontSize: 11, color: C.soft }}>from 47.0</div>
          </div>
          <div style={{ flex: 1, minWidth: 120, textAlign: "center", padding: 14, background: C.ink, borderRadius: 12 }}>
            <div style={{ ...mono, fontSize: 10, color: "#d9c7bf", letterSpacing: ".1em" }}>PROJECTED HALF</div>
            <div style={{ ...serif, fontSize: 34, fontWeight: 700, color: "#fff" }}>{fmtTime(newHalf)}</div>
            <div style={{ ...mono, fontSize: 11, color: "#ffb59f" }}>−{fmtTime(saved)} faster</div>
          </div>
        </div>
      </Card>

      <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Sleep architecture</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>Your average night, by stage — the engine room of recovery. Duration and consistency are your gains here.</p>
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", height: 30, borderRadius: 9, overflow: "hidden", border: `1px solid ${C.line}`, marginBottom: 10 }}>
          {SLEEP_ARCH.map((s) => (
            <div key={s.name} style={{ width: `${(s.h / inBed) * 100}%`, background: s.c, color: "#fff", ...mono, fontSize: 9.5, display: "grid", placeItems: "center", animation: "grow 1.2s cubic-bezier(.2,.7,.2,1) both" }}>{s.name}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div><span style={{ ...mono, fontSize: 11, color: C.soft }}>ASLEEP</span><div style={{ ...serif, fontSize: 22, fontWeight: 600 }}>{asleep.toFixed(1)} h</div></div>
          <div><span style={{ ...mono, fontSize: 11, color: C.soft }}>EFFICIENCY</span><div style={{ ...serif, fontSize: 22, fontWeight: 600 }}>{eff}%</div></div>
          <div><span style={{ ...mono, fontSize: 11, color: C.soft }}>DEEP+REM</span><div style={{ ...serif, fontSize: 22, fontWeight: 600 }}>{(SLEEP_ARCH[0].h + SLEEP_ARCH[1].h).toFixed(1)} h</div></div>
          <div><span style={{ ...mono, fontSize: 11, color: C.soft }}>SLEEP SCORE</span><div style={{ ...serif, fontSize: 22, fontWeight: 600, color: sleepScore >= 80 ? C.green : C.amber }}>{sleepScore}</div></div>
        </div>
        <p style={{ fontSize: 12.5, color: C.soft, marginTop: 12, marginBottom: 0 }}>Stage balance is good when you sleep — it's the <b style={{ color: C.deep }}>hours and consistency</b> that cap recovery. Pushing asleep-time toward 7.5 h is your single biggest physiological upgrade.</p>
      </Card>
    </div>
  );
}

/* ============================ FUEL LOG (adequacy-focused, persistent) ============================ */
const FUEL_CHECKS = [
  ["preFuel", "Fuelled before training"],
  ["carbs", "Carbs around the hard / long session"],
  ["protein", "Protein at each main meal"],
  ["hydrate", "Hydrated steadily through the day"],
  ["iron", "An iron-rich food today (greens, red meat, legumes)"],
  ["recovery", "Recovery meal/snack after a key session"],
];
function FuelLog() {
  const key = `fuel-${todayKey()}`;
  const [rec, setRec] = useState({ checks: {}, rating: 0, meals: [] });
  const [meal, setMeal] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { store.get(key).then((d) => { if (d) setRec(d); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) store.set(key, rec); }, [rec, loaded]);
  const toggle = (k) => setRec((r) => ({ ...r, checks: { ...r.checks, [k]: !r.checks[k] } }));
  const addMeal = () => { if (meal.trim()) { setRec((r) => ({ ...r, meals: [...r.meals, meal.trim()] })); setMeal(""); } };
  const delMeal = (i) => setRec((r) => ({ ...r, meals: r.meals.filter((_, j) => j !== i) }));
  const done = FUEL_CHECKS.filter((c) => rec.checks[c[0]]).length;

  return (
    <div>
      <SectionTitle n="01">Today's fuelling</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>This isn't calorie counting — it's making sure you're <b style={{ color: C.deep }}>eating enough to match the work</b>, which the dossier flagged as your quiet limiter. Fuel the runner, and recovery, hormones and iron all follow.</p>

      <Card style={{ padding: 18, marginBottom: 14, borderLeft: `4px solid ${done >= 5 ? C.green : C.amber}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".1em" }}>FUELLING ADEQUACY</div>
          <div style={{ ...serif, fontSize: 28, fontWeight: 700, color: done >= 5 ? C.green : C.amber }}>{done}/6</div>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: C.line, overflow: "hidden", margin: "8px 0 14px" }}>
          <div style={{ width: `${(done / 6) * 100}%`, height: "100%", background: done >= 5 ? C.green : C.amber, transition: "width .3s", animation: "grow 1.1s cubic-bezier(.2,.7,.2,1) both" }} />
        </div>
        {FUEL_CHECKS.map(([k, label]) => {
          const on = !!rec.checks[k];
          return (
            <button key={k} onClick={() => toggle(k)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "9px 0", cursor: "pointer", borderBottom: `1px dashed ${C.line}` }}>
              <span style={{ width: 24, height: 24, flex: "none", borderRadius: 7, border: `2px solid ${on ? C.green : C.line}`, background: on ? C.green : "transparent", display: "grid", placeItems: "center" }}>
                {on && <Check size={15} color="#fff" />}
              </span>
              <span style={{ fontSize: 14, color: on ? C.ink : C.soft, textDecoration: on ? "none" : "none", fontWeight: on ? 600 : 400 }}>{label}</span>
            </button>
          );
        })}
      </Card>

      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".1em", marginBottom: 10 }}>HOW WELL-FUELLED DID YOU FEEL?</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRec((r) => ({ ...r, rating: n }))} style={{ flex: 1, padding: "12px 0", borderRadius: 11, cursor: "pointer", ...serif, fontSize: 20, fontWeight: 600,
              border: `1.5px solid ${rec.rating >= n ? C.accent : C.line}`, background: rec.rating >= n ? C.accent : "transparent", color: rec.rating >= n ? "#fff" : C.soft }}>{n}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 10, color: C.soft, marginTop: 6 }}><span>running on empty</span><span>fully fuelled</span></div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".1em", marginBottom: 10 }}>MEALS & SNACKS TODAY</div>
        {rec.meals.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px dashed ${C.line}` }}>
            <span style={{ fontSize: 14, flex: 1 }}>{m}</span>
            <button onClick={() => delMeal(i)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft }}><Trash2 size={15} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={meal} onChange={(e) => setMeal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMeal()} placeholder="e.g. porridge + banana + nuts"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 11, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
          <button onClick={addMeal} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 11, padding: "0 14px", cursor: "pointer", display: "grid", placeItems: "center" }}><Plus size={18} /></button>
        </div>
      </Card>

      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "14px 16px", fontSize: 12.5, color: C.soft }}>
        <b style={{ color: C.ink }}>Context, not a target:</b> your body burns roughly 2,000+ kcal on an ordinary day and up to ~3,000 on long-run days. The goal is simply to match that — consistently. For personalised guidance and an iron/ferritin check, a sports dietitian and your GP are the right call.
      </div>
    </div>
  );
}

/* ============================ MULTI-SPORT LOG (persistent) ============================ */
const SPORTS = ["Run", "Climb", "Cycle", "Skate", "Strength", "Swim", "Hyrox", "Other"];
const SPORT_C = { Run: "#E2441F", Climb: "#C98A12", Cycle: "#1E5F8C", Skate: "#7A5CC0", Strength: "#4A463C", Swim: "#2F7D52", Hyrox: "#B5330F", Other: "#8a857a" };
function SportLog() {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [f, setF] = useState({ sport: "Run", minutes: 45, rpe: 5, note: "" });
  useEffect(() => { store.get("sport-log").then((d) => { setSessions(d || []); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) store.set("sport-log", sessions); }, [sessions, loaded]);
  const add = () => { setSessions((s) => [{ id: Date.now(), date: todayKey(), ...f }, ...s]); };
  const del = (id) => setSessions((s) => s.filter((x) => x.id !== id));

  const last7 = sessions.filter((s) => (Date.now() - Date.parse(s.date)) / 86400000 < 7);
  const byS = {};
  last7.forEach((s) => { byS[s.sport] = byS[s.sport] || { c: 0, min: 0 }; byS[s.sport].c++; byS[s.sport].min += +s.minutes; });
  const summary = Object.entries(byS).sort((a, b) => b[1].min - a[1].min);

  const dset = new Set(sessions.map((s) => s.date));
  let streak = 0; const dd = new Date();
  if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1);
  while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  const total = sessions.length;
  const BADGES = [
    { n: "First Steps", got: total >= 1, d: "1 session", e: "👟" },
    { n: "Consistent", got: streak >= 3, d: "3-day streak", e: "✨" },
    { n: "On Fire", got: streak >= 7, d: "7-day streak", e: "🔥" },
    { n: "Locked In", got: streak >= 14, d: "14-day streak", e: "🎯" },
    { n: "Ten Strong", got: total >= 10, d: "10 sessions", e: "💪" },
    { n: "Quarter Ton", got: total >= 25, d: "25 sessions", e: "⚡" },
    { n: "Centurion", got: total >= 100, d: "100 sessions", e: "👑" },
  ];
  const earned = BADGES.filter((b) => b.got).length;

  return (
    <div>
      <SectionTitle n="01">Log a session</SectionTitle>
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {SPORTS.map((s) => (
            <button key={s} onClick={() => setF((p) => ({ ...p, sport: s }))} style={{ ...mono, fontSize: 12, padding: "7px 11px", borderRadius: 999, cursor: "pointer",
              border: `1.5px solid ${f.sport === s ? SPORT_C[s] : C.line}`, background: f.sport === s ? SPORT_C[s] : "transparent", color: f.sport === s ? "#fff" : C.soft }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 110 }}>
            <div style={{ ...mono, fontSize: 11, color: C.soft, marginBottom: 5 }}>MINUTES</div>
            <input type="number" value={f.minutes} onChange={(e) => setF((p) => ({ ...p, minutes: +e.target.value }))}
              style={{ ...mono, width: "100%", fontSize: 16, padding: "9px 11px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper }} />
          </div>
          <div style={{ flex: 2, minWidth: 150 }}>
            <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: C.soft, marginBottom: 5 }}><span>RPE (effort)</span><b style={{ color: C.ink }}>{f.rpe}/10</b></div>
            <input type="range" min={1} max={10} value={f.rpe} onChange={(e) => setF((p) => ({ ...p, rpe: +e.target.value }))} style={{ width: "100%", marginTop: 9 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="note (optional) — e.g. V5 project, easy Z2…"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 11, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
          <button onClick={add} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 11, padding: "0 16px", cursor: "pointer", ...mono, fontSize: 13, fontWeight: 600 }}>Add</button>
        </div>
      </Card>

      <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Streak &amp; badges</span></SectionTitle>
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 30 }}>🔥</span>
          <div style={{ flex: 1 }}><div style={{ ...serif, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{streak}<span style={{ fontSize: 13, color: C.soft }}> day{streak === 1 ? "" : "s"}</span></div><div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em" }}>CURRENT STREAK · {total} TOTAL · {earned}/{BADGES.length} BADGES</div></div>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))" }}>
          {BADGES.map((b) => (
            <div key={b.n} style={{ textAlign: "center", padding: "11px 6px", borderRadius: 12, border: `1px solid ${b.got ? C.accent : C.line}`, background: b.got ? "rgba(226,68,31,.07)" : "transparent", opacity: b.got ? 1 : 0.5 }}>
              <div style={{ fontSize: 22, filter: b.got ? "none" : "grayscale(1)" }}>{b.e}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 3, color: b.got ? C.ink : C.soft }}>{b.n}</div>
              <div style={{ ...mono, fontSize: 9, color: C.soft }}>{b.d}</div>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle n="03"><span style={{ marginTop: 4, display: "inline-block" }}>Last 7 days</span></SectionTitle>
      {summary.length === 0 ? (
        <EmptyState icon={Activity} title="Nothing logged yet" line="Log a session and your weekly sport mix takes shape here." />
      ) : (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          {summary.map(([sport, d]) => (
            <div key={sport} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: SPORT_C[sport], flex: "none" }} />
              <span style={{ fontSize: 13.5, flex: 1 }}>{sport}</span>
              <span style={{ ...mono, fontSize: 12, color: C.soft }}>{d.c}× · {d.min} min</span>
            </div>
          ))}
        </Card>
      )}

      <SectionTitle n="04"><span style={{ marginTop: 4, display: "inline-block" }}>History</span></SectionTitle>
      {sessions.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No sessions yet" line="Your logged sessions appear here and persist between visits." />
      ) : sessions.slice(0, 30).map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${SPORT_C[s.sport] || C.soft}`, borderRadius: 12, padding: "11px 14px", marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.sport} · {s.minutes} min <span style={{ ...mono, fontSize: 11, color: C.soft }}>RPE {s.rpe}</span></div>
            {s.note ? <div style={{ fontSize: 12.5, color: C.soft, marginTop: 1 }}>{s.note}</div> : null}
            <div style={{ ...mono, fontSize: 10.5, color: C.soft, marginTop: 2 }}>{s.date}</div>
          </div>
          <button onClick={() => del(s.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}

/* ============================ EVENTS (live search + trending) ============================ */
function Events() {
  const TREND_SEARCHES = [
    "Half marathons near London 2026", "Autumn marathons in Europe", "Trail races in Spain",
    "SuperHalfs series races", "Rome Half Marathon October 2026", "Scenic 10Ks in the UK",
  ];
  const TREND_SPORTS = [
    { n: "Hyrox", b: "Fitness racing — 8 functional stations + 8×1 km runs. Exploding worldwide." },
    { n: "Trail & Ultra", b: "Off-road distance racing; surging via the UTMB World Series." },
    { n: "Gravel cycling", b: "Road-meets-offroad endurance — the fastest-growing cycling discipline." },
    { n: "Swimrun", b: "Multisport: alternating open-water swims & trail runs (Ötillö origin)." },
    { n: "Backyard ultra", b: "Last-runner-standing format — a viral test of will." },
  ];
  const [q, setQ] = useState("");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (text) => {
    const query = (text ?? q).trim();
    if (!query || loading) return;
    setQ(query); setLoading(true); setRes("");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: "You are STRIDE's running-events finder for a London-based runner (it is 2026). Use web search to find REAL, upcoming endurance events matching the query. Return up to 6 events as a clean list. For each line: Name — date — location — distances — one short note (registration window / terrain / why notable). Prefer 2026–2027 events. If a date can't be verified, write 'check official site'. No preamble, no closing fluff.",
          messages: [{ role: "user", content: query }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setRes(text || "No results — try a different search.");
    } catch (e) { setRes("Connection error — the live search needs a connection. Try again in a moment."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SectionTitle n="01">Find your next event</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>A live search engine — it scans the real web for current races, not a stale baked-in list. Search a place, distance, or vibe.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: C.soft }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. half marathons in Andalusia, autumn 2026"
            style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
        </div>
        <button onClick={() => search()} disabled={loading} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "0 18px", cursor: "pointer", ...mono, fontSize: 13, fontWeight: 600 }}>{loading ? "…" : "Search"}</button>
      </div>

      <div style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".08em", marginBottom: 7 }}>TRENDING SEARCHES</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {TREND_SEARCHES.map((c) => (
          <button key={c} onClick={() => search(c)} disabled={loading} style={{ ...mono, fontSize: 11.5, padding: "7px 11px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.paper, cursor: "pointer", color: C.deep }}>{c}</button>
        ))}
      </div>

      {(loading || res) && (
        <Card style={{ padding: 16, marginBottom: 18, borderLeft: `4px solid ${C.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, ...mono, fontSize: 11, color: C.soft, marginBottom: 8 }}><Globe size={14} /> LIVE RESULTS{q ? ` · ${q}` : ""}</div>
          {loading ? <Dots label="Searching the web for real events" />
            : <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", color: C.ink }}>{res}</div>}
        </Card>
      )}

      <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Trending in endurance</span></SectionTitle>
      <p style={{ fontSize: 13, color: C.soft, marginBottom: 10 }}>A snapshot of the disciplines growing fastest right now. Tap "find" to search real events near you.</p>
      {TREND_SPORTS.map((s) => (
        <Card key={s.n} style={{ padding: 14, marginBottom: 9, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...serif, fontSize: 16, fontWeight: 600 }}>{s.n}</div>
            <div style={{ fontSize: 12.5, color: C.soft, marginTop: 1 }}>{s.b}</div>
          </div>
          <button onClick={() => search(`${s.n} events near London 2026`)} disabled={loading} style={{ ...mono, fontSize: 11.5, padding: "8px 12px", borderRadius: 999, border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, cursor: "pointer", flex: "none", display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={13} /> find
          </button>
        </Card>
      ))}
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 8 }}>
        Live results come from a real-time web search and need a connection. Always confirm dates and entry on the official event site before booking travel.
      </div>
    </div>
  );
}

/* ============================ GOALS (race countdown + auto training-block targets) ============================ */
const GOAL_DIST = { "5K": 5000, "10K": 10000, "Half": 21097.5, "Marathon": 42195, "Trail/Ultra": null, "Other": null };
function Goals() {
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [f, setF] = useState({ name: "", date: "", dist: "Half" });
  const [takeover, setTakeover] = useState(false);
  useEffect(() => { store.get("goals").then((d) => { setGoals(d || []); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) store.set("goals", goals); }, [goals, loaded]);
  const add = () => {
    if (f.name.trim() && f.date) {
      setGoals((g) => [...g, { id: Date.now(), ...f }].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)));
      setF({ name: "", date: "", dist: "Half" });
    }
  };
  const del = (id) => setGoals((g) => g.filter((x) => x.id !== id));

  const T1 = 46 * 60 + 10, D1 = 10000;
  const targetTime = (dist) => { const m = GOAL_DIST[dist]; return m ? fmtTime(riegel(T1, D1, m)) : null; };
  const focusFor = (weeks) =>
    weeks <= 0 ? { t: "Race week / done", c: C.ink }
    : weeks <= 2 ? { t: "Taper — sharpen down", c: C.blue }
    : weeks <= 5 ? { t: "VO₂ & sharpening", c: C.accent }
    : weeks <= 9 ? { t: "Threshold development", c: C.amber }
    : { t: "Base building", c: C.green };

  const future = goals.filter((g) => Date.parse(g.date) >= Date.now() - 86400000);
  const nearest = future[0];
  const nDays = nearest ? Math.ceil((Date.parse(nearest.date) - Date.now()) / 86400000) : null;
  useEffect(() => {
    if (!loaded || !nearest || nDays == null || nDays > 10 || nDays < 0) return;
    const key = `${todayKey()}-${nearest.id}`;
    store.get("racetakeover-seen").then((s) => { if (s !== key) { setTakeover(true); store.set("racetakeover-seen", key); } });
  }, [loaded]);

  return (
    <div>
      {nearest && (
        <button onClick={() => setTakeover(true)} style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", borderRadius: 16, padding: "16px 18px", marginBottom: 18, color: "#fff", background: nDays <= 10 ? "linear-gradient(120deg,#1E5F8C,#E2441F,#C98A12)" : "linear-gradient(120deg,#17150F,#3a1d12)", backgroundSize: "180% 180%", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 12px 30px -16px rgba(226,68,31,.6)" }}>
          <span style={{ ...serif, fontSize: 40, fontWeight: 900, flex: "none", lineHeight: 1, minWidth: 54, textAlign: "center" }}>{nDays}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: ".18em", color: "#ffd9c8", display: "block" }}>{nDays <= 10 ? "RACE WEEK" : `DAY${nDays === 1 ? "" : "S"} TO GO`}</span>
            <span style={{ ...serif, fontSize: 18, fontWeight: 800, display: "block", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nearest.name}</span>
            <span style={{ fontSize: 12, color: "#e6ddd2" }}>tap for race-day hype →</span>
          </span>
          <Crown size={22} />
        </button>
      )}
      <SectionTitle n="01">Add a goal race</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Find a race in the Events tab, then pin it here. Each goal gets a live countdown and the training focus you should be in <b style={{ color: C.deep }}>right now</b> to be ready for it.</p>
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder="Race name — e.g. Rome Half Marathon"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 11, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none", marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <input type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
            style={{ ...mono, padding: "9px 11px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.keys(GOAL_DIST).map((d) => (
            <button key={d} onClick={() => setF((p) => ({ ...p, dist: d }))} style={{ ...mono, fontSize: 12, padding: "7px 11px", borderRadius: 999, cursor: "pointer",
              border: `1.5px solid ${f.dist === d ? C.accent : C.line}`, background: f.dist === d ? C.accent : "transparent", color: f.dist === d ? "#fff" : C.soft }}>{d}</button>
          ))}
        </div>
        <button onClick={add} style={{ width: "100%", background: C.ink, color: C.paper, border: "none", borderRadius: 11, padding: "12px", cursor: "pointer", ...mono, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Target size={16} /> Pin goal
        </button>
      </Card>

      <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Your timeline</span></SectionTitle>
      {future.length === 0 ? (
        <EmptyState icon={Target} title="No races pinned yet" line="Pin a race above and your countdown board — and the race-week takeover — build here." />
      ) : future.map((g, i) => {
        const days = Math.ceil((Date.parse(g.date) - Date.now()) / 86400000);
        const weeks = Math.ceil(days / 7);
        const focus = focusFor(weeks);
        const tt = targetTime(g.dist);
        return (
          <Card key={g.id} style={{ padding: 16, marginBottom: 11, borderLeft: `4px solid ${i === 0 ? C.accent : C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                {i === 0 && <div style={{ ...mono, fontSize: 10, letterSpacing: ".12em", color: C.accent, fontWeight: 600, marginBottom: 3 }}>NEXT UP</div>}
                <div style={{ ...serif, fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{g.name}</div>
                <div style={{ ...mono, fontSize: 12, color: C.soft, marginTop: 3 }}>{g.date} · {g.dist}{tt ? ` · target ~${tt}` : ""}</div>
              </div>
              <button onClick={() => del(g.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft }}><Trash2 size={16} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
              <div>
                <span style={{ ...serif, fontSize: 34, fontWeight: 800, color: C.ink }}>{days}</span>
                <span style={{ ...mono, fontSize: 12, color: C.soft }}> {days === 1 ? "day" : "days"} to go</span>
              </div>
              <div style={{ ...mono, fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 999, background: focus.c === C.ink ? C.ink : `${focus.c}22`, color: focus.c === C.ink ? "#fff" : focus.c, border: `1px solid ${focus.c}` }}>
                {weeks > 0 ? `${weeks} wk out · ${focus.t}` : focus.t}
              </div>
            </div>
          </Card>
        );
      })}
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 8 }}>
        <b style={{ color: C.ink }}>How the focus is set:</b> 10+ weeks out → base building · 6–9 → threshold · 3–5 → VO₂ &amp; sharpening · 1–2 → taper. It mirrors the Plan tab, so your countdown and your weekly sessions always agree on where you are.
      </div>

      <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Personal records</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Your trophy case. Log a real result and, if it's a best, the board celebrates.</p>
      <PRBoard />
      {takeover && nearest && <RaceTakeover race={nearest.name} days={nDays} goalTime={targetTime(nearest.dist)} onClose={() => setTakeover(false)} />}
    </div>
  );
}

/* ============================ BODY (illness early-warning + form lab) ============================ */
const FORM_CHECK = [
  ["cadence", "Cadence quick & light (~170–180 steps/min)"],
  ["lean", "Slight forward lean from the ankles, not the waist"],
  ["foot", "Foot lands under your hips — not reaching out ahead"],
  ["arms", "Relaxed arms ~90°, driving back, no cross-body swing"],
  ["posture", "Tall posture, level gaze, shoulders down"],
  ["breath", "Rhythmic, relaxed, belly breathing"],
];
function Body() {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const [breathe, setBreathe] = useState(false);
  // ---- illness / strain early-warning (real signals) ----
  const [rhr, setRhr] = useState(54), [resp, setResp] = useState(19), [spo2, setSpo2] = useState(96);
  const rhrR = clamp((rhr - 46) / 8), respR = clamp((resp - 17.3) / 2.5), spo2R = clamp((97.5 - spo2) / 3);
  const idx = Math.round(((rhrR + respR + spo2R) / 3) * 100);
  const band = idx < 30 ? { t: "Clear", c: C.green, d: "Your overnight signals look settled. Train as planned." }
    : idx < 60 ? { t: "Watch", c: C.amber, d: "One or two signals are drifting. Favour easy days, sleep and fuel; hold off on hard sessions until they settle." }
    : { t: "Elevated", c: C.accent, d: "Multiple signals are raised together — typical of fatigue, under-recovery, or fighting something off. Ease right back. If it lingers alongside how you feel, the post-viral GP check is the sensible move." };

  const signals = [
    { k: "Resting HR", v: rhr, set: setRhr, base: 46, unit: "bpm", min: 40, max: 70, risk: rhrR, hint: "up = strain/illness" },
    { k: "Respiratory rate", v: resp, set: setResp, base: 17.3, unit: "/min", min: 12, max: 24, step: 0.1, risk: respR, hint: "up = strain/illness" },
    { k: "Blood oxygen", v: spo2, set: setSpo2, base: 97.5, unit: "%", min: 90, max: 100, step: 0.1, risk: spo2R, hint: "down = respiratory flag" },
  ];

  // ---- cadence metronome ----
  const [cad, setCad] = useState(175), [playing, setPlaying] = useState(false);
  const ctxRef = useRef(null), timerRef = useRef(null);
  const beep = () => {
    try {
      if (!SOUND_ON) return;
      const ctx = ctxRef.current; if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 1100; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      o.start(); o.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  };
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); }
    if (ctxRef.current && ctxRef.current.resume) ctxRef.current.resume();
    setPlaying(true);
  };
  useEffect(() => {
    if (playing) { beep(); timerRef.current = setInterval(beep, 60000 / cad); return () => clearInterval(timerRef.current); }
  }, [playing, cad]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const [form, setForm] = useState({});
  const formDone = FORM_CHECK.filter(([k]) => form[k]).length;

  return (
    <div>
      <button onClick={() => setBreathe(true)} style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", borderRadius: 16, padding: "16px 18px", marginBottom: 18, color: "#fff", background: "linear-gradient(120deg,#10261f,#1E5F8C,#2F7D52)", backgroundSize: "180% 180%", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 12px 30px -16px rgba(30,95,140,.7)" }}>
        <span style={{ width: 46, height: 46, flex: "none", borderRadius: 13, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.22)", display: "grid", placeItems: "center" }}><Wind size={22} /></span>
        <span style={{ flex: 1 }}><span style={{ ...serif, fontSize: 18, fontWeight: 800, display: "block" }}>Box breathing</span><span style={{ fontSize: 12.5, color: "#dbe7e2" }}>60 seconds to downshift — recovery, HRV &amp; sleep</span></span>
        <ChevronRight size={20} />
      </button>
      <SectionTitle n="01">Illness &amp; strain early-warning</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Three overnight signals that rise (or drop) together before you consciously feel run-down. Built from your real data — adjust the readings and the index responds.</p>
      <Card style={{ padding: 18, marginBottom: 14, borderLeft: `4px solid ${band.c}`, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...serif, fontSize: 52, fontWeight: 800, lineHeight: 1, color: band.c }}>{idx}</div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: ".14em", color: C.soft }}>WARNING INDEX</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ ...serif, fontSize: 22, fontWeight: 600, color: band.c }}>{band.t}</div>
          <p style={{ fontSize: 13, color: C.soft, marginTop: 4, lineHeight: 1.5 }}>{band.d}</p>
        </div>
      </Card>
      {signals.map((s) => (
        <Card key={s.k} style={{ padding: 14, marginBottom: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...mono, fontSize: 11, color: C.soft, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.k}</span>
            <span style={{ ...mono, fontSize: 11, color: C.soft }}>baseline {s.base}{s.unit} · {s.hint}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <span style={{ ...serif, fontSize: 26, fontWeight: 600, width: 70, color: s.risk > 0.6 ? C.accent : s.risk > 0.3 ? C.amber : C.green }}>{s.v}{s.unit === "%" ? "%" : ""}</span>
            <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.v} onChange={(e) => s.set(parseFloat(e.target.value))} style={{ flex: 1 }} />
          </div>
        </Card>
      ))}
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, margin: "4px 0 8px" }}>
        <b style={{ color: C.ink }}>Not a diagnosis.</b> A raised index flags physiological strain — it can mean hard training, poor sleep, or a bug brewing. It can't tell which. Overnight wrist temperature would add a fourth signal here once your health data is reachable. Persistent flags + feeling off = worth a GP conversation.
      </div>

      <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>Form Lab — cadence</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Cadence is the single most powerful form lever — lifting it shortens your stride, reduces overstriding and cuts impact load (directly relevant to the leg-swelling you've tracked). Set a target, hit play, and run to the beat.</p>
      <Card style={{ padding: 20, marginBottom: 14, textAlign: "center" }}>
        <div style={{ ...serif, fontSize: 56, fontWeight: 800, lineHeight: 1, color: C.accent }}>{cad}</div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: ".14em", color: C.soft, marginBottom: 14 }}>STEPS PER MINUTE</div>
        <input type="range" min={150} max={195} value={cad} onChange={(e) => setCad(parseInt(e.target.value))} style={{ width: "100%", marginBottom: 16 }} />
        <button onClick={toggle} style={{ background: playing ? C.ink : C.accent, color: "#fff", border: "none", borderRadius: 999, padding: "13px 28px", cursor: "pointer", ...mono, fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
          {playing ? <><Pause size={18} /> Stop</> : <><Play size={18} /> Start metronome</>}
        </button>
        <div style={{ ...mono, fontSize: 11, color: C.soft, marginTop: 12 }}>target zone 170–180 spm for most runners · keep steps light &amp; quick</div>
      </Card>

      <SectionTitle n="03"><span style={{ marginTop: 4, display: "inline-block" }}>Form self-check</span></SectionTitle>
      <Card style={{ padding: 16, marginBottom: 14, borderLeft: `4px solid ${formDone >= 5 ? C.green : C.amber}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".08em" }}>FORM SCORE</span>
          <span style={{ ...serif, fontSize: 20, fontWeight: 700, color: formDone >= 5 ? C.green : C.amber }}>{formDone}/6</span>
        </div>
        {FORM_CHECK.map(([k, label]) => {
          const on = !!form[k];
          return (
            <button key={k} onClick={() => setForm((p) => ({ ...p, [k]: !p[k] }))} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "9px 0", cursor: "pointer", borderBottom: `1px dashed ${C.line}` }}>
              <span style={{ width: 22, height: 22, flex: "none", borderRadius: 7, border: `2px solid ${on ? C.green : C.line}`, background: on ? C.green : "transparent", display: "grid", placeItems: "center" }}>{on && <Check size={14} color="#fff" />}</span>
              <span style={{ fontSize: 13.5, color: on ? C.ink : C.soft, fontWeight: on ? 600 : 400 }}>{label}</span>
            </button>
          );
        })}
      </Card>

      <div style={{ background: C.ink, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, ...mono, fontSize: 11, color: "#ffb59f", letterSpacing: ".08em", marginBottom: 6 }}><Footprints size={15} /> LIVE GAIT METRICS</div>
        <p style={{ fontSize: 13, color: "#e6ddd2", lineHeight: 1.55, margin: 0 }}>Stride length, walking asymmetry and ground-contact balance will populate here automatically once the Apple Health gait feeds are reachable — wired in, just waiting on the data connection. They'll make this panel a true biomechanics dashboard, with asymmetry trends flagged against your leg-swelling history.</p>
      </div>
      {breathe && <BoxBreathe onClose={() => setBreathe(false)} />}
    </div>
  );
}

/* ============================ PIONEER (novel features) ============================ */
const DATA_SNAPSHOT = "VO2max: Nov 37.7 -> Apr 42.8 -> May 48.9 (rising fast). Resting HR 46 baseline, recent 52-54 (dip). HRV avg 76, ceiling 107, recent dip to 58-66. Weekly running km Apr-May: 22,41,47,34,35,25,37,24. ~33km/wk, ALL easy 6:00-6:50/km, ZERO threshold/VO2 work, long runs 17-19km. ACWR ~1.3 (spike from 24km over 24-25 May). Sleep 5-7.5h fragmented. SpO2 dipped to 93-94% late May. Activity mix 59d: 36 runs, 22 climbs, 7 walks, 4 cycles, 4 skates, 3 strength, 1 HIIT. Body 50.5kg, BMI 19.8, body fat 24.5%, lean 38.4kg. VDOT ~47 -> 5K 22:15, 10K 46:10, Half 1:42, Marathon 3:33. Goal sub-1:45 half on 20 Jun 2026. DNA scores: aerobic 88, endurance 90, consistency 92, versatility 95, recovery 60, top-end speed 45.";

const ARCH = {
  diesel: { name: "The Diesel", tag: "An aerobic engine with endurance for days — speed is the open frontier.", edge: "Relentless base & durability. You go long, go often, and recover between days better than most ever will.", frontier: "Top-end speed — never trained, so it's pure untapped upside.", style: "Train like a classic marathoner: vast base first, then layer sharpening. Your ceiling rises fastest the moment you add the missing 20%." },
  engine: { name: "The Engine", tag: "A big VO₂ max that loves to be revved.", edge: "Raw aerobic power and high ceiling.", frontier: "Converting power into sustained race pace.", style: "Feed the engine with threshold volume and long intervals." },
  metronome: { name: "The Metronome", tag: "Consistency is your superpower.", edge: "You show up, every day, rain or shine.", frontier: "Adding intensity contrast without breaking rhythm.", style: "Periodise hard/easy so consistency compounds instead of flatlines." },
  allrounder: { name: "The All-Rounder", tag: "A complete, adaptable athlete.", edge: "Breadth — strong everywhere, brittle nowhere.", frontier: "Choosing a focus long enough to spike one quality.", style: "Block-periodise: specialise for 6–8 weeks at a time." },
};
function pickArchetype(d) {
  if (d.top < 55 && d.end >= 80) return ARCH.diesel;
  const max = Math.max(d.aerobic, d.end, d.cons, d.vers);
  if (max === d.aerobic) return ARCH.engine;
  if (max === d.cons) return ARCH.metronome;
  return ARCH.allrounder;
}

function Pioneer() {
  const T1 = 46 * 60 + 10, D1 = 10000;

  /* ---- 1. Ask Your Data ---- */
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = ["Am I actually improving?", "What's my single biggest limiter?", "Is my training load safe right now?", "What should I change to run faster?"];
  const ask = async (text) => {
    const query = (text ?? q).trim(); if (!query || loading) return;
    setQ(query); setLoading(true); setAns("");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 700,
          system: "You are STRIDE's data analyst — a sharp sports scientist. Answer the runner's question using ONLY the data provided. Cite her real numbers, be specific and scientific, keep it under 110 words, and finish with one concrete takeaway line starting with '→'. Data: " + DATA_SNAPSHOT,
          messages: [{ role: "user", content: query }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setAns(text || "Couldn't analyse that one — try rephrasing?");
    } catch (e) { setAns("Connection error — Ask Your Data needs a live connection. Try again shortly."); }
    finally { setLoading(false); }
  };

  /* ---- 2. Probabilistic forecaster ---- */
  const [dist, setDist] = useState("Half");
  const [form, setForm] = useState(0.5);
  const sims = useMemo(() => {
    const base = riegel(T1, D1, GOAL_DIST[dist] || 21097.5);
    const meanMul = 1 + (0.04 - form * 0.06);
    const sd = 0.038 - form * 0.018;
    const N = 2500, a = [];
    for (let i = 0; i < N; i++) {
      const u1 = Math.random() || 1e-9, u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      a.push(base * (meanMul + z * sd));
    }
    a.sort((x, y) => x - y);
    const p = (qq) => a[Math.floor(qq * N)];
    const min = a[0], max = a[N - 1], bins = 24, step = (max - min) / bins || 1;
    const hist = Array.from({ length: bins }, (_, i) => ({ t: +(((min + step * (i + 0.5)) / 60)).toFixed(2), n: 0 }));
    a.forEach((v) => { let idx = Math.floor((v - min) / step); if (idx >= bins) idx = bins - 1; if (idx < 0) idx = 0; hist[idx].n++; });
    return { p10: p(0.1), p50: p(0.5), p90: p(0.9), hist };
  }, [dist, form]);

  /* ---- 3. Archetype ---- */
  const arch = pickArchetype({ aerobic: 88, top: 45, end: 90, rec: 60, cons: 92, vers: 95 });

  /* ---- 4. Detraining ---- */
  const [off, setOff] = useState(7);
  const retain = (d) => Math.max(70, d <= 10 ? 100 - 0.3 * d : 97 - 1.2 * (d - 10));
  const detrend = Array.from({ length: 29 }, (_, d) => ({ d, r: +retain(d).toFixed(1) }));
  const kept = retain(off).toFixed(0);
  const rebuild = Math.max(1, Math.round(off * 1.3));

  return (
    <div>
      {/* 1 ASK YOUR DATA */}
      <SectionTitle n="01">Ask your data</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>The first running app you can actually <b style={{ color: C.deep }}>talk to about yourself</b>. Ask anything — an AI sports scientist answers from your real numbers.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Brain size={16} style={{ position: "absolute", left: 12, top: 13, color: C.soft }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about your training…"
            style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
        </div>
        <button onClick={() => ask()} disabled={loading} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "0 16px", cursor: "pointer", ...mono, fontSize: 13, fontWeight: 600 }}>{loading ? "…" : "Ask"}</button>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
        {suggestions.map((s) => <button key={s} onClick={() => ask(s)} disabled={loading} style={{ ...mono, fontSize: 11.5, padding: "6px 10px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.paper, cursor: "pointer", color: C.deep }}>{s}</button>)}
      </div>
      {(loading || ans) && (
        <Card style={{ padding: 16, marginBottom: 8, borderLeft: `4px solid ${C.accent}` }}>
          {loading ? <Dots label="Analysing your data" />
            : <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{ans}</div>}
        </Card>
      )}

      {/* 2 FORECASTER */}
      <SectionTitle n="02"><span style={{ marginTop: 18, display: "inline-block" }}>Probabilistic race forecaster</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Not one fake-precise number — a real <b style={{ color: C.deep }}>distribution</b> from 2,500 simulations. Honest about race-day variability.</p>
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {["5K", "10K", "Half", "Marathon"].map((d) => (
            <button key={d} onClick={() => setDist(d)} style={{ ...mono, fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer",
              border: `1.5px solid ${dist === d ? C.accent : C.line}`, background: dist === d ? C.accent : "transparent", color: dist === d ? "#fff" : C.soft }}>{d}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: C.soft, marginBottom: 6 }}><span>FORM ON THE DAY</span><span>{form < 0.34 ? "under-recovered" : form < 0.67 ? "solid" : "peaked"}</span></div>
        <input type="range" min={0} max={1} step={0.01} value={form} onChange={(e) => setForm(+e.target.value)} style={{ width: "100%", marginBottom: 14 }} />
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ ...serif, fontSize: 34, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{fmtTime(sims.p50)}</div>
          <div style={{ ...mono, fontSize: 12, color: C.soft, marginTop: 4 }}>most likely · 80% range {fmtTime(sims.p10)}–{fmtTime(sims.p90)}</div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={sims.hist}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.5} /><stop offset="100%" stopColor={C.accent} stopOpacity={0.03} /></linearGradient>
              <filter id="forecastGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.accent} floodOpacity="0.35" /></filter>
            </defs>
            <XAxis type="number" dataKey="t" domain={["dataMin", "dataMax"]} tick={{ ...mono, fontSize: 9, fill: C.soft }} tickFormatter={(v) => fmtTime(v * 60)} />
            <YAxis hide />
            <Tooltip formatter={(v) => [v, "runs"]} labelFormatter={(v) => fmtTime(v * 60)} contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
            <ReferenceLine x={+(sims.p50 / 60).toFixed(2)} stroke={C.accent} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="n" stroke={C.deep} fill="url(#forecastFill)" strokeWidth={2.5} filter="url(#forecastGlow)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* 3 ARCHETYPE */}
      <SectionTitle n="03"><span style={{ marginTop: 4, display: "inline-block" }}>Your runner archetype</span></SectionTitle>
      <div style={{ background: "linear-gradient(135deg,#17150F 0%,#3a1d12 100%)", borderRadius: 18, padding: 22, color: C.paper, marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, background: "radial-gradient(circle,rgba(226,68,31,.4),transparent 65%)" }} />
        <div style={{ ...mono, fontSize: 11, letterSpacing: ".2em", color: "#ffb59f" }}>ARCHETYPE</div>
        <div style={{ ...serif, fontSize: 40, fontWeight: 900, lineHeight: 1, margin: "6px 0 8px" }}>{arch.name}</div>
        <p style={{ fontSize: 14, color: "#e6ddd2", maxWidth: "46ch" }}>{arch.tag}</p>
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <div><div style={{ ...mono, fontSize: 10, color: "#ffb59f", letterSpacing: ".1em" }}>YOUR EDGE</div><div style={{ fontSize: 13.5, color: "#f3ece2" }}>{arch.edge}</div></div>
          <div><div style={{ ...mono, fontSize: 10, color: "#ffb59f", letterSpacing: ".1em" }}>YOUR FRONTIER</div><div style={{ fontSize: 13.5, color: "#f3ece2" }}>{arch.frontier}</div></div>
          <div><div style={{ ...mono, fontSize: 10, color: "#ffb59f", letterSpacing: ".1em" }}>HOW TO TRAIN IT</div><div style={{ fontSize: 13.5, color: "#f3ece2" }}>{arch.style}</div></div>
        </div>
      </div>

      {/* 4 DETRAINING */}
      <SectionTitle n="04"><span style={{ marginTop: 4, display: "inline-block" }}>Cost of a break</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>The rest-guilt killer. Drag the days off and see what you'd actually keep — for a deep base like yours, a short break costs almost nothing.</p>
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 12, color: C.soft, marginBottom: 6 }}><span>DAYS OFF</span><b style={{ color: C.ink }}>{off}</b></div>
        <input type="range" min={0} max={28} value={off} onChange={(e) => setOff(+e.target.value)} style={{ width: "100%", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120, textAlign: "center", padding: 12, background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
            <div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".1em" }}>FITNESS KEPT</div>
            <div style={{ ...serif, fontSize: 32, fontWeight: 700, color: +kept >= 95 ? C.green : +kept >= 88 ? C.amber : C.accent }}>{kept}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 120, textAlign: "center", padding: 12, background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
            <div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".1em" }}>REBUILD TIME</div>
            <div style={{ ...serif, fontSize: 32, fontWeight: 700, color: C.ink }}>~{rebuild}<span style={{ fontSize: 14 }}> d</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={detrend}>
            <defs>
              <linearGradient id="detrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.4} /><stop offset="100%" stopColor={C.green} stopOpacity={0.02} /></linearGradient>
              <filter id="detrendGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.green} floodOpacity="0.4" /></filter>
            </defs>
            <XAxis dataKey="d" tick={{ ...mono, fontSize: 9, fill: C.soft }} />
            <YAxis domain={[70, 100]} hide />
            <Tooltip formatter={(v) => [`${v}%`, "fitness"]} labelFormatter={(v) => `${v} days off`} contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
            <ReferenceLine x={off} stroke={C.accent} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="r" stroke={C.green} fill="url(#detrendFill)" strokeWidth={2.5} filter="url(#detrendGlow)" />
          </AreaChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12.5, color: C.soft, marginTop: 6, marginBottom: 0 }}>{off <= 5 ? "Essentially free — your aerobic base barely notices ≤5 days. Rest without guilt." : off <= 12 ? "Minor, fully recoverable. Sharpness returns within days of restarting." : "Real but rebuildable — and your deep base means you come back faster than you fell."}</p>
      </Card>
    </div>
  );
}

/* ============================ ATHLETE CARD (shareable, one-tap export) ============================ */
function buildCardSvg() {
  const W = 1080, H = 1350, cx = 540, cy = 690, R = 205;
  const dims = [["Aerobic", 88], ["Endurance", 90], ["Consistency", 92], ["Versatility", 95], ["Recovery", 60], ["Speed", 45]];
  const pt = (frac, i) => { const a = (-90 + 60 * i) * Math.PI / 180; return [cx + R * frac * Math.cos(a), cy + R * frac * Math.sin(a)]; };
  const poly = (frac) => dims.map((_, i) => pt(frac, i).map((n) => n.toFixed(1)).join(",")).join(" ");
  const dataPoly = dims.map((d, i) => pt(d[1] / 100, i).map((n) => n.toFixed(1)).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${poly(f)}" fill="none" stroke="rgba(244,240,231,0.13)" stroke-width="1.5"/>`).join("");
  const spokes = dims.map((_, i) => { const [x, y] = pt(1, i); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(244,240,231,0.13)" stroke-width="1.5"/>`; }).join("");
  const dots = dims.map((d, i) => { const [x, y] = pt(d[1] / 100, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#E2441F"/>`; }).join("");
  const labels = dims.map((d, i) => { const [x, y] = pt(1.17, i); const anchor = Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end"; const dy = y < cy ? -8 : 26; return `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" fill="#cdbfae" font-size="25" font-family="ui-monospace,monospace" text-anchor="${anchor}">${d[0]} ${d[1]}</text>`; }).join("");
  const stats = [["VO₂ MAX", "48.9"], ["VDOT", "47"], ["RESTING HR", "46"], ["HALF (est)", "1:42"], ["WEEKLY", "33 km"], ["LONG RUN", "19 km"]];
  const statSVG = stats.map((s, i) => { const col = i % 3, row = Math.floor(i / 3); const x = 200 + col * 340; const y = 1015 + row * 118; return `<text x="${x}" y="${y}" fill="#F4F0E7" font-size="56" font-family="Fraunces,Georgia,serif" font-weight="700" text-anchor="middle">${s[1]}</text><text x="${x}" y="${y + 33}" fill="#a99d8c" font-size="21" font-family="ui-monospace,monospace" text-anchor="middle" letter-spacing="2">${s[0]}</text>`; }).join("");
  const date = new Date().toISOString().slice(0, 10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17150F"/><stop offset="1" stop-color="#3a1d12"/></linearGradient>
<radialGradient id="glow" cx="0.82" cy="0.12" r="0.55"><stop offset="0" stop-color="rgba(226,68,31,0.38)"/><stop offset="1" stop-color="rgba(226,68,31,0)"/></radialGradient></defs>
<rect width="1080" height="1350" fill="url(#bg)"/><rect width="1080" height="1350" fill="url(#glow)"/>
<rect x="22" y="22" width="1036" height="1306" rx="30" fill="none" stroke="rgba(244,240,231,0.18)" stroke-width="2"/>
<text x="70" y="104" fill="#F4F0E7" font-size="46" font-family="Fraunces,Georgia,serif" font-weight="900" letter-spacing="2">STRIDE</text>
<text x="1010" y="104" fill="#ffb59f" font-size="23" font-family="ui-monospace,monospace" text-anchor="end" letter-spacing="3">ATHLETE CARD</text>
<text x="72" y="222" fill="#ffb59f" font-size="25" font-family="ui-monospace,monospace" letter-spacing="7">ARCHETYPE</text>
<text x="66" y="322" fill="#F4F0E7" font-size="100" font-family="Fraunces,Georgia,serif" font-weight="900">The Diesel</text>
<text x="72" y="382" fill="#cdbfae" font-size="29" font-family="ui-monospace,monospace">TRACY · aerobic engine, endurance for days</text>
${rings}${spokes}
<polygon points="${dataPoly}" fill="rgba(226,68,31,0.30)" stroke="#E2441F" stroke-width="3"/>
${dots}${labels}
${statSVG}
<line x1="70" y1="1252" x2="1010" y2="1252" stroke="rgba(244,240,231,0.18)" stroke-width="1.5"/>
<text x="70" y="1302" fill="#a99d8c" font-size="23" font-family="ui-monospace,monospace">Built on Apple Health · ${date}</text>
<text x="1010" y="1302" fill="#a99d8c" font-size="23" font-family="ui-monospace,monospace" text-anchor="end">engine first · speed next</text>
</svg>`;
}
function AthleteCard() {
  const exportSvg = useMemo(() => buildCardSvg(), []);
  const previewSvg = exportSvg.replace('width="1080" height="1350"', 'width="100%" height="auto" style="display:block;border-radius:14px"');
  const [busy, setBusy] = useState(false);

  const downloadPNG = () => {
    setBusy(true);
    try {
      const blob = new Blob([exportSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const W = 1080, H = 1350, s = 2;
        const canvas = document.createElement("canvas");
        canvas.width = W * s; canvas.height = H * s;
        const ctx = canvas.getContext("2d"); ctx.scale(s, s); ctx.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "stride-athlete-card.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
          setBusy(false);
        }, "image/png");
      };
      img.onerror = () => { setBusy(false); };
      img.src = url;
    } catch (e) { setBusy(false); }
  };
  const downloadSVG = () => {
    const blob = new Blob([exportSvg], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "stride-athlete-card.svg"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div>
      <SectionTitle n="01">Your athlete card</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 14 }}>Your archetype, DNA radar and headline numbers in one shareable card — the kind of thing people actually post. One tap to export as an image.</p>
      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 20px 50px -28px rgba(0,0,0,.6)" }} dangerouslySetInnerHTML={{ __html: previewSvg }} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={downloadPNG} disabled={busy} style={{ flex: 1, minWidth: 160, background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px", cursor: "pointer", ...mono, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Download size={18} /> {busy ? "Rendering…" : "Download PNG"}
        </button>
        <button onClick={downloadSVG} style={{ flex: 1, minWidth: 130, background: "transparent", color: C.deep, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "14px", cursor: "pointer", ...mono, fontSize: 14, fontWeight: 600 }}>
          Download SVG
        </button>
      </div>
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 14 }}>
        Exports as a 1080×1350 image (portrait, perfect for stories). The card regenerates from your live profile, so as your VO₂ max and archetype evolve, so does the card.
      </div>
    </div>
  );
}

/* ============================ STRIDE MARKS (badge system) ============================ */
const TIERS = {
  common: { label: "Bronze", rim: "#E9C39A", glow: "rgba(154,90,46,.45)" },
  rare: { label: "Steel", rim: "#D6E4EC", glow: "rgba(70,105,125,.5)" },
  epic: { label: "Gold", rim: "#FBE6A8", glow: "rgba(181,132,15,.55)" },
  legendary: { label: "Legendary", rim: "#FFD9A0", glow: "rgba(226,68,31,.6)" },
};
const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (-90 + 60 * i) * Math.PI / 180; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");

function Medallion({ icon: Icon, tier, earned, progress = 0, size = 88 }) {
  const T = TIERS[tier] || TIERS.common;
  const ringC = 2 * Math.PI * 47;
  return (
    <div style={{ position: "relative", width: size, height: size, filter: earned ? `drop-shadow(0 7px 16px ${T.glow})` : "none" }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ filter: earned ? "none" : "grayscale(1) opacity(.6)", transition: "all .35s" }}>
        {!earned && <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(23,21,15,.12)" strokeWidth="3" />}
        {!earned && progress > 0 && <circle cx="50" cy="50" r="47.5" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progress)} transform="rotate(-90 50 50)" />}
        <polygon points={hexPts(50, 50, 44)} fill={`url(#enamel-${tier})`} stroke={T.rim} strokeWidth="2.6" strokeLinejoin="round" />
        <polygon points={hexPts(50, 50, 36)} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Icon size={size * 0.34} color={earned ? "#fff" : "#9a8f80"} strokeWidth={2.1} />
      </div>
      {!earned && (
        <div style={{ position: "absolute", bottom: size * 0.04, right: size * 0.04, width: size * 0.26, height: size * 0.26, borderRadius: "50%", background: C.ink, display: "grid", placeItems: "center", border: "2px solid " + C.paper }}>
          <Lock size={size * 0.13} color={C.paper} />
        </div>
      )}
    </div>
  );
}

function computeStats(sessions, recipesCount = 0, routesCount = 0, prCount = 0) {
  const runs = sessions.filter((s) => s.sport === "Run");
  const totalSessions = sessions.length, totalRuns = runs.length;
  const runMin = runs.reduce((a, s) => a + (+s.minutes || 0), 0);
  const estKm = runMin / 6.33;
  const longRunKm = runs.reduce((m, s) => Math.max(m, (+s.minutes || 0) / 6.33), 0);
  const dset = new Set(sessions.map((s) => s.date));
  let streak = 0; const dd = new Date();
  if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1);
  while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  const sports = new Set(sessions.map((s) => s.sport)).size;
  const ts = [...dset].map((d) => Date.parse(d)).sort((a, b) => a - b);
  let comeback = false; for (let i = 1; i < ts.length; i++) if ((ts[i] - ts[i - 1]) / 86400000 >= 5) { comeback = true; break; }
  return { totalSessions, totalRuns, estKm, longRunKm, streak, sports, comeback, recipes: recipesCount, routes: routesCount, prsLogged: prCount, vo2: 48.9, vo2gain: 11.2, diesel: true };
}
const routeStampCount = (pp) => new Set((Array.isArray(pp) ? pp : []).map((s) => s.theme)).size;

const BADGE_DEFS = [
  { id: "engine", name: "Aerobic Engine", desc: "Reach a VO₂ max of 45+", tier: "epic", icon: Heart, cat: "Engine", test: (s) => ({ earned: s.vo2 >= 45, progress: Math.min(1, s.vo2 / 45), info: `VO₂ ${s.vo2}` }) },
  { id: "ascent", name: "The Ascent", desc: "Lift your VO₂ max by 10 points", tier: "legendary", icon: TrendingUp, cat: "Engine", test: (s) => ({ earned: s.vo2gain >= 10, progress: Math.min(1, s.vo2gain / 10), info: `+${s.vo2gain.toFixed(1)} pts` }) },
  { id: "diesel", name: "The Diesel", desc: "Discover your runner archetype", tier: "legendary", icon: Gauge, cat: "Special", test: () => ({ earned: true, progress: 1, info: "Archetype revealed" }) },
  { id: "first", name: "First Stride", desc: "Log your very first run", tier: "common", icon: Footprints, cat: "Distance", test: (s) => ({ earned: s.totalRuns >= 1, progress: Math.min(1, s.totalRuns), info: `${s.totalRuns} runs` }) },
  { id: "spark", name: "Three-Day Spark", desc: "Hit a 3-day streak", tier: "common", icon: Flame, cat: "Streak", test: (s) => ({ earned: s.streak >= 3, progress: Math.min(1, s.streak / 3), info: `${s.streak}/3 days` }) },
  { id: "week", name: "Week Warrior", desc: "Hit a 7-day streak", tier: "rare", icon: Flame, cat: "Streak", test: (s) => ({ earned: s.streak >= 7, progress: Math.min(1, s.streak / 7), info: `${s.streak}/7 days` }) },
  { id: "fortnight", name: "Fortnight", desc: "Hit a 14-day streak", tier: "epic", icon: Flame, cat: "Streak", test: (s) => ({ earned: s.streak >= 14, progress: Math.min(1, s.streak / 14), info: `${s.streak}/14 days` }) },
  { id: "unbroken", name: "Unbroken", desc: "Hit a 30-day streak", tier: "legendary", icon: Crown, cat: "Streak", test: (s) => ({ earned: s.streak >= 30, progress: Math.min(1, s.streak / 30), info: `${s.streak}/30 days` }) },
  { id: "ten", name: "Ten Strong", desc: "Log 10 sessions", tier: "common", icon: Medal, cat: "Special", test: (s) => ({ earned: s.totalSessions >= 10, progress: Math.min(1, s.totalSessions / 10), info: `${s.totalSessions}/10` }) },
  { id: "fifty", name: "Half Ton", desc: "Log 50 sessions", tier: "rare", icon: Medal, cat: "Special", test: (s) => ({ earned: s.totalSessions >= 50, progress: Math.min(1, s.totalSessions / 50), info: `${s.totalSessions}/50` }) },
  { id: "century", name: "Centurion", desc: "Log 100 sessions", tier: "epic", icon: Crown, cat: "Special", test: (s) => ({ earned: s.totalSessions >= 100, progress: Math.min(1, s.totalSessions / 100), info: `${s.totalSessions}/100` }) },
  { id: "polymath", name: "Polymath", desc: "Train 3+ different sports", tier: "rare", icon: Compass, cat: "Special", test: (s) => ({ earned: s.sports >= 3, progress: Math.min(1, s.sports / 3), info: `${s.sports} sports` }) },
  { id: "km25", name: "Trailblazer", desc: "Cover 25 km of logged running", tier: "common", icon: Target, cat: "Distance", test: (s) => ({ earned: s.estKm >= 25, progress: Math.min(1, s.estKm / 25), info: `~${s.estKm.toFixed(0)}/25 km` }) },
  { id: "long18", name: "Long Hauler", desc: "Run 18 km in one outing", tier: "rare", icon: Mountain, cat: "Distance", test: (s) => ({ earned: s.longRunKm >= 18, progress: Math.min(1, s.longRunKm / 18), info: `~${s.longRunKm.toFixed(0)}/18 km` }) },
  { id: "km100", name: "Century Club", desc: "Cover 100 km of logged running", tier: "epic", icon: Target, cat: "Distance", test: (s) => ({ earned: s.estKm >= 100, progress: Math.min(1, s.estKm / 100), info: `~${s.estKm.toFixed(0)}/100 km` }) },
  { id: "comeback", name: "Phoenix", desc: "Return after 5+ days off", tier: "rare", icon: Repeat, cat: "Special", test: (s) => ({ earned: s.comeback, progress: s.comeback ? 1 : 0, info: "Welcome back" }) },
  { id: "speed", name: "Speed Forged", desc: "Bank a true threshold / interval session", tier: "rare", icon: Zap, cat: "Speed", test: () => ({ earned: false, progress: 0, info: "Your biggest opportunity" }) },
  { id: "half", name: "Half Conqueror", desc: "Run a half marathon — 21.1 km", tier: "epic", icon: Mountain, cat: "Distance", test: (s) => ({ earned: s.longRunKm >= 21.1, progress: Math.min(1, s.longRunKm / 21.1), info: `~${s.longRunKm.toFixed(0)}/21 km` }) },
  { id: "dawn", name: "Dawn Patrol", desc: "Finish a run before sunrise", tier: "rare", icon: Sunrise, cat: "Special", test: () => ({ earned: false, progress: 0, info: "Quest" }) },
  { id: "sub145", name: "Sub-1:45", desc: "Race a half marathon under 1:45", tier: "legendary", icon: Zap, cat: "Speed", test: () => ({ earned: false, progress: 0, info: "Goal · 20 June" }) },
  { id: "superhalf", name: "SuperHalf Pilgrim", desc: "Complete the SuperHalfs series", tier: "legendary", icon: Trophy, cat: "Special", test: () => ({ earned: false, progress: 0, info: "Lisbon · Berlin · Prague · Cardiff · Valencia" }) },
  { id: "marathon", name: "Marathoner", desc: "Run a full marathon — 42.2 km", tier: "legendary", icon: Mountain, cat: "Distance", test: (s) => ({ earned: s.longRunKm >= 42.2, progress: Math.min(1, s.longRunKm / 42.2), info: "Shanghai · December" }) },
  { id: "gourmet", name: "Gourmet Runner", desc: "Discover all nine Refuel recipe cards", tier: "legendary", icon: UtensilsCrossed, cat: "Special", test: (s) => ({ earned: (s.recipes || 0) >= RECIPES.length, progress: Math.min(1, (s.recipes || 0) / RECIPES.length), info: `${s.recipes || 0}/${RECIPES.length} recipes` }) },
  { id: "explorer", name: "London Explorer", desc: "Complete 5 different themed runs", tier: "legendary", icon: Map, cat: "Special", test: (s) => ({ earned: (s.routes || 0) >= 5, progress: Math.min(1, (s.routes || 0) / 5), info: `${s.routes || 0}/5 themes` }) },
  { id: "pr1", name: "Record Breaker", desc: "Log your first personal record", tier: "rare", icon: Trophy, cat: "Speed", test: (s) => ({ earned: (s.prsLogged || 0) >= 1, progress: Math.min(1, (s.prsLogged || 0) / 1), info: `${s.prsLogged || 0} PR logged` }) },
  { id: "prall", name: "Trophy Case", desc: "Log a PR at all five distances", tier: "legendary", icon: Crown, cat: "Speed", test: (s) => ({ earned: (s.prsLogged || 0) >= 5, progress: Math.min(1, (s.prsLogged || 0) / 5), info: `${s.prsLogged || 0}/5 distances` }) },
];
const evaluateBadges = (s) => BADGE_DEFS.map((b) => { const r = b.test(s); return { ...b, earned: r.earned, progress: r.progress || 0, info: r.info || b.desc }; });

function Marks() {
  const [sessions, setSessions] = useState([]);
  const [recipes, setRecipes] = useState(0);
  const [routes, setRoutes] = useState(0);
  const [prc, setPrc] = useState(0);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    store.get("sport-log").then((d) => {
      const arr = Array.isArray(d) ? d : [];
      setSessions(arr);
      store.get("refuel-recipes").then((rc) => {
        const rcount = Array.isArray(rc) ? rc.length : 0;
        setRecipes(rcount);
        store.get("route-passport").then((rp) => {
          const rt = routeStampCount(rp);
          setRoutes(rt);
          store.get("prs").then((pp) => {
            const prCount = prRealCount(pp);
            setPrc(prCount);
            const ev = evaluateBadges(computeStats(arr, rcount, rt, prCount));
            const earnedIds = ev.filter((b) => b.earned).map((b) => b.id);
            store.get("marks-seen").then((seen) => {
              if (!Array.isArray(seen)) { store.set("marks-seen", earnedIds); return; }
              const fresh = ev.find((b) => b.earned && !seen.includes(b.id));
              if (fresh) setDetail({ ...fresh, unlocked: true });
              store.set("marks-seen", earnedIds);
            });
          });
        });
      });
    });
  }, []);
  const all = useMemo(() => evaluateBadges(computeStats(sessions, recipes, routes, prc)), [sessions, recipes, routes, prc]);
  const earnedN = all.filter((b) => b.earned).length;
  const tierCount = (t) => all.filter((b) => b.earned && b.tier === t).length;
  const shown = all.filter((b) => filter === "all" ? true : filter === "earned" ? b.earned : !b.earned);

  return (
    <div>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <radialGradient id="enamel-common" cx="40%" cy="32%" r="78%"><stop offset="0" stopColor="#E8A468" /><stop offset="1" stopColor="#8A4F27" /></radialGradient>
          <radialGradient id="enamel-rare" cx="40%" cy="32%" r="78%"><stop offset="0" stopColor="#B3CAD7" /><stop offset="1" stopColor="#426377" /></radialGradient>
          <radialGradient id="enamel-epic" cx="40%" cy="32%" r="78%"><stop offset="0" stopColor="#F5D277" /><stop offset="1" stopColor="#A9790B" /></radialGradient>
          <linearGradient id="enamel-legendary" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E2441F" /><stop offset=".5" stopColor="#C98A12" /><stop offset="1" stopColor="#2F7D52" /></linearGradient>
        </defs>
      </svg>

      <SectionTitle n="01">Your Marks</SectionTitle>
      <div style={{ background: "linear-gradient(135deg,#17150F,#3a1d12)", borderRadius: 18, padding: 20, color: C.paper, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, background: "radial-gradient(circle,rgba(226,68,31,.35),transparent 65%)" }} />
        <div style={{ ...mono, fontSize: 11, letterSpacing: ".22em", color: "#ffb59f" }}>COLLECTION</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "4px 0 12px" }}>
          <span style={{ ...serif, fontSize: 46, fontWeight: 900, lineHeight: 1 }}>{earnedN}</span>
          <span style={{ ...mono, fontSize: 14, color: "#cdbfae" }}>/ {all.length} earned</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", ...mono, fontSize: 11, color: "#e6ddd2" }}>
          <span>🥉 {tierCount("common")} Bronze</span><span>⚙ {tierCount("rare")} Steel</span><span>🥇 {tierCount("epic")} Gold</span><span>✦ {tierCount("legendary")} Legendary</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        {[["all", "All"], ["earned", "Earned"], ["locked", "Locked"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ ...mono, fontSize: 12, padding: "8px 15px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${filter === k ? C.accent : C.line}`, background: filter === k ? C.accent : "transparent", color: filter === k ? "#fff" : C.soft }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(108px,1fr))", gap: 16 }}>
        {shown.map((b) => (
          <button key={b.id} onClick={() => setDetail(b)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: 0 }}>
            <Medallion icon={b.icon} tier={b.tier} earned={b.earned} progress={b.progress} size={86} />
            <span style={{ fontSize: 12, fontWeight: 600, color: b.earned ? C.ink : C.soft, textAlign: "center", lineHeight: 1.2 }}>{b.name}</span>
            <span style={{ ...mono, fontSize: 9.5, color: b.earned ? C.green : C.soft }}>{b.earned ? "EARNED" : b.info}</span>
          </button>
        ))}
      </div>

      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, zIndex: 90, background: detail.unlocked ? "#0d0b07" : "rgba(13,11,7,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 26, cursor: "pointer", overflow: "hidden" }}>
          {detail.unlocked && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#3a1d12,#b5330f,#c98a12,#1E5F8C)", backgroundSize: "300% 300%", animation: "auroraShift 10s ease infinite", opacity: 0.42 }} />}
          {detail.unlocked && <div style={{ position: "absolute", left: "50%", top: "50%", width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: "50%", background: `radial-gradient(circle, ${TIERS[detail.tier].rim}aa, transparent 65%)`, animation: "orbPulse 3.2s ease-in-out infinite", filter: "blur(3px)" }} />}
          {detail.unlocked && <div style={{ position: "absolute", left: "50%", top: "50%", width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: "50%", border: `2px solid ${TIERS[detail.tier].rim}`, animation: "forgeRing 1.1s ease-out forwards" }} />}
          {detail.earned && Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${15 + Math.random() * 60}%`, width: 5, height: 5, borderRadius: "50%", background: "#ffd9a0", boxShadow: "0 0 7px #ffd9a0", animation: `twinkle ${1.5 + Math.random() * 2}s ${Math.random() * 1.5}s infinite` }} />
          ))}
          <div style={{ textAlign: "center", animation: "popIn .55s", position: "relative" }}>
            {detail.unlocked && <div style={{ ...mono, fontSize: 12, letterSpacing: ".24em", color: "#ffb59f", marginBottom: 12, animation: "fadeUp .6s both" }}>✦ MARK UNLOCKED ✦</div>}
            <div style={{ position: "relative", width: 168, height: 168, margin: "0 auto 6px", animation: detail.unlocked ? "dropIn .7s cubic-bezier(.2,.9,.2,1.2) both, floatMed 3.5s ease-in-out .7s infinite" : detail.earned ? "floatMed 3.5s ease-in-out infinite" : "none" }}>
              <Medallion icon={detail.icon} tier={detail.tier} earned={detail.earned} progress={detail.progress} size={168} />
              {detail.earned && (
                <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 1%,93% 25%,93% 75%,50% 99%,7% 75%,7% 25%)", overflow: "hidden", pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, width: "45%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)", animation: "shineSweep 2.2s ease-in-out infinite" }} />
                </div>
              )}
            </div>
            <div style={{ ...serif, fontSize: 30, fontWeight: 800, color: C.paper, marginTop: 8 }}>{detail.name}</div>
            <div style={{ display: "inline-block", ...mono, fontSize: 10, letterSpacing: ".12em", color: "#0d0b07", background: TIERS[detail.tier].rim, borderRadius: 999, padding: "3px 11px", margin: "8px 0" }}>{TIERS[detail.tier].label.toUpperCase()}</div>
            <p style={{ fontSize: 14.5, color: "#e6ddd2", maxWidth: "30ch", margin: "4px auto 0", lineHeight: 1.5 }}>{detail.desc}</p>
            {!detail.earned && detail.progress > 0 && (
              <div style={{ maxWidth: 220, margin: "14px auto 0" }}>
                <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.15)", overflow: "hidden" }}><div style={{ width: `${Math.round(detail.progress * 100)}%`, height: "100%", background: C.accent, animation: "grow 1s cubic-bezier(.2,.7,.2,1) both" }} /></div>
                <div style={{ ...mono, fontSize: 11, color: "#cdbfae", marginTop: 6 }}>{detail.info}</div>
              </div>
            )}
            <div style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 22, letterSpacing: ".1em" }}>tap anywhere to close</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ REFUEL (food reward playground) ============================ */
const FOODS = [
  { e: "🍛", n: "Katsu curry", zh: "咖喱猪排", k: 700, c: "Comfort" },
  { e: "🌶️", n: "Kung Pao chicken", zh: "宫保鸡丁", k: 430, c: "Chinese" },
  { e: "🥘", n: "Mapo tofu", zh: "麻婆豆腐", k: 340, c: "Chinese" },
  { e: "🥟", n: "Dumplings ×6", zh: "饺子", k: 250, c: "Chinese" },
  { e: "🍜", n: "Ramen", zh: "拉面", k: 500, c: "Comfort" },
  { e: "🍝", n: "Pasta bowl", zh: "意面", k: 450, c: "Comfort" },
  { e: "🍕", n: "Pizza slice", zh: "披萨", k: 285, c: "Comfort" },
  { e: "🍚", n: "Rice bowl", zh: "米饭", k: 200, c: "Staples" },
  { e: "🍗", n: "Chicken breast", zh: "鸡胸肉", k: 165, c: "Protein" },
  { e: "🍳", n: "Two eggs", zh: "鸡蛋", k: 150, c: "Protein" },
  { e: "🍣", n: "Sushi ×6", zh: "寿司", k: 250, c: "Protein" },
  { e: "🍨", n: "Gelato scoop", zh: "冰淇淋", k: 140, c: "Sweet" },
  { e: "🍫", n: "Chocolate ×4", zh: "巧克力", k: 110, c: "Sweet" },
  { e: "🧋", n: "Bubble tea", zh: "珍珠奶茶", k: 350, c: "Sweet" },
  { e: "🥐", n: "Croissant", zh: "可颂", k: 270, c: "Sweet" },
  { e: "🍌", n: "Banana", zh: "香蕉", k: 105, c: "Staples" },
];
const CUISINES = ["All", "Chinese", "Comfort", "Sweet", "Protein", "Staples"];
const RECIPES = [
  { id: "katsu", name: "Katsu Set", zh: "咖喱套餐", art: "🍛🍚", tone: ["#E8A468", "#8A4F27"], desc: "The full comfort套餐 — curry over rice.", need: ["Katsu curry", "Rice bowl"] },
  { id: "sichuan", name: "Sichuan Night", zh: "川味之夜", art: "🌶️🥘🍚", tone: ["#E2441F", "#8a1f0c"], desc: "Numb, spicy, glorious — 麻辣鲜香.", need: ["Kung Pao chicken", "Mapo tofu", "Rice bowl"] },
  { id: "carb", name: "Carb Loader", zh: "碳水加载", art: "🍝🍚🍌", tone: ["#C98A12", "#8a5e0b"], desc: "Pre-race ritual — top off the tank.", need: ["Pasta bowl", "Rice bowl", "Banana"] },
  { id: "recovery", name: "Recovery Bowl", zh: "恢复餐", art: "🍗🍳🍚", tone: ["#2F7D52", "#1c4d33"], desc: "Protein + carbs = repair mode on.", need: ["Chicken breast", "Two eggs", "Rice bowl"] },
  { id: "sweet", name: "Sweet Escape", zh: "甜蜜逃脱", art: "🍨🍫🧋", tone: ["#d46aa0", "#8a3f66"], desc: "Zero regrets, all serotonin.", need: ["Gelato scoop", "Chocolate ×4", "Bubble tea"] },
  { id: "tasting", name: "Asian Tasting", zh: "亚洲拼盘", art: "🥟🍣", tone: ["#1E5F8C", "#123a55"], desc: "Dumplings and sushi, side by side.", need: ["Dumplings ×6", "Sushi ×6"] },
  { id: "noodle", name: "Noodle Comfort", zh: "面食安慰", art: "🍜🥟", tone: ["#C77E4A", "#7a4a28"], desc: "A rainy-day classic.", need: ["Ramen", "Dumplings ×6"] },
  { id: "breakfast", name: "Champion's Breakfast", zh: "冠军早餐", art: "🥐🍳🍌", tone: ["#caa24a", "#7d6116"], desc: "Fuel the morning long run.", need: ["Croissant", "Two eggs", "Banana"] },
  { id: "feast", name: "Grand Feast", zh: "满汉全席", art: "🍛🌶️🍜🍨", tone: ["#E2441F", "#C98A12"], desc: "Six dishes or more — a legend's table.", min: 6 },
];
const recipeMatch = (r, plate) => (r.min ? plate.length >= r.min : r.need.every((nm) => plate.some((p) => p.n === nm)));
function Refuel() {
  const W = 50.5;
  const [min, setMin] = useState(40);
  const [intensity, setIntensity] = useState("easy");
  const met = intensity === "easy" ? 9 : intensity === "steady" ? 11 : 13;
  const kcal = Math.round(met * W * (min / 60));
  const [cuisine, setCuisine] = useState("All");
  const [plate, setPlate] = useState([]);
  const plateK = plate.reduce((a, p) => a + p.k, 0);
  const add = (f) => setPlate((p) => (p.length >= 22 ? p : [...p, { ...f, id: Math.random() }]));
  const remove = (id) => setPlate((p) => p.filter((x) => x.id !== id));
  const clear = () => setPlate([]);
  const [saved, setSaved] = useState([]);
  const [pname, setPname] = useState("");
  const [unlocked, setUnlocked] = useState([]);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    store.get("refuel-saved").then((d) => { if (Array.isArray(d)) setSaved(d); });
    store.get("refuel-recipes").then((d) => { if (Array.isArray(d)) setUnlocked(d); });
  }, []);
  useEffect(() => {
    const matched = RECIPES.filter((r) => recipeMatch(r, plate)).map((r) => r.id);
    const fresh = matched.filter((id) => !unlocked.includes(id));
    if (fresh.length) {
      const next = [...unlocked, ...fresh];
      setUnlocked(next); store.set("refuel-recipes", next);
      const r = RECIPES.find((x) => x.id === fresh[0]);
      setToast(r); setTimeout(() => setToast(null), 3200);
    }
  }, [plate, unlocked]);
  const savePlate = () => {
    if (!plate.length) return;
    const item = { name: pname.trim() || "My plate", items: plate.map(({ e, n, zh, k }) => ({ e, n, zh, k })), k: plateK, ts: Date.now() };
    const next = [item, ...saved].slice(0, 12);
    setSaved(next); store.set("refuel-saved", next); setPname("");
  };
  const recall = (it) => setPlate(it.items.map((f) => ({ ...f, id: Math.random() })));
  const del = (ts) => { const next = saved.filter((s) => s.ts !== ts); setSaved(next); store.set("refuel-saved", next); };
  const surprise = () => {
    const themes = { Chinese: ["宫保鸡丁", "麻婆豆腐", "饺子", "米饭"], Comfort: ["Katsu curry", "Ramen"], Sweet: ["Gelato scoop", "Bubble tea", "Croissant"], Protein: ["Chicken breast", "Two eggs", "Sushi ×6"] };
    const keys = Object.keys(themes); const t = keys[Math.floor(Math.random() * keys.length)];
    const picks = FOODS.filter((f) => themes[t].includes(f.n) || themes[t].includes(f.zh));
    setPlate(picks.map((f) => ({ ...f, id: Math.random() })));
  };
  const menu = FOODS.filter((f) => cuisine === "All" || f.c === cuisine);
  const equivs = ["Chicken breast", "Gelato scoop", "Dumplings ×6", "Banana"].map((n) => { const f = FOODS.find((x) => x.n === n); return { ...f, q: Math.max(1, Math.round(kcal / f.k)) }; });
  const match = FOODS.reduce((best, f) => Math.abs(f.k - kcal) < Math.abs(best.k - kcal) ? f : best, FOODS[0]);
  const feast = plate.length >= 5;
  const msg = plate.length === 0 ? "Tap any dish to start building the plate you're craving."
    : plate.length <= 2 ? "A nice little bite. 🍴"
    : plate.length <= 4 ? "A solid, satisfying plate."
    : "A proper feast — fuel like an athlete and enjoy every bite! 🎉";

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 70, pointerEvents: "none", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.ink, color: C.paper, borderRadius: 14, padding: "10px 16px", boxShadow: "0 14px 30px -12px rgba(0,0,0,.5)", animation: "popIn .4s" }}>
            <span style={{ fontSize: 22 }}>{toast.art}</span>
            <div><div style={{ ...mono, fontSize: 10, color: "#ffb59f", letterSpacing: ".14em" }}>RECIPE UNLOCKED</div><div style={{ fontWeight: 700, fontSize: 14 }}>{toast.name} <span style={{ color: "#cdbfae", fontWeight: 400 }}>{toast.zh}</span></div></div>
          </div>
        </div>
      )}
      <SectionTitle n="01">Your run, on a plate</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>A playful look at the energy your body powers through — running runs on fuel, so this is a <b style={{ color: C.deep }}>celebration</b>, not a budget to balance.</p>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["easy", "Easy"], ["steady", "Steady"], ["hard", "Hard"]].map(([k, l]) => (
            <button key={k} onClick={() => setIntensity(k)} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${intensity === k ? C.accent : C.line}`, background: intensity === k ? C.accent : "transparent", color: intensity === k ? "#fff" : C.soft }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: C.soft, marginBottom: 6 }}><span>RUN DURATION</span><b style={{ color: C.ink }}>{min} min</b></div>
        <input type="range" min={10} max={150} value={min} onChange={(e) => setMin(+e.target.value)} style={{ width: "100%", marginBottom: 16 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ ...serif, fontSize: 50, fontWeight: 800, color: C.accent, lineHeight: 1 }}>🔋 <CountUp value={kcal} /></div>
          <div style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".1em", marginTop: 4 }}>KCAL OF MOVEMENT POWERED</div>
        </div>
      </Card>

      <p style={{ ...mono, fontSize: 11, color: C.soft, margin: "4px 0 10px", letterSpacing: ".08em" }}>THAT'S ROUGHLY…</p>
      <Card style={{ padding: 18, marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 60, animation: "dropIn .6s both" }}>{match.e}</div>
        <div style={{ ...serif, fontSize: 22, fontWeight: 700, marginTop: 4 }}>a whole {match.n}</div>
        {match.zh && <div style={{ ...mono, fontSize: 13, color: C.soft }}>{match.zh}</div>}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(76px,1fr))", gap: 10, marginBottom: 18 }}>
        {equivs.map((f, i) => (
          <div key={f.n} style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 6px", animation: `dropIn .5s ${i * 0.08}s both` }}>
            <div style={{ fontSize: 26 }}>{f.e}</div>
            <div style={{ ...serif, fontSize: 18, fontWeight: 700, color: C.accent }}>×{f.q}</div>
            <div style={{ ...mono, fontSize: 9, color: C.soft }}>{f.n.replace(/ ×.*/, "")}</div>
          </div>
        ))}
      </div>

      <SectionTitle n="02"><span style={{ marginTop: 8, display: "inline-block" }}>Compose your craving</span></SectionTitle>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {CUISINES.map((c) => (
          <button key={c} onClick={() => setCuisine(c)} style={{ ...mono, fontSize: 11.5, padding: "6px 11px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${cuisine === c ? C.accent : C.line}`, background: cuisine === c ? C.accent : "transparent", color: cuisine === c ? "#fff" : C.soft }}>{c}</button>
        ))}
        <button onClick={surprise} style={{ ...mono, fontSize: 11.5, padding: "6px 11px", borderRadius: 999, cursor: "pointer", border: "none", background: "linear-gradient(120deg,#E2441F,#C98A12)", color: "#fff", marginLeft: "auto" }}>🎲 Surprise me</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10, marginBottom: 16 }}>
        {menu.map((f) => (
          <button key={f.n} className="food" onClick={() => add(f)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 6px", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>{f.e}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 4, color: C.ink }}>{f.n}</div>
            <div style={{ ...mono, fontSize: 9.5, color: C.soft }}>{f.zh}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "linear-gradient(160deg,#FBF8F1,#F1E9D8)", border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, position: "relative", overflow: "hidden", minHeight: 150 }}>
        {feast && Array.from({ length: 8 }).map((_, i) => (<span key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 70}%`, fontSize: 14, animation: `twinkle ${1.4 + Math.random() * 1.5}s ${Math.random()}s infinite` }}>✨</span>))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ ...mono, fontSize: 11, color: C.soft, letterSpacing: ".1em" }}>YOUR PLATE 🍽️</span>
          {plate.length > 0 && <button onClick={clear} style={{ ...mono, fontSize: 11, color: C.accent, background: "transparent", border: "none", cursor: "pointer" }}>clear</button>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 50, alignItems: "center" }}>
          {plate.length === 0 ? <span style={{ fontSize: 13, color: C.soft }}>Empty plate — tap dishes above to pile it up.</span>
            : plate.map((p) => (
              <button key={p.id} onClick={() => remove(p.id)} title="remove" style={{ fontSize: 34, background: "transparent", border: "none", cursor: "pointer", animation: "dropIn .45s both", lineHeight: 1 }}>{p.e}</button>
            ))}
        </div>
        <div style={{ borderTop: `1px dashed ${C.line}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, maxWidth: "62%" }}>{msg}</span>
          <span style={{ ...serif, fontSize: 22, fontWeight: 700, color: C.deep }}>~{plateK}<span style={{ fontSize: 12, color: C.soft }}> kcal</span></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 14 }}>
        <input value={pname} onChange={(e) => setPname(e.target.value)} placeholder="name this plate — e.g. post-long-run feast"
          style={{ flex: 1, padding: "11px 13px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
        <button onClick={savePlate} disabled={!plate.length} style={{ background: plate.length ? C.accent : C.line, color: "#fff", border: "none", borderRadius: 12, padding: "0 18px", cursor: plate.length ? "pointer" : "default", ...mono, fontSize: 13, fontWeight: 600 }}>Save</button>
      </div>
      {saved.length > 0 && (
        <>
          <p style={{ ...mono, fontSize: 11, color: C.soft, margin: "4px 0 8px", letterSpacing: ".08em" }}>GO-TO MEALS — one tap to recall</p>
          <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
            {saved.map((it) => (
              <div key={it.ts} style={{ display: "flex", alignItems: "center", gap: 11, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 14px" }}>
                <div style={{ fontSize: 19, letterSpacing: "-3px" }}>{it.items.slice(0, 5).map((f) => f.e).join("")}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div><div style={{ ...mono, fontSize: 10, color: C.soft }}>{it.items.length} dishes · ~{it.k} kcal</div></div>
                <button onClick={() => recall(it)} style={{ ...mono, fontSize: 12, fontWeight: 600, color: "#fff", background: C.green, border: "none", borderRadius: 999, padding: "7px 13px", cursor: "pointer" }}>Recall</button>
                <button onClick={() => del(it.ts)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.soft, display: "grid", placeItems: "center" }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle n="03"><span style={{ marginTop: 8, display: "inline-block" }}>Recipe cards</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Build certain combos on your plate to unlock collectible cards. <b style={{ color: C.deep }}>{unlocked.length}/{RECIPES.length}</b> discovered.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 14 }}>
        {RECIPES.map((r) => {
          const got = unlocked.includes(r.id);
          return (
            <div key={r.id} style={{ borderRadius: 16, padding: 14, color: "#fff", position: "relative", overflow: "hidden", minHeight: 122,
              background: got ? `linear-gradient(150deg,${r.tone[0]},${r.tone[1]})` : "#EDE7D9", border: got ? "none" : `1px dashed ${C.soft}`, animation: got ? "popIn .5s both" : "none" }}>
              {got ? (
                <>
                  <div style={{ fontSize: 30, letterSpacing: "-2px" }}>{r.art}</div>
                  <div style={{ ...serif, fontSize: 18, fontWeight: 800, marginTop: 6 }}>{r.name}</div>
                  <div style={{ ...mono, fontSize: 11, opacity: .85 }}>{r.zh}</div>
                  <div style={{ fontSize: 11.5, marginTop: 6, opacity: .92, lineHeight: 1.4 }}>{r.desc}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 30, filter: "grayscale(1)", opacity: .4 }}>{r.art}</div>
                  <div style={{ ...serif, fontSize: 18, fontWeight: 800, marginTop: 6, color: C.soft }}>?????</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: C.soft, lineHeight: 1.4 }}>{r.min ? `Pile up ${r.min}+ dishes` : `Needs ${r.need.map((n) => FOODS.find((f) => f.n === n)?.e).join(" ")}`}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 14 }}>
        <b style={{ color: C.ink }}>Food is fuel and joy.</b> Beyond your run, your body spends well over 1,300 kcal a day just being you — eating well powers recovery and performance. This is a fun visualiser, never a target to hit or stay under. Energy figures are rough estimates for play.
      </div>
    </div>
  );
}

/* ============================ PROGRESSION: XP · LEVELS · QUESTS · WRAPPED ============================ */
function levelInfo(xp) {
  let lvl = 1, need = 150, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 150 + (lvl - 1) * 120; }
  return { lvl, into: Math.round(xp - acc), span: need, pct: Math.max(0, Math.min(1, (xp - acc) / need)) };
}
const titleFor = (l) => l < 2 ? "Rookie" : l < 4 ? "Pacer" : l < 6 ? "Strider" : l < 9 ? "Tempo Runner" : l < 12 ? "Threshold Beast" : l < 16 ? "Aerobic Engine" : l < 20 ? "The Diesel" : l < 25 ? "Racer" : l < 30 ? "Elite" : "Legend";
const baseXP = (sessions, recipesCount, routesCount, prCount = 0) => {
  const st = computeStats(sessions || [], recipesCount || 0, routesCount || 0, prCount || 0);
  const marks = evaluateBadges(st).filter((b) => b.earned).length;
  return (sessions ? sessions.length : 0) * 20 + marks * 100 + (recipesCount || 0) * 60 + st.streak * 10 + (prCount || 0) * 150;
};
const QUEST_POOL = [
  { id: "log", label: "Log any session today", xp: 50, icon: NotebookPen },
  { id: "easy", label: "Run easy in Zone 2", xp: 40, icon: Heart },
  { id: "green", label: "Reach green readiness", xp: 35, icon: Activity },
  { id: "fuel", label: "Tick your fuel checklist", xp: 30, icon: Utensils },
  { id: "recipe", label: "Discover a recipe card", xp: 45, icon: UtensilsCrossed },
  { id: "strength", label: "Do a short strength set", xp: 40, icon: Zap },
  { id: "mobility", label: "5 min of mobility / stretching", xp: 25, icon: Wind },
  { id: "rest", label: "Honour a rest day if you need it", xp: 30, icon: Moon },
  { id: "sleep", label: "Aim for 7h+ sleep tonight", xp: 35, icon: BedDouble },
  { id: "long", label: "Bank a longer run this week", xp: 60, icon: Mountain },
  { id: "stride", label: "Add 4× short strides after an easy run", xp: 45, icon: TrendingUp },
  { id: "breathe", label: "Take a mindful Runner's High moment", xp: 25, icon: Sparkles },
];
function dailyQuests(dateKey) {
  let s = [...dateKey].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pool = [...QUEST_POOL], out = [];
  for (let i = 0; i < 3 && pool.length; i++) { s = (s * 9301 + 49297) % 233280; out.push(pool.splice(s % pool.length, 1)[0]); }
  return out;
}

function Wrapped({ sessions, recipes, routes, onClose }) {
  const st = computeStats(sessions);
  const marks = evaluateBadges(st).filter((b) => b.earned).length;
  const days = new Set(sessions.map((s) => s.date)).size;
  const km = Math.round(st.estKm), longest = Math.round(st.longRunKm);
  const bySport = {}; sessions.forEach((s) => { bySport[s.sport] = (bySport[s.sport] || 0) + 1; });
  const top = Object.entries(bySport).sort((a, b) => b[1] - a[1])[0] || ["movement", 0];
  const L = levelInfo(baseXP(sessions, recipes, routes));
  const slides = [
    { bg: ["#17150F", "#3a1d12"], kicker: "YOUR STRIDE SEASON", big: "✨", sub: "", lines: ["A look back at how you moved."] },
    { bg: ["#3a1d12", "#b5330f"], kicker: "YOU SHOWED UP", big: days, sub: "days of movement", lines: [] },
    { bg: ["#b5330f", "#E2441F"], kicker: "DISTANCE POWERED", big: km, prefix: "~", sub: "kilometres (est.)", lines: [] },
    { bg: ["#1c4d33", "#2F7D52"], kicker: "YOUR LONGEST", big: longest, prefix: "~", sub: "km in a single run", lines: [] },
    { bg: ["#123a55", "#1E5F8C"], kicker: "TOP DISCIPLINE", big: top[0], sub: `${top[1]} sessions`, lines: [] },
    { bg: ["#7d6116", "#C98A12"], kicker: "YOUR COLLECTION", big: marks, sub: `Marks · ${recipes} recipes · ${routes || 0} routes`, lines: [] },
    { bg: ["#3a1d12", "#E2441F"], kicker: `LEVEL ${L.lvl}`, big: titleFor(L.lvl), sub: "", lines: ["Here's to the next mile.", "tap to close"] },
  ];
  const [i, setI] = useState(0);
  useEffect(() => { if (i >= slides.length - 1) return; const id = setTimeout(() => setI(i + 1), 3300); return () => clearTimeout(id); }, [i]);
  const s = slides[i];
  const isNum = typeof s.big === "number";
  const next = () => { if (i >= slides.length - 1) onClose(); else setI(i + 1); };
  return (
    <div onClick={next} style={{ position: "fixed", inset: 0, zIndex: 90, cursor: "pointer", background: `linear-gradient(160deg,${s.bg[0]},${s.bg[1]})`, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 30, transition: "background .6s" }}>
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", gap: 5 }}>
        {slides.map((_, k) => (<div key={k} style={{ flex: 1, height: 3, borderRadius: 9, background: "rgba(255,255,255,.25)", overflow: "hidden" }}><div style={{ height: "100%", background: "#fff", width: k <= i ? "100%" : "0%", transition: "width .35s" }} /></div>))}
      </div>
      <div key={i} style={{ textAlign: "center", animation: "popIn .6s" }}>
        <div style={{ ...mono, fontSize: 13, letterSpacing: ".26em", color: "rgba(255,255,255,.82)" }}>{s.kicker}</div>
        <div style={{ ...serif, fontSize: isNum ? 100 : 52, fontWeight: 900, lineHeight: 1, margin: "16px 0" }}>{s.prefix || ""}{isNum ? <CountUp value={s.big} /> : s.big}</div>
        {s.sub && <div style={{ ...mono, fontSize: 16, color: "rgba(255,255,255,.88)" }}>{s.sub}</div>}
        {s.lines.map((l, k) => (<div key={k} style={{ fontSize: 15, color: "rgba(255,255,255,.82)", marginTop: 8 }}>{l}</div>))}
      </div>
      <div style={{ position: "absolute", bottom: 24, ...mono, fontSize: 11, color: "rgba(255,255,255,.6)", letterSpacing: ".1em" }}>tap to continue</div>
    </div>
  );
}

/* ============================ TRAINING GARDEN (grows, never wilts) ============================ */
const GARDEN_STAGES = [
  { t: 0, n: "Seed" }, { t: 1, n: "Sprout" }, { t: 5, n: "Sapling" },
  { t: 12, n: "Young tree" }, { t: 25, n: "In leaf" }, { t: 45, n: "Flourishing" }, { t: 70, n: "In bloom" },
];
function Garden() {
  const [sessions, setSessions] = useState([]);
  const [g, setG] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [bloom, setBloom] = useState(null);
  useEffect(() => { store.get("sport-log").then((d) => { setSessions(Array.isArray(d) ? d : []); setLoaded(true); }); }, []);
  const n = sessions.length;
  const dset = new Set(sessions.map((s) => s.date));
  const days = dset.size;
  const sports = new Set(sessions.map((s) => s.sport)).size;
  let streak = 0; const dd = new Date(); if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1);
  while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  let si = 0; for (let i = 0; i < GARDEN_STAGES.length; i++) if (n >= GARDEN_STAGES[i].t) si = i;
  useEffect(() => {
    if (!loaded) return;
    store.get("garden-stage").then((prev) => { if (typeof prev === "number" && si > prev) setBloom(GARDEN_STAGES[si].n); store.set("garden-stage", si); });
  }, [loaded]);
  const cur = GARDEN_STAGES[si], nxt = GARDEN_STAGES[si + 1];
  const frac = nxt ? (n - cur.t) / (nxt.t - cur.t) : 1;
  const target = Math.min(1, (si + (nxt ? frac : 0)) / (GARDEN_STAGES.length - 1));
  useEffect(() => { let raf; const start = performance.now(); const tick = (t) => { const p = Math.min(1, (t - start) / 1100); const e = 1 - Math.pow(1 - p, 3); setG(target * e); if (p < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [target]);
  const baseY = 206, cx = 160;
  const trunkH = 14 + g * 80, tw = 5 + g * 9, topY = baseY - trunkH;
  const cR = 9 + g * 50;
  const green = g < 0.4 ? "#7DB36A" : g < 0.75 ? "#5A9D4E" : "#2F7D52";
  const canopy = g < 0.12
    ? [[-6, 4, 6], [6, 4, 6]]
    : [[0, -cR * 0.5, cR], [-cR * 0.72, -cR * 0.12, cR * 0.82], [cR * 0.72, -cR * 0.12, cR * 0.82], [0, -cR * 1.02, cR * 0.78]];
  const blossom = streak >= 3;
  const blossomCols = [C.accent, "#E78", C.amber];
  const flowerN = Math.min(9, Math.floor(days / 3));
  const flowerCols = ["#E2441F", "#C98A12", "#1E5F8C", "#E78", "#2F7D52"];
  return (
    <div>
      <SectionTitle n="01">Your training garden</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <svg viewBox="0 0 320 230" style={{ width: "100%", display: "block" }}>
          <defs>
            <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FCEFD9" /><stop offset="100%" stopColor="#F4F0E7" /></linearGradient>
            <radialGradient id="gsun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFD27A" /><stop offset="100%" stopColor="#FFD27A" stopOpacity="0" /></radialGradient>
          </defs>
          <rect x="0" y="0" width="320" height="230" fill="url(#gsky)" />
          <circle cx="262" cy="50" r="40" fill="url(#gsun)" style={{ animation: "orbPulse 6s ease-in-out infinite", transformOrigin: "262px 50px" }} />
          <circle cx="262" cy="50" r="17" fill="#F6B64C" />
          <path d="M0,206 Q160,180 320,206 L320,230 L0,230 Z" fill="#9CC487" />
          <path d="M0,214 Q160,194 320,214 L320,230 L0,230 Z" fill="#7FB070" />
          {Array.from({ length: flowerN }).map((_, i) => { const x = 26 + (i * 268) / Math.max(1, flowerN - 1) + (i % 2 ? 6 : -6); const fy = 210 + (i % 3) * 4; const c = flowerCols[i % flowerCols.length]; return (<g key={"f" + i}><line x1={x} y1={fy} x2={x} y2={fy - 9} stroke="#5A9D4E" strokeWidth="1.6" /><circle cx={x} cy={fy - 11} r="3.4" fill={c} /><circle cx={x} cy={fy - 11} r="1.3" fill="#FCEFD9" /></g>); })}
          <g style={{ animation: "floatMed 5.5s ease-in-out infinite", transformOrigin: `${cx}px ${baseY}px` }}>
            <rect x={cx - tw / 2} y={topY} width={tw} height={trunkH} rx={tw / 2} fill="#7a5230" />
            {canopy.map(([dx, dy, r], i) => (<circle key={i} cx={cx + dx} cy={topY + dy} r={r} fill={green} opacity={0.92 - i * 0.04} />))}
            {blossom && g > 0.2 && canopy.slice(0, 3).flatMap(([dx, dy, r], i) => [0, 1, 2].map((j) => (<circle key={i + "" + j} cx={cx + dx + (j - 1) * r * 0.5} cy={topY + dy - (j % 2) * r * 0.4} r="2.6" fill={blossomCols[(i + j) % blossomCols.length]} />)))}
          </g>
        </svg>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}` }}>
          <div><div style={{ ...serif, fontSize: 19, fontWeight: 700 }}>{cur.n}</div><div style={{ ...mono, fontSize: 10.5, color: C.soft }}>{nxt ? `${GARDEN_STAGES[si + 1].t - n} more session${GARDEN_STAGES[si + 1].t - n === 1 ? "" : "s"} → ${nxt.n}` : "fully grown — and still growing"}</div></div>
          <div style={{ ...serif, fontSize: 30, fontWeight: 800, color: green }}>{Math.round(g * 100)}<span style={{ fontSize: 13, color: C.soft }}>%</span></div>
        </div>
      </Card>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4,1fr)", margin: "12px 0" }}>
        {[["Sessions", n], ["Days", days], ["Streak", streak + "d"], ["Sports", sports]].map(([k, v]) => (
          <div key={k} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}><div style={{ ...serif, fontSize: 22, fontWeight: 800 }}>{v}</div><div style={{ ...mono, fontSize: 9, color: C.soft, letterSpacing: ".06em", textTransform: "uppercase" }}>{k}</div></div>
        ))}
      </div>
      <div style={{ background: "rgba(47,125,82,.08)", border: `1px solid ${C.green}55`, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: C.soft, lineHeight: 1.55 }}>
        <b style={{ color: C.green }}>Your garden only ever grows.</b> Every run, climb, ride and skate feeds it — and rest days are sunlight, never setbacks. 🏃 sessions grow the tree · 🌈 variety brings flowers · 🔥 a streak makes it blossom · 🌙 rest lets it breathe.
      </div>
      {bloom && <BloomBurst stage={bloom} onClose={() => setBloom(null)} />}
    </div>
  );
}

/* ============================ WEEKLY FORM REPORT ============================ */
function WeeklyReport({ sessions }) {
  const [note, setNote] = useState(""); const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false);
  const now = Date.now();
  const inWindow = (a, b) => sessions.filter((s) => { const t = Date.parse(s.date); return t >= now - b * 864e5 && t < now - a * 864e5; });
  const wk = inWindow(0, 7), prev = inWindow(7, 14);
  const runKm = (arr) => arr.filter((s) => s.sport === "Run").reduce((a, s) => a + (+s.minutes || 0), 0) / 6.33;
  const km = runKm(wk), pkm = runKm(prev), dkm = km - pkm;
  const days = new Set(wk.map((s) => s.date)).size;
  const sports = new Set(wk.map((s) => s.sport)).size;
  const longest = wk.filter((s) => s.sport === "Run").reduce((m, s) => Math.max(m, (+s.minutes || 0) / 6.33), 0);
  const bars = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10); const mins = sessions.filter((s) => s.date === key).reduce((a, s) => a + (+s.minutes || 0), 0); bars.push({ d: "SMTWTFS"[d.getDay()], min: Math.round(mins) }); }
  const hasQuality = wk.some((s) => /(threshold|interval|tempo|vo2|quality|speed|track)/i.test(((s.note || "") + " " + (s.type || "") + " " + (s.label || "")).toLowerCase()));
  const empty = wk.length === 0;
  const highlight = longest >= 15 ? `A ${longest.toFixed(0)} km long run anchored the week — real endurance work.`
    : days >= 5 ? `${days} active days this week — your consistency is the whole story.`
    : sports >= 3 ? `${sports} different sports — lovely athletic variety.`
    : `${wk.length} session${wk.length === 1 ? "" : "s"} banked — every one counts.`;
  const watch = !hasQuality ? "Still almost all easy — no threshold or VO₂ work logged. That top-end gear remains your biggest open opportunity."
    : km > 48 ? "Big mileage week — protect your sleep and keep at least one genuinely easy day."
    : days <= 1 ? "A quiet week — perfectly fine if it was intentional recovery." : "Load looks well balanced — nothing flagging.";
  const focus = "Slot one Threshold 4×5′ from the Guided tab, and protect 7.5 h sleep on the nights around it.";
  const coachNote = async () => {
    setLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 320,
          system: "You are STRIDE's running coach writing a short, warm weekly note (2-3 sentences) to a London runner training for a sub-1:45 half on 20 June. Be specific, encouraging, never preachy. No lists, no preamble.",
          messages: [{ role: "user", content: `This week: ${wk.length} sessions, ~${km.toFixed(0)} km running, ${days} active days, ${sports} sports, longest run ~${longest.toFixed(0)} km, ${hasQuality ? "included" : "no"} quality work. Last week was ~${pkm.toFixed(0)} km. Write the note.` }] }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      setNote(text || "Couldn't reach the coach just now — your numbers above tell the story.");
    } catch (e) { setNote("Couldn't reach the coach just now — your numbers above tell the story."); }
    finally { setLoading(false); }
  };
  const wrap = (str, n) => { const words = str.split(" "); const lines = []; let cur = ""; words.forEach((w) => { if ((cur + " " + w).trim().length > n) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }); if (cur.trim()) lines.push(cur.trim()); return lines; };
  const poster = () => {
    const dl = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const stats = [["KM", km.toFixed(0)], ["SESSIONS", String(wk.length)], ["ACTIVE DAYS", String(days)], ["SPORTS", String(sports)]];
    const cards = stats.map((s, i) => { const x = i % 2 === 0 ? 70 : 555; const y = i < 2 ? 470 : 740; return `<rect x="${x}" y="${y}" width="455" height="240" rx="26" fill="#FBF8F1"/><text x="${x + 227}" y="${y + 138}" text-anchor="middle" font-family="Georgia,serif" font-size="120" font-weight="800" fill="#17150F">${s[1]}</text><text x="${x + 227}" y="${y + 188}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="26" letter-spacing="4" fill="#4A463C">${s[0]}</text>`; }).join("");
    const hl = wrap(highlight, 34).map((l, i) => `<tspan x="540" dy="${i === 0 ? 0 : 58}">${l.replace(/&/g, "&amp;")}</tspan>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><radialGradient id="o" cx="50%" cy="0%" r="70%"><stop offset="0%" stop-color="#E2441F" stop-opacity="0.5"/><stop offset="100%" stop-color="#E2441F" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1350" fill="#17150F"/><rect width="1080" height="640" fill="url(#o)"/><text x="70" y="150" font-family="Georgia,serif" font-size="64" font-weight="800" fill="#F4F0E7">STRIDE</text><text x="70" y="250" font-family="ui-monospace,monospace" font-size="30" letter-spacing="10" fill="#E2441F">WEEKLY REPORT</text><text x="70" y="305" font-family="ui-monospace,monospace" font-size="26" fill="#9c958a">Last 7 days · ${dl}</text>${cards}<text x="540" y="1040" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="44" fill="#FCEFD9">${hl}</text><text x="540" y="1285" text-anchor="middle" font-family="ui-monospace,monospace" font-size="24" letter-spacing="6" fill="#6b655c">PERSONAL RUNNING OS</text></svg>`;
  };
  const sharePNG = () => {
    setBusy(true);
    try {
      const blob = new Blob([poster()], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { const W = 1080, H = 1350, s = 2; const c = document.createElement("canvas"); c.width = W * s; c.height = H * s; const ctx = c.getContext("2d"); ctx.scale(s, s); ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); c.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "stride-weekly-report.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } setBusy(false); }, "image/png"); };
      img.onerror = () => setBusy(false); img.src = url;
    } catch (e) { setBusy(false); }
  };
  if (empty) return (<EmptyState icon={NotebookPen} title="No sessions this week" line="Log a few in the Log tab and your weekly report writes itself." />);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: ".12em", color: C.soft, marginBottom: 12 }}>LAST 7 DAYS</div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        {[["~km", km.toFixed(0)], ["sessions", wk.length], ["active days", days], ["sports", sports]].map(([k, v]) => (
          <div key={k} style={{ textAlign: "center" }}><div style={{ ...serif, fontSize: 24, fontWeight: 800 }}>{v}</div><div style={{ ...mono, fontSize: 8.5, color: C.soft, letterSpacing: ".05em", textTransform: "uppercase" }}>{k}</div></div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={bars}><defs><linearGradient id="wkBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F4794F" /><stop offset="100%" stopColor={C.accent} /></linearGradient></defs><XAxis dataKey="d" tick={{ ...mono, fontSize: 9, fill: C.soft }} /><YAxis hide /><Tooltip formatter={(v) => [v + " min", "load"]} contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} /><Bar dataKey="min" radius={[3, 3, 0, 0]} fill="url(#wkBar)" /></BarChart>
      </ResponsiveContainer>
      <div style={{ ...mono, fontSize: 11, color: dkm >= 0 ? C.green : C.soft, margin: "4px 0 14px" }}>{dkm >= 0 ? "▲" : "▼"} {Math.abs(dkm).toFixed(0)} km vs the week before</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ borderLeft: `4px solid ${C.green}`, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px" }}><div style={{ ...mono, fontSize: 9.5, color: C.green, letterSpacing: ".1em" }}>HIGHLIGHT</div><div style={{ fontSize: 13, marginTop: 2 }}>{highlight}</div></div>
        <div style={{ borderLeft: `4px solid ${C.amber}`, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px" }}><div style={{ ...mono, fontSize: 9.5, color: C.amber, letterSpacing: ".1em" }}>WATCH-OUT</div><div style={{ fontSize: 13, marginTop: 2 }}>{watch}</div></div>
        <div style={{ borderLeft: `4px solid ${C.accent}`, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 13px" }}><div style={{ ...mono, fontSize: 9.5, color: C.accent, letterSpacing: ".1em" }}>NEXT WEEK'S FOCUS</div><div style={{ fontSize: 13, marginTop: 2 }}>{focus}</div></div>
      </div>
      {note ? (
        <div style={{ marginTop: 12, background: "linear-gradient(135deg,#17150F,#3a1d12)", color: C.paper, borderRadius: 12, padding: "13px 16px", fontSize: 13, lineHeight: 1.55, animation: "fadeUp .4s both" }}><div style={{ ...mono, fontSize: 9.5, letterSpacing: ".12em", color: "#ffb59f", marginBottom: 5 }}>✷ COACH'S NOTE</div>{note}</div>
      ) : (
        <button onClick={coachNote} disabled={loading} style={{ marginTop: 12, width: "100%", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "11px", cursor: "pointer", color: C.deep, background: "transparent", ...mono, fontSize: 12.5, fontWeight: 600 }}>{loading ? "writing…" : "✷ Add a coach's note"}</button>
      )}
      <button onClick={sharePNG} disabled={busy} style={{ marginTop: 10, width: "100%", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", color: "#fff", background: C.ink, ...mono, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Download size={16} /> {busy ? "rendering…" : "Share this week as an image"}</button>
    </Card>
  );
}

/* ============================ GHOST LEADERBOARD ============================ */
const LB_METRICS = {
  km: { label: "Weekly km", better: "high", fmt: (v) => v.toFixed(0) + " km", ghosts: [{ n: "Weekend jogger", v: 14 }, { n: "Club runner", v: 30 }, { n: "Marathon block", v: 55 }, { n: "Elite amateur", v: 88 }] },
  vo2: { label: "VO₂ max", better: "high", fmt: (v) => v.toFixed(1), ghosts: [{ n: "You, last Nov", v: 37.7 }, { n: "Recreational", v: 42 }, { n: "Strong amateur", v: 50 }, { n: "Sub-37 5K", v: 58 }] },
  half: { label: "Half time", better: "low", fmt: (v) => fmtTime(v), ghosts: [{ n: "First half", v: 7200 }, { n: "Club pacer", v: 6600 }, { n: "Sub-1:45 goal", v: 6300 }, { n: "Fast club", v: 5700 }, { n: "Regional", v: 5100 }] },
  streak: { label: "Day streak", better: "high", fmt: (v) => v + "d", ghosts: [{ n: "Casual", v: 3 }, { n: "Committed", v: 10 }, { n: "Devoted", v: 21 }, { n: "Relentless", v: 45 }] },
};
function GhostLeaderboard({ sessions }) {
  const [m, setM] = useState("km");
  const now = Date.now();
  const wkKm = sessions.filter((s) => s.sport === "Run" && Date.parse(s.date) >= now - 7 * 864e5).reduce((a, s) => a + (+s.minutes || 0), 0) / 6.33;
  const dset = new Set(sessions.map((s) => s.date)); let streak = 0; const dd = new Date(); if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1); while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  const youVal = { km: wkKm, vo2: 48.9, half: Math.round(riegel(46 * 60 + 10, 10000, 21097.5)), streak }[m];
  const cfg = LB_METRICS[m];
  const rows = [...cfg.ghosts.map((g) => ({ ...g })), { n: "You", v: youVal, you: true }].sort((a, b) => cfg.better === "high" ? b.v - a.v : a.v - b.v);
  const myRank = rows.findIndex((r) => r.you);
  const above = rows[myRank - 1];
  const medal = ["🥇", "🥈", "🥉"];
  const gap = above ? (cfg.better === "high" ? above.v - youVal : youVal - above.v) : 0;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(LB_METRICS).map(([k, v]) => (
          <button key={k} onClick={() => setM(k)} style={{ ...mono, fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${m === k ? C.deep : C.line}`, background: m === k ? C.deep : "transparent", color: m === k ? "#fff" : C.soft }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map((r, i) => (
          <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 13, background: r.you ? `${C.accent}10` : C.card, border: `1.5px solid ${r.you ? C.accent : C.line}`, transform: r.you ? "scale(1.015)" : "none", animation: r.you ? "popIn .5s both" : "none" }}>
            <span style={{ width: 26, textAlign: "center", fontSize: i < 3 ? 17 : 13, ...mono, fontWeight: 700, color: C.soft }}>{i < 3 ? medal[i] : i + 1}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: r.you ? 800 : 500, color: r.you ? C.accent : C.ink }}>{r.n}{r.you ? " — that's you" : ""}</span>
            <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: r.you ? C.accent : C.soft }}>{cfg.fmt(r.v)}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "12px 16px", fontSize: 12.5, color: C.soft, marginTop: 12 }}>
        You're <b style={{ color: C.ink }}>#{myRank + 1} of {rows.length}</b> on {cfg.label.toLowerCase()}.{above ? ` ${cfg.fmt(gap < 0 ? 0 : gap)} ${cfg.better === "high" ? "more" : "faster"} catches ${above.n}.` : " Top of the board — nobody left to chase. 🏆"} Rivals are pace-setters to chase, not judges — including your own past self.
      </div>
    </div>
  );
}

/* ============================ TODAY'S ONE THING — home hero ============================ */
function TodayHero({ readiness, onGo }) {
  const [rec, setRec] = useState(null);
  useEffect(() => {
    store.get("goals").then((g) => {
      const future = (Array.isArray(g) ? g : []).filter((x) => Date.parse(x.date) >= Date.now() - 864e5).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
      const race = future[0];
      const days = race ? Math.ceil((Date.parse(race.date) - Date.now()) / 864e5) : null;
      const dow = new Date().getDay();
      let r;
      if (days != null && days <= 3) r = { icon: Crown, t: "Race week — trust the taper", w: `${days} day${days === 1 ? "" : "s"} to ${race.name}. Keep it short and sharp; freshness is the goal now.`, cta: "See your taper", go: "plan", col: C.blue };
      else if (readiness < 54) r = { icon: Moon, t: "Take it easy today", w: "Your readiness is down. An easy jog or a genuine rest day is the fastest way forward.", cta: "Check your body", go: "body", col: C.amber };
      else if (readiness >= 72 && (dow === 2 || dow === 4)) r = { icon: Zap, t: "You're primed — go quality", w: "Green readiness on a quality day. This is the moment for a Threshold 4×5′ — your missing gear.", cta: "Open the session", go: "train", col: C.accent };
      else if (dow === 6 || dow === 0) r = { icon: Mountain, t: "Long run day", w: "Weekend miles. Keep it easy and relaxed — patience builds the engine.", cta: "Plan a route", go: "routes", col: C.green };
      else if (readiness >= 72) r = { icon: TrendingUp, t: "Primed for a strong session", w: "You're fresh. A tempo or a few strides will nudge that top-end gear you've been missing.", cta: "Open Guided", go: "train", col: C.accent };
      else r = { icon: Heart, t: "Steady easy run", w: "A comfortable Zone 2 run today keeps the aerobic base quietly growing.", cta: "Check your zones", go: "zones", col: C.green };
      setRec(r);
    });
  }, [readiness]);
  if (!rec) return null;
  const I = rec.icon;
  return (
    <Card style={{ padding: 18, marginBottom: 14, borderLeft: `4px solid ${rec.col}`, background: `linear-gradient(120deg, ${rec.col}10, ${C.card} 62%)` }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: ".14em", color: rec.col, marginBottom: 9 }}>TODAY'S ONE THING</div>
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
        <span style={{ width: 46, height: 46, flex: "none", borderRadius: 13, background: rec.col, display: "grid", placeItems: "center", color: "#fff" }}><I size={23} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ ...serif, fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{rec.t}</div>
          <p style={{ fontSize: 13.5, color: C.soft, margin: "5px 0 0", lineHeight: 1.5 }}>{rec.w}</p>
        </div>
      </div>
      <button onClick={() => onGo(rec.go)} style={{ marginTop: 14, width: "100%", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", color: "#fff", background: rec.col, ...mono, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{rec.cta} <ChevronRight size={16} /></button>
    </Card>
  );
}

/* ============================ SEASONAL CHALLENGES ============================ */
function SeasonalChallenges({ sessions }) {
  const y = new Date().getFullYear();
  const monthRunKm = (mon) => sessions.filter((s) => s.sport === "Run" && new Date(s.date).getMonth() === mon && new Date(s.date).getFullYear() === y).reduce((a, s) => a + (+s.minutes || 0), 0) / 6.33;
  const dset = new Set(sessions.map((s) => s.date)); let streak = 0; const dd = new Date(); if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1); while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
  const qual = sessions.filter((s) => /(threshold|interval|tempo|vo2|quality|speed|track)/i.test(((s.note || "") + (s.type || "") + (s.label || "")).toLowerCase())).length;
  const daysTo = (iso) => Math.ceil((Date.parse(iso) - Date.now()) / 864e5);
  const CH = [
    { k: "race", title: "Road to 20 June", sub: "Race-ready sharpening", end: `${y}-06-20`, prog: qual, target: 3, unit: "quality sessions", xp: 300, col: C.accent, icon: Zap },
    { k: "june", title: "June 100K", sub: "Spring mileage block", end: `${y}-06-30`, prog: Math.round(monthRunKm(5)), target: 100, unit: "km in June", xp: 250, col: C.green, icon: Mountain },
    { k: "streak", title: "Two-Week Streak", sub: "Show up, day after day", end: null, prog: streak, target: 14, unit: "day streak", xp: 200, col: C.amber, icon: Flame },
  ];
  return (
    <div style={{ display: "grid", gap: 11 }}>
      {CH.map((c) => {
        const pct = Math.min(1, c.prog / c.target), done = c.prog >= c.target, dleft = c.end ? daysTo(c.end) : null, I = c.icon;
        return (
          <Card key={c.k} style={{ padding: 15, borderLeft: `4px solid ${c.col}`, opacity: dleft != null && dleft < 0 ? 0.55 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, flex: "none", borderRadius: 11, background: done ? c.col : `${c.col}1a`, display: "grid", placeItems: "center", color: done ? "#fff" : c.col }}>{done ? <Check size={19} /> : <I size={18} />}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...serif, fontSize: 17, fontWeight: 700, lineHeight: 1.05 }}>{c.title}</div>
                <div style={{ ...mono, fontSize: 10.5, color: C.soft }}>{c.sub}{dleft != null ? ` · ${dleft > 0 ? dleft + " days left" : "ended"}` : " · ongoing"}</div>
              </div>
              <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: c.col, border: `1px solid ${c.col}`, borderRadius: 999, padding: "3px 9px" }}>+{c.xp} XP</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: C.line, overflow: "hidden", margin: "12px 0 5px" }}><div style={{ width: `${Math.round(pct * 100)}%`, height: "100%", background: c.col, transition: "width .5s" }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: C.soft }}>
              <span>{done ? "Complete! 🎉" : `${c.prog} / ${c.target} ${c.unit}`}</span><span>{Math.round(pct * 100)}%</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================ EMPTY STATE (one consistent voice) ============================ */
function EmptyState({ icon: I, title, line }) {
  return (
    <Card style={{ padding: "26px 22px", textAlign: "center", border: `1.5px dashed ${C.line}`, background: "transparent" }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, margin: "0 auto 12px", background: C.paper, border: `1px solid ${C.line}`, display: "grid", placeItems: "center", color: C.soft }}>{I ? <I size={22} /> : null}</div>
      <div style={{ ...serif, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <p style={{ fontSize: 13, color: C.soft, margin: "0 auto", maxWidth: "32ch", lineHeight: 1.5 }}>{line}</p>
    </Card>
  );
}

/* ============================ SETTINGS (a moment) ============================ */
function Settings({ onClose, onReplayIntro }) {
  const [sound, setSound] = useState(SOUND_ON);
  const [done, setDone] = useState("");
  const flash = (m) => { setDone(m); setTimeout(() => setDone(""), 2600); };
  const toggleSound = () => { const v = !sound; setSound(v); SOUND_ON = v; store.set("pref-sound", v); };
  const resetMoments = () => { ["marks-seen", "level-seen", "garden-stage", "racetakeover-seen"].forEach((k) => store.set(k, null)); flash("Celebration memory cleared — your moments will play again."); };
  const Row = ({ title, sub, right }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>{sub && <div style={{ fontSize: 12, color: "#cdbfae", marginTop: 2 }}>{sub}</div>}</div>{right}
    </div>
  );
  const group = { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, overflow: "hidden", marginBottom: 18 };
  const label = { ...mono, fontSize: 11, letterSpacing: ".16em", color: "#ffb59f", margin: "0 0 8px 4px" };
  const btn = { ...mono, fontSize: 12.5, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", flex: "none" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 92, background: "linear-gradient(160deg,#17150F,#241612)", color: C.paper, overflowY: "auto", padding: "30px 22px 44px", animation: "fadeUp .4s both" }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div><div style={{ ...mono, fontSize: 11, letterSpacing: ".24em", color: "#ffb59f" }}>STRIDE</div><h2 style={{ ...serif, fontSize: 32, fontWeight: 800, margin: "2px 0 0" }}>Settings</h2></div>
          <button onClick={onClose} style={{ ...mono, fontSize: 13, color: "#fff", background: C.accent, border: "none", borderRadius: 999, padding: "9px 20px", cursor: "pointer", fontWeight: 600 }}>Done</button>
        </div>
        <div style={label}>SOUND</div>
        <div style={group}>
          <Row title="Audio cues" sub="Metronome, interval beeps & session tones" right={
            <button onClick={toggleSound} style={{ width: 52, height: 30, borderRadius: 999, border: "none", cursor: "pointer", background: sound ? C.green : "rgba(255,255,255,.2)", position: "relative", transition: "background .2s", flex: "none" }}>
              <span style={{ position: "absolute", top: 3, left: sound ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", display: "grid", placeItems: "center" }}>{sound ? <Volume2 size={13} color={C.green} /> : <VolumeX size={13} color={C.soft} />}</span>
            </button>
          } />
        </div>
        <div style={label}>EXPERIENCE</div>
        <div style={group}>
          <Row title="Replay the intro" sub="See the opening welcome again" right={<button style={btn} onClick={() => { store.set("onboarded", false); onReplayIntro(); }}>Replay</button>} />
          <Row title="Reset celebration memory" sub="Let level-ups, marks, blooms & race week replay" right={<button style={btn} onClick={resetMoments}>Reset</button>} />
        </div>
        {done && <div style={{ ...mono, fontSize: 12.5, color: C.green, textAlign: "center", marginBottom: 16, animation: "popIn .4s" }}>✓ {done}</div>}
        <div style={label}>ABOUT</div>
        <div style={{ ...group, padding: "16px", marginBottom: 8 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Made for {ATHLETE.name}</div>
          <p style={{ fontSize: 12.5, color: "#cdbfae", lineHeight: 1.55, margin: "6px 0 0" }}>STRIDE — your personal running OS. Everything here is built on your own data and lives on your device. No ads, no feed, just you and the work.</p>
        </div>
      </div>
    </div>
  );
}

/* ============================ JOURNEY — the season-long story ============================ */
function Journey() {
  const [prs, setPrs] = useState({});
  const [goals, setGoals] = useState([]);
  const [standing, setStanding] = useState(null);
  useEffect(() => {
    store.get("sport-log").then((sl) => {
      const s = Array.isArray(sl) ? sl : [];
      store.get("refuel-recipes").then((rc) => {
        store.get("route-passport").then((rp) => {
          store.get("quest-xp").then((qx) => {
            store.get("prs").then((pp) => {
              store.get("goals").then((gg) => {
                setPrs(pp || {}); setGoals(Array.isArray(gg) ? gg : []);
                const rcount = Array.isArray(rc) ? rc.length : 0, rt = routeStampCount(rp), prc = prRealCount(pp);
                const xp = baseXP(s, rcount, rt, prc) + (typeof qx === "number" ? qx : 0);
                const lvl = levelInfo(xp).lvl;
                const marks = evaluateBadges(computeStats(s, rcount, rt, prc)).filter((b) => b.earned).length;
                const dset = new Set(s.map((x) => x.date)); let streak = 0; const dd = new Date(); if (!dset.has(dd.toISOString().slice(0, 10))) dd.setDate(dd.getDate() - 1); while (dset.has(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1); }
                let si = 0; for (let i = 0; i < GARDEN_STAGES.length; i++) if (s.length >= GARDEN_STAGES[i].t) si = i;
                setStanding({ lvl, title: titleFor(lvl), marks, streak, stage: GARDEN_STAGES[si].n });
              });
            });
          });
        });
      });
    });
  }, []);
  const future = goals.filter((g) => Date.parse(g.date) >= Date.now() - 864e5).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const race = future[0];
  const prNodes = Object.entries(prs).filter(([, e]) => e && e.real).sort((a, b) => Date.parse(a[1].date) - Date.parse(b[1].date)).map(([k, e]) => ({ date: e.date, dot: C.amber, kicker: "PERSONAL BEST", title: `${k} · ${fmtTime(e.secReal)}`, detail: "A new line in your trophy case." }));
  const nodes = [
    { date: "Nov 2025", dot: C.green, kicker: "THE COMEBACK", title: "VO₂ 37.7 — back to running", detail: "After a year away, the engine restarts." },
    { date: "Apr 2026", dot: C.amber, kicker: "BUILDING", title: "VO₂ 42.8 — engine growing", detail: "+5 points across five patient months of base." },
    { date: "May 2026", dot: C.accent, kicker: "SOARING", title: "VO₂ 48.9 — fitness flying", detail: "+11 since November — elite-leaning aerobic power." },
    ...prNodes,
    standing && { date: "Today", dot: C.ink, kicker: "WHERE YOU STAND", title: `Level ${standing.lvl} · ${standing.title}`, detail: `${standing.marks} mark${standing.marks === 1 ? "" : "s"} earned · ${standing.streak}-day streak · garden ${standing.stage.toLowerCase()}.`, now: true },
    race && { date: new Date(race.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), dot: C.blue, kicker: "THE HORIZON", title: `→ ${race.name}`, detail: "The race you're building toward. You'll be ready.", future: true },
  ].filter(Boolean);
  return (
    <div>
      <SectionTitle n="01">Your season so far</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 18 }}>One thread through it all — where you started, every milestone since, and the horizon ahead. Your story keeps writing itself with every session.</p>
      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: C.line }} />
        {nodes.map((nd, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 20, animation: `fadeUp .5s ${i * 0.06}s both` }}>
            <span style={{ position: "absolute", left: -28, top: 3, width: 16, height: 16, borderRadius: "50%", background: nd.dot, border: `3px solid ${C.paper}`, boxShadow: nd.now ? `0 0 0 3px ${nd.dot}40` : nd.future ? `0 0 0 3px ${nd.dot}30` : "none" }} />
            <div style={{ ...mono, fontSize: 10, letterSpacing: ".1em", color: nd.dot }}>{nd.kicker} · {nd.date}</div>
            <div style={{ ...serif, fontSize: 17.5, fontWeight: 700, margin: "2px 0", color: nd.future ? C.blue : C.ink }}>{nd.title}</div>
            <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.5 }}>{nd.detail}</div>
          </div>
        ))}
      </div>
      {!race && <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginTop: 4 }}>Pin a goal race in the Goals tab to add your horizon to the story.</div>}
    </div>
  );
}

function Quests() {
  const [sessions, setSessions] = useState([]);
  const [recipes, setRecipes] = useState(0);
  const [routes, setRoutes] = useState(0);
  const [prs, setPrs] = useState(0);
  const [claimed, setClaimed] = useState([]);
  const [questXp, setQuestXp] = useState(0);
  const [showWrap, setShowWrap] = useState(false);
  const dayKey = todayKey();
  useEffect(() => {
    store.get("sport-log").then((d) => setSessions(Array.isArray(d) ? d : []));
    store.get("refuel-recipes").then((d) => setRecipes(Array.isArray(d) ? d.length : 0));
    store.get("route-passport").then((d) => setRoutes(routeStampCount(d)));
    store.get("prs").then((d) => setPrs(prRealCount(d)));
    store.get(`quests-${dayKey}`).then((d) => setClaimed(Array.isArray(d) ? d : []));
    store.get("quest-xp").then((d) => setQuestXp(typeof d === "number" ? d : 0));
  }, []);
  const totalXp = baseXP(sessions, recipes, routes, prs) + questXp;
  const L = levelInfo(totalXp);
  const quests = useMemo(() => dailyQuests(dayKey), [dayKey]);
  const toggle = (q) => {
    const has = claimed.includes(q.id);
    const nextClaimed = has ? claimed.filter((x) => x !== q.id) : [...claimed, q.id];
    const nextXp = Math.max(0, questXp + (has ? -q.xp : q.xp));
    setClaimed(nextClaimed); store.set(`quests-${dayKey}`, nextClaimed);
    setQuestXp(nextXp); store.set("quest-xp", nextXp);
  };
  const doneN = quests.filter((q) => claimed.includes(q.id)).length;

  return (
    <div>
      <SectionTitle n="01">Your level</SectionTitle>
      <div style={{ background: "linear-gradient(135deg,#17150F,#3a1d12)", borderRadius: 18, padding: 20, color: C.paper, marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 170, height: 170, background: "radial-gradient(circle,rgba(226,68,31,.4),transparent 65%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#E2441F,#C98A12)", display: "grid", placeItems: "center", flex: "none", boxShadow: "0 10px 26px -10px rgba(226,68,31,.7)" }}>
            <span style={{ ...serif, fontSize: 30, fontWeight: 900, color: "#fff" }}>{L.lvl}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: ".18em", color: "#ffb59f" }}>LEVEL {L.lvl}</div>
            <div style={{ ...serif, fontSize: 28, fontWeight: 800, lineHeight: 1.05 }}>{titleFor(L.lvl)}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, height: 9, borderRadius: 99, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
          <div style={{ width: `${Math.round(L.pct * 100)}%`, height: "100%", background: "linear-gradient(90deg,#E2441F,#C98A12)", borderRadius: 99, transition: "width .8s cubic-bezier(.2,.7,.2,1)", animation: "grow 1.1s cubic-bezier(.2,.7,.2,1) both" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, color: "#cdbfae", marginTop: 7 }}>
          <span>{totalXp.toLocaleString()} XP total</span><span>{L.span - L.into} XP to level {L.lvl + 1}</span>
        </div>
      </div>
      <button onClick={() => setShowWrap(true)} style={{ width: "100%", border: "none", borderRadius: 16, padding: "15px", cursor: "pointer", color: "#fff", background: "linear-gradient(120deg,#1E5F8C,#2F7D52,#C98A12)", backgroundSize: "200% 200%", ...mono, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 20, boxShadow: "0 12px 30px -14px rgba(30,95,140,.7)" }}>
        ✨ My Season Wrapped
      </button>

      <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Daily quests</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Three fresh challenges every day — balanced for training <i>and</i> recovery. <b style={{ color: C.deep }}>{doneN}/3</b> done today.</p>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {quests.map((q) => {
          const on = claimed.includes(q.id); const I = q.icon;
          return (
            <button key={q.id} onClick={() => toggle(q)} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", cursor: "pointer", background: on ? "rgba(47,125,82,.08)" : C.card, border: `1.5px solid ${on ? C.green : C.line}`, borderRadius: 14, padding: "13px 15px", transition: "all .25s" }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, flex: "none", background: on ? C.green : C.paper, border: `1px solid ${on ? C.green : C.line}`, display: "grid", placeItems: "center", transition: "all .25s" }}>
                {on ? <Check size={20} color="#fff" /> : <I size={19} color={C.soft} />}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: on ? C.soft : C.ink, textDecoration: on ? "line-through" : "none" }}>{q.label}</span>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: on ? C.green : C.accent }}>+{q.xp}</span>
            </button>
          );
        })}
      </div>
      {doneN === 3 && <div style={{ background: "rgba(47,125,82,.1)", border: `1px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 14 }}>🎉 All quests done — beautiful work today. Fresh ones land tomorrow.</div>}
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft }}>
        XP flows from everything you do — sessions, Marks, recipe cards, streaks and quests — into one level. Quests are personal nudges, not obligations; rest days count too.
      </div>

      <SectionTitle n="03"><span style={{ marginTop: 18, display: "inline-block" }}>Ghost leaderboard</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Where you stand against pace-setting rivals — and your own past self. Switch the metric to find the chase that fires you up.</p>
      <GhostLeaderboard sessions={sessions} />

      <SectionTitle n="04"><span style={{ marginTop: 18, display: "inline-block" }}>Seasonal challenges</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Limited-time goals that track themselves from your log. Chase them while they're live.</p>
      <SeasonalChallenges sessions={sessions} />

      {showWrap && <Wrapped sessions={sessions} recipes={recipes} routes={routes} onClose={() => setShowWrap(false)} />}
    </div>
  );
}

/* ============================ STRIDE EXPLORE (themed London route discovery) ============================ */
const RBOX = { w: -0.218, e: 0.012, s: 51.452, n: 51.566 };
const RVW = 360, RVH = 250;
const rproj = (lng, lat) => [((lng - RBOX.w) / (RBOX.e - RBOX.w)) * RVW, (1 - (lat - RBOX.s) / (RBOX.n - RBOX.s)) * RVH];
const THAMES = [[-0.205, 51.468], [-0.17, 51.462], [-0.14, 51.485], [-0.125, 51.501], [-0.108, 51.508], [-0.078, 51.505], [-0.06, 51.508], [-0.02, 51.502], [0.005, 51.508]];
const PARKS = [["Hyde Park", -0.165, 51.508, 20, 12], ["Kensington Gdns", -0.184, 51.506, 13, 10], ["Regent's Park", -0.156, 51.531, 16, 11], ["St James's", -0.134, 51.502, 9, 5], ["Green Park", -0.143, 51.504, 7, 5], ["Victoria Park", -0.038, 51.535, 12, 8], ["Battersea Park", -0.157, 51.479, 10, 6], ["Hampstead Heath", -0.16, 51.56, 16, 13]];
const DISTRICTS = [["CAMDEN", -0.143, 51.542], ["ISLINGTON", -0.103, 51.537], ["SHOREDITCH", -0.078, 51.526], ["THE CITY", -0.091, 51.516], ["SOHO", -0.131, 51.515], ["SOUTHBANK", -0.106, 51.503], ["GREENWICH", -0.009, 51.48], ["BRIXTON", -0.114, 51.464], ["NOTTING HILL", -0.205, 51.517]];
const rhav = (a, b) => { const R = 6371, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lng - a.lng) * t, la1 = a.lat * t, la2 = b.lat * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const lnglat2px = (lng, lat, z) => { const n = Math.pow(2, z) * 256; const x = (lng + 180) / 360 * n; const r = lat * Math.PI / 180; const y = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; return [x, y]; };
function fitView(stops, W, H) {
  const lngs = stops.map((s) => s.lng), lats = stops.map((s) => s.lat);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const pl = (maxLng - minLng) * 0.28 + 0.004, pa = (maxLat - minLat) * 0.28 + 0.003;
  minLng -= pl; maxLng += pl; minLat -= pa; maxLat += pa;
  const center = { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 };
  let zoom = 12;
  for (let z = 16; z >= 9; z--) { const [x0, y0] = lnglat2px(minLng, maxLat, z), [x1, y1] = lnglat2px(maxLng, minLat, z); if ((x1 - x0) <= W && (y1 - y0) <= H) { zoom = z; break; } zoom = z; }
  return { center, zoom: Math.min(15, Math.max(10, zoom)) };
}
function tilesFor(view, W, H) {
  const z = view.zoom, n = Math.pow(2, z), [cx, cy] = lnglat2px(view.center.lng, view.center.lat, z);
  const tlx = cx - W / 2, tly = cy - H / 2;
  const x0 = Math.floor(tlx / 256), x1 = Math.floor((tlx + W) / 256), y0 = Math.floor(tly / 256), y1 = Math.floor((tly + H) / 256);
  const out = [];
  for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) { if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue; out.push({ tx, ty, z, left: tx * 256 - tlx, top: ty * 256 - tly }); }
  return out;
}
const THEMES = [
  { id: "burger", label: "Burger Run", emoji: "🍔", color: "#E2441F", pois: [
    { n: "Bleecker, Spitalfields", lng: -0.0755, lat: 51.5193, b: "Cult dry-aged smash" }, { n: "Black Bear, Shoreditch", lng: -0.0782, lat: 51.5235, b: "Boxpark legend" }, { n: "Patty & Bun, Marylebone", lng: -0.1512, lat: 51.5155, b: "The 'Ari Gold'" }, { n: "MEATliquor, Marylebone", lng: -0.1505, lat: 51.5181, b: "Dirty & dark" }, { n: "Honest Burgers, Soho", lng: -0.1312, lat: 51.5135, b: "Rosemary fries" }, { n: "Burger & Lobster, Soho", lng: -0.1378, lat: 51.5121, b: "Surf & turf" }, { n: "Lucky Chip, Hackney", lng: -0.057, lat: 51.541, b: "Movie-named patties" } ] },
  { id: "pizza", label: "Pizza Run", emoji: "🍕", color: "#C98A12", pois: [
    { n: "Pizza Pilgrims, Soho", lng: -0.131, lat: 51.513, b: "Naples in Kingly Ct" }, { n: "Homeslice, Neal's Yard", lng: -0.126, lat: 51.515, b: "20-inch sharers" }, { n: "50 Kalò, Liverpool St", lng: -0.082, lat: 51.518, b: "True Neapolitan" }, { n: "Yard Sale, Hackney", lng: -0.056, lat: 51.553, b: "Local hero" }, { n: "Voodoo Ray's, Dalston", lng: -0.075, lat: 51.546, b: "Giant slices" }, { n: "Franco Manca, Brixton", lng: -0.111, lat: 51.462, b: "Sourdough OG" } ] },
  { id: "pasta", label: "Pasta Run", emoji: "🍝", color: "#B5330F", pois: [
    { n: "Padella, Borough", lng: -0.09, lat: 51.505, b: "The pici queue" }, { n: "Bancone, Covent Garden", lng: -0.124, lat: 51.511, b: "Silk handkerchiefs" }, { n: "Lina Stores, Soho", lng: -0.132, lat: 51.514, b: "Mint-green deli" }, { n: "Pastaio, Carnaby", lng: -0.139, lat: 51.512, b: "Fresh & fast" }, { n: "Circolo Popolare, Fitzrovia", lng: -0.137, lat: 51.518, b: "Wall of bottles" }, { n: "Trullo, Highbury", lng: -0.103, lat: 51.552, b: "Pasta + charcoal" } ] },
  { id: "bakery", label: "Bakery Run", emoji: "🥐", color: "#caa24a", pois: [
    { n: "Pophams, Islington", lng: -0.103, lat: 51.539, b: "Bacon-maple bun" }, { n: "Dusty Knuckle, Dalston", lng: -0.066, lat: 51.546, b: "Cult sourdough" }, { n: "E5 Bakehouse, London Fields", lng: -0.057, lat: 51.541, b: "Arch bakery" }, { n: "Jolene, Newington Green", lng: -0.085, lat: 51.553, b: "Stone-milled" }, { n: "Arôme, Soho", lng: -0.13, lat: 51.513, b: "Croissant heaven" }, { n: "Fortitude, Fitzrovia", lng: -0.142, lat: 51.518, b: "Tiny & superb" } ] },
  { id: "coffee", label: "Coffee Run", emoji: "☕", color: "#7a4a28", pois: [
    { n: "Monmouth, Borough", lng: -0.091, lat: 51.505, b: "Old-school roaster" }, { n: "Prufrock, Leather Lane", lng: -0.109, lat: 51.521, b: "Barista's barista" }, { n: "Kaffeine, Fitzrovia", lng: -0.139, lat: 51.517, b: "Antipodean classic" }, { n: "Workshop, Clerkenwell", lng: -0.108, lat: 51.523, b: "Industrial-chic" }, { n: "Allpress, Shoreditch", lng: -0.078, lat: 51.527, b: "Roastery bar" }, { n: "Climpson & Sons, Broadway Mkt", lng: -0.061, lat: 51.537, b: "Market staple" } ] },
  { id: "gems", label: "Hidden Gems", emoji: "💎", color: "#1E5F8C", pois: [
    { n: "Leadenhall Market", lng: -0.083, lat: 51.512, b: "Victorian arcade" }, { n: "St Dunstan-in-the-East", lng: -0.082, lat: 51.509, b: "Ruined church garden" }, { n: "Postman's Park", lng: -0.097, lat: 51.516, b: "Heroes' memorial" }, { n: "Sir John Soane's Museum", lng: -0.117, lat: 51.517, b: "Wunderkammer" }, { n: "Neal's Yard", lng: -0.126, lat: 51.515, b: "Rainbow courtyard" }, { n: "Daunt Books, Marylebone", lng: -0.152, lat: 51.522, b: "Edwardian galleries" }, { n: "Little Venice", lng: -0.182, lat: 51.522, b: "Canal calm" } ] },
  { id: "colour", label: "Colour Run", emoji: "🎨", color: "#d46aa0", pois: [
    { n: "Neal's Yard", lng: -0.126, lat: 51.515, b: "Rainbow walls" }, { n: "Notting Hill pastels", lng: -0.205, lat: 51.515, b: "Candy houses" }, { n: "Leake Street Tunnel", lng: -0.114, lat: 51.501, b: "Graffiti legal" }, { n: "Columbia Road", lng: -0.071, lat: 51.53, b: "Flower street" }, { n: "Brick Lane murals", lng: -0.071, lat: 51.521, b: "Street-art wall" }, { n: "Camden Market", lng: -0.146, lat: 51.541, b: "Riot of colour" }, { n: "Primrose Hill houses", lng: -0.158, lat: 51.539, b: "Pastel terraces" } ] },
  { id: "culture", label: "Culture Run", emoji: "🏛️", color: "#8a3f66", pois: [
    { n: "British Museum", lng: -0.127, lat: 51.519, b: "The Rosetta Stone" }, { n: "Somerset House", lng: -0.117, lat: 51.511, b: "Courtyard fountains" }, { n: "National Gallery", lng: -0.128, lat: 51.508, b: "Trafalgar masters" }, { n: "Tate Modern", lng: -0.099, lat: 51.507, b: "Turbine Hall" }, { n: "Tate Britain", lng: -0.128, lat: 51.491, b: "Turner & Blake" }, { n: "V&A", lng: -0.172, lat: 51.497, b: "Art & design" } ] },
  { id: "nature", label: "Nature Run", emoji: "🌳", color: "#2F7D52", pois: [
    { n: "Hyde Park", lng: -0.165, lat: 51.508, b: "Serpentine loop" }, { n: "St James's Park", lng: -0.134, lat: 51.502, b: "Pelicans & views" }, { n: "Regent's Park", lng: -0.156, lat: 51.531, b: "Rose gardens" }, { n: "Primrose Hill", lng: -0.16, lat: 51.539, b: "Skyline summit" }, { n: "Hampstead Heath", lng: -0.16, lat: 51.56, b: "Wild & hilly" }, { n: "Victoria Park", lng: -0.038, lat: 51.535, b: "East-end green" } ] },
  { id: "uni", label: "Campus Run", emoji: "🎓", color: "#123a55", pois: [
    { n: "UCL", lng: -0.134, lat: 51.524, b: "Bloomsbury quad" }, { n: "SOAS", lng: -0.13, lat: 51.522, b: "Global studies" }, { n: "LSE", lng: -0.116, lat: 51.514, b: "Houghton St" }, { n: "King's College Strand", lng: -0.116, lat: 51.511, b: "River campus" }, { n: "City, University", lng: -0.103, lat: 51.527, b: "Northampton Sq" }, { n: "Imperial College", lng: -0.176, lat: 51.498, b: "Sci & tech" } ] },
  { id: "landmark", label: "Landmark Run", emoji: "🗿", color: "#17150F", pois: [
    { n: "Big Ben & Westminster", lng: -0.1246, lat: 51.5007, b: "The chimes" }, { n: "London Eye", lng: -0.1195, lat: 51.5033, b: "Southbank wheel" }, { n: "Trafalgar Square", lng: -0.1281, lat: 51.508, b: "Nelson's column" }, { n: "Buckingham Palace", lng: -0.1419, lat: 51.5014, b: "The Mall" }, { n: "St Paul's", lng: -0.0984, lat: 51.5138, b: "The dome" }, { n: "Tower Bridge", lng: -0.0754, lat: 51.5055, b: "Bascule icon" }, { n: "The Shard", lng: -0.0865, lat: 51.5045, b: "Glass spike" } ] },
];
const LONDON_AREAS = { "soho": [-0.131, 51.513], "covent garden": [-0.124, 51.512], "marylebone": [-0.151, 51.517], "fitzrovia": [-0.139, 51.518], "mayfair": [-0.147, 51.51], "shoreditch": [-0.078, 51.524], "spitalfields": [-0.075, 51.519], "brick lane": [-0.071, 51.521], "dalston": [-0.075, 51.546], "hackney": [-0.055, 51.545], "london fields": [-0.06, 51.541], "bethnal green": [-0.055, 51.527], "islington": [-0.103, 51.538], "angel": [-0.106, 51.532], "king's cross": [-0.124, 51.531], "kings cross": [-0.124, 51.531], "clerkenwell": [-0.106, 51.523], "camden": [-0.143, 51.539], "borough": [-0.09, 51.505], "bermondsey": [-0.081, 51.498], "peckham": [-0.069, 51.474], "brixton": [-0.114, 51.462], "clapham": [-0.138, 51.461], "notting hill": [-0.205, 51.515], "chelsea": [-0.169, 51.487], "south kensington": [-0.174, 51.494], "kensington": [-0.193, 51.5], "westminster": [-0.135, 51.501], "southbank": [-0.114, 51.505], "south bank": [-0.114, 51.505], "greenwich": [-0.009, 51.478], "hampstead": [-0.178, 51.556], "stoke newington": [-0.077, 51.562], "battersea": [-0.157, 51.479], "shepherd's bush": [-0.226, 51.505], "shepherds bush": [-0.226, 51.505], "victoria": [-0.143, 51.496], "holborn": [-0.118, 51.517], "farringdon": [-0.105, 51.52], "whitechapel": [-0.061, 51.519], "london bridge": [-0.087, 51.505], "st james's": [-0.135, 51.506], "primrose hill": [-0.158, 51.539], "newington green": [-0.085, 51.553], "highbury": [-0.103, 51.552], "vauxhall": [-0.123, 51.486], "shoreditch high street": [-0.078, 51.523], "elephant and castle": [-0.099, 51.494] };
const areaCoord = (area) => { if (!area) return null; const a = String(area).toLowerCase(); for (const k in LONDON_AREAS) { if (a.includes(k)) { const c = LONDON_AREAS[k]; return { lng: c[0], lat: c[1] }; } } return null; };
function buildRoute(theme, targetKm, seed) {
  const pois = theme.pois;
  const startIdx = seed % pois.length;
  const order = [pois[startIdx]];
  const remaining = pois.filter((_, i) => i !== startIdx);
  let dist = 0; const F = 1.32;
  while (remaining.length) {
    const last = order[order.length - 1];
    remaining.sort((a, b) => rhav(last, a) - rhav(last, b));
    const next = remaining[0];
    const add = rhav(last, next) * F, loopBack = rhav(next, order[0]) * F;
    if (order.length >= 2 && dist + add + loopBack > targetKm) break;
    order.push(next); dist += add; remaining.shift();
  }
  dist += rhav(order[order.length - 1], order[0]) * F;
  return { stops: order, km: dist };
}
function shapePts(shape, cx = 180, cy = 118, R = 86) {
  const a = [];
  if (shape === "Heart") { for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.12) { const x = 16 * Math.pow(Math.sin(t), 3); const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); a.push([cx + x * (R / 17), cy - y * (R / 17)]); } return a; }
  if (shape === "Star") { for (let i = 0; i <= 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.42 : R; a.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]); } return a; }
  if (shape === "Bolt") { return [[cx - 18, cy - R], [cx + 14, cy - R], [cx - 8, cy - 6], [cx + 22, cy - 6], [cx - 22, cy + R], [cx - 2, cy + 14], [cx - 30, cy + 14], [cx - 18, cy - R]]; }
  for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.18) a.push([cx + R * Math.cos(t), cy + R * Math.sin(t * 1) - 0]); return a;
}
const ptAlong = (pts, f) => {
  let total = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let target = f * total, acc = 0;
  for (let i = 1; i < pts.length; i++) { const d = seg[i - 1]; if (acc + d >= target) { const t = (target - acc) / (d || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } acc += d; }
  return pts[pts.length - 1];
};

function Routes() {
  const [mode, setMode] = useState("discover");
  const [themeId, setThemeId] = useState("burger");
  const [target, setTarget] = useState(5);
  const [seed, setSeed] = useState(0);
  const [shape, setShape] = useState("Heart");
  const [running, setRunning] = useState(false);
  const [prog, setProg] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passport, setPassport] = useState([]);
  const addedRef = useRef(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveStops, setLiveStops] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [tilesFailed, setTilesFailed] = useState(false);
  const theme = THEMES.find((t) => t.id === themeId);
  useEffect(() => { store.get("route-passport").then((d) => { if (Array.isArray(d)) setPassport(d); }); }, []);
  const activeTheme = liveMode && liveStops && liveStops.length >= 2 ? { ...theme, pois: liveStops } : theme;
  const route = useMemo(() => buildRoute(activeTheme, target, seed), [liveMode, liveStops, themeId, target, seed]);
  const fetchLive = async () => {
    setLiveLoading(true); setLiveError("");
    try {
      const cat = theme.label.replace(" Run", "");
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 900,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "You are a London running-route curator. Use web search to find 7 genuinely good, currently-operating spots in central/inner London for the given category. Respond with ONLY a JSON array, no prose and no markdown fences: [{\"name\":\"...\",\"area\":\"...\",\"blurb\":\"...\"}]. 'area' MUST be a recognisable London neighbourhood (e.g. Soho, Shoreditch, Marylebone, Borough, Hackney, Islington, Camden, Brixton, Peckham, Notting Hill, Dalston, Clerkenwell, Fitzrovia, Covent Garden, Bermondsey, Greenwich, Hampstead). 'blurb' is max 5 words.",
          messages: [{ role: "user", content: `Category: ${cat} spots in London.` }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const js = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
      const arr = JSON.parse(js);
      const mapped = arr.map((p) => { const c = areaCoord(p.area); return c ? { n: p.name, b: p.blurb || p.area, lng: c.lng + (Math.random() - 0.5) * 0.006, lat: c.lat + (Math.random() - 0.5) * 0.004 } : null; }).filter(Boolean);
      if (mapped.length < 2) { setLiveError("Couldn't place enough live spots — showing curated route."); setLiveMode(false); }
      else { setLiveStops(mapped); setLiveMode(true); setSeed((s) => s + 1); }
    } catch (e) { setLiveError("Live search needs a connection — showing curated routes."); }
    finally { setLiveLoading(false); }
  };
  const MW = 320, MH = 300;
  const view = mode === "discover" ? fitView(route.stops, MW, MH) : null;
  const gproj = view ? (lng, lat) => { const [px, py] = lnglat2px(lng, lat, view.zoom); const [cx, cy] = lnglat2px(view.center.lng, view.center.lat, view.zoom); return [px - cx + MW / 2, py - cy + MH / 2]; } : null;
  const tiles = view ? tilesFor(view, MW, MH) : [];
  const pts = mode === "art" ? shapePts(shape) : [...route.stops.map((s) => gproj(s.lng, s.lat)), gproj(route.stops[0].lng, route.stops[0].lat)];
  const routeD = "M " + pts.map((p) => p.map((n) => n.toFixed(1)).join(" ")).join(" L ");
  const stopFrac = (() => {
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let acc = 0; return pts.map((_, i) => { if (i === 0) return 0; acc += seg[i - 1]; return acc / (total || 1); });
  })();
  const km = mode === "art" ? target : route.km;
  const mins = Math.round(km * 6.33);
  const timeStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
  const gmapsUrl = route.stops && route.stops.length >= 2 ? (() => {
    const pt = (s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`;
    const wp = route.stops.slice(1).map(pt).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pt(route.stops[0]))}&destination=${encodeURIComponent(pt(route.stops[0]))}&waypoints=${encodeURIComponent(wp)}&travelmode=walking`;
  })() : "";

  useEffect(() => {
    if (!running) return;
    addedRef.current = false;
    const dur = Math.max(4200, route.stops.length * 1150), s = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - s) / dur); setProg(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!addedRef.current) {
        addedRef.current = true; setFinished(true);
        const stamp = { theme: theme.id, emoji: theme.emoji, label: theme.label, km: +route.km.toFixed(1), ts: Date.now() };
        setPassport((prev) => { const next = [stamp, ...prev].slice(0, 40); store.set("route-passport", next); return next; });
      }
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [running]);
  const closeRun = () => { setRunning(false); setFinished(false); setProg(0); };
  const dot = running ? ptAlong(pts, prog) : null;

  return (
    <div>
      <SectionTitle n="01">Discover London runs</SectionTitle>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {[["discover", "🧭 Discover"], ["art", "✨ GPS Art"]].map(([k, l]) => (
          <button key={k} onClick={() => { setMode(k); closeRun(); }} style={{ ...mono, fontSize: 13, padding: "9px 16px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${mode === k ? C.accent : C.line}`, background: mode === k ? C.accent : "transparent", color: mode === k ? "#fff" : C.soft }}>{l}</button>
        ))}
      </div>

      {mode === "discover" && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => { setThemeId(t.id); closeRun(); setLiveMode(false); setLiveStops(null); setLiveError(""); }} style={{ ...mono, fontSize: 12, padding: "7px 11px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${themeId === t.id ? t.color : C.line}`, background: themeId === t.id ? t.color : "transparent", color: themeId === t.id ? "#fff" : C.soft }}>{t.emoji} {t.label.replace(" Run", "")}</button>
          ))}
        </div>
      )}
      {mode === "art" && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
          {[["Heart", "❤️ Heart"], ["Star", "⭐ Star"], ["Bolt", "⚡ Bolt"], ["Loop", "⭕ Loop"]].map(([k, l]) => (
            <button key={k} onClick={() => { setShape(k); closeRun(); }} style={{ ...mono, fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${shape === k ? C.accent : C.line}`, background: shape === k ? C.accent : "transparent", color: shape === k ? "#fff" : C.soft }}>{l}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {[3, 5, 8, 12].map((d) => (
          <button key={d} onClick={() => { setTarget(d); closeRun(); }} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${target === d ? C.deep : C.line}`, background: target === d ? C.deep : "transparent", color: target === d ? "#fff" : C.soft }}>{d}km</button>
        ))}
        {mode === "discover" && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
            <button onClick={fetchLive} disabled={liveLoading} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: "none", background: liveLoading ? C.line : "linear-gradient(120deg,#d11,#E2441F)", color: "#fff" }}>{liveLoading ? "…" : "🔴 Live spots"}</button>
            <button onClick={() => setSeed((s) => s + 1)} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: "none", background: "linear-gradient(120deg,#E2441F,#C98A12)", color: "#fff" }}>🎲</button>
          </span>
        )}
      </div>

      {mode === "discover" && liveLoading && <div style={{ marginBottom: 10 }}><Dots label="Finding today's best spots on the web…" /></div>}
      {mode === "discover" && !liveLoading && liveError && <div style={{ ...mono, fontSize: 12, color: C.soft, marginBottom: 10 }}>{liveError}</div>}
      {mode === "discover" && liveMode && liveStops && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: "#fff", background: "#d11", borderRadius: 999, padding: "3px 10px" }}>● LIVE</span>
          <span style={{ ...mono, fontSize: 12, color: C.soft }}>real spots, fresh from the web</span>
          <button onClick={() => { setLiveMode(false); setLiveStops(null); }} style={{ ...mono, fontSize: 12, color: C.accent, background: "transparent", border: "none", cursor: "pointer", marginLeft: "auto" }}>use curated</button>
        </div>
      )}

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
        {mode === "discover" ? (
          <div style={{ position: "relative", width: MW, height: MH, maxWidth: "100%", margin: "0 auto", overflow: "hidden", background: "#EEF1E8" }}>
            {!tilesFailed && tiles.map((t) => (
              <img key={t.z + "/" + t.tx + "/" + t.ty} src={`https://tile.openstreetmap.org/${t.z}/${t.tx}/${t.ty}.png`} alt="" loading="lazy" draggable="false" onError={() => setTilesFailed(true)} style={{ position: "absolute", left: t.left, top: t.top, width: 256, height: 256, userSelect: "none" }} />
            ))}
            {tilesFailed && (
              <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{ position: "absolute", inset: 0 }}>
                <rect width={MW} height={MH} fill="#EEF1E8" />
                {[...Array(Math.ceil(MH / 36))].map((_, i) => <line key={"h" + i} x1="0" y1={i * 36} x2={MW} y2={i * 36} stroke="#E2DDCB" strokeWidth="1" />)}
                {[...Array(Math.ceil(MW / 40))].map((_, i) => <line key={"v" + i} x1={i * 40} y1="0" x2={i * 40} y2={MH} stroke="#E2DDCB" strokeWidth="1" />)}
                <path d={"M " + THAMES.map((p) => gproj(p[0], p[1]).map((n) => n.toFixed(1)).join(" ")).join(" L ")} stroke="#9cc3d6" strokeWidth="9" fill="none" opacity="0.55" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{ position: "absolute", inset: 0 }}>
              <path key={themeId + target + seed + (liveMode ? "L" : "")} d={routeD} stroke={theme.color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2400" style={{ animation: "drawLine 1.7s ease both" }} />
              {route.stops.map((s, i) => {
                const [x, y] = gproj(s.lng, s.lat); const got = running && prog >= stopFrac[i];
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={i === 0 ? 10 : 8} fill={got ? C.green : i === 0 ? theme.color : "#fff"} stroke={theme.color} strokeWidth="2.5" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.45))" }} />
                    <text x={x} y={y + 3.4} textAnchor="middle" style={{ ...mono, fontSize: 9, fontWeight: 700, fill: got || i === 0 ? "#fff" : C.ink }}>{i + 1}</text>
                  </g>
                );
              })}
              {dot && <><circle cx={dot[0]} cy={dot[1]} r="12" fill={C.accent} opacity="0.25" /><circle cx={dot[0]} cy={dot[1]} r="6" fill={C.accent} stroke="#fff" strokeWidth="2" /></>}
            </svg>
            {!tilesFailed && <div style={{ position: "absolute", right: 4, bottom: 2, ...mono, fontSize: 8, color: "#333", background: "rgba(255,255,255,.7)", padding: "1px 4px", borderRadius: 3 }}>© OpenStreetMap</div>}
          </div>
        ) : (
          <svg viewBox="0 0 360 250" width="100%" style={{ display: "block", background: "#EEF1E8" }}>
            <rect width="360" height="250" fill="#EEF1E8" />
            {[...Array(7)].map((_, i) => <line key={"h" + i} x1="0" y1={i * 36} x2="360" y2={i * 36} stroke="#E2DDCB" strokeWidth="1" />)}
            {[...Array(10)].map((_, i) => <line key={"v" + i} x1={i * 40} y1="0" x2={i * 40} y2="250" stroke="#E2DDCB" strokeWidth="1" />)}
          {mode === "discover" && PARKS.map((p, i) => { const [x, y] = rproj(p[1], p[2]); return <ellipse key={"pk" + i} cx={x.toFixed(1)} cy={y.toFixed(1)} rx={p[3]} ry={p[4]} fill="#cfe3c8" opacity="0.8" />; })}
          {mode === "discover" && DISTRICTS.map((l, i) => { const [x, y] = rproj(l[1], l[2]); return <text key={"ds" + i} x={x.toFixed(1)} y={y.toFixed(1)} textAnchor="middle" style={{ ...mono, fontSize: 6.8, fill: "#b3a98f", letterSpacing: ".06em" }}>{l[0]}</text>; })}
            <path key={shape} d={routeD} stroke={C.accent} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1600" style={{ animation: "drawLine 1.7s ease both" }} />
          </svg>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 6px" }}><div style={{ ...serif, fontSize: 24, fontWeight: 700, color: C.accent }}>{km.toFixed(1)}</div><div style={{ ...mono, fontSize: 9.5, color: C.soft }}>KM (LOOP)</div></div>
        <div style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 6px" }}><div style={{ ...serif, fontSize: 24, fontWeight: 700 }}>{timeStr}</div><div style={{ ...mono, fontSize: 9.5, color: C.soft }}>~AT EASY PACE</div></div>
        <div style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 6px" }}><div style={{ ...serif, fontSize: 24, fontWeight: 700 }}>{mode === "art" ? shape : route.stops.length}</div><div style={{ ...mono, fontSize: 9.5, color: C.soft }}>{mode === "art" ? "SHAPE" : "STOPS"}</div></div>
      </div>

      {mode === "discover" ? (
        <>
          <div style={{ marginBottom: 14 }}>
            {route.stops.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: `1px dashed ${C.line}` }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", background: i === 0 ? theme.color : C.paper, border: `1.5px solid ${theme.color}`, display: "grid", placeItems: "center", ...mono, fontSize: 12, fontWeight: 700, color: i === 0 ? "#fff" : theme.color }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.n}</div><div style={{ ...mono, fontSize: 11, color: C.soft }}>{s.b}</div></div>
              </div>
            ))}
          </div>
          <button onClick={() => { setRunning(true); setProg(0); setFinished(false); }} style={{ width: "100%", border: "none", borderRadius: 14, padding: "15px", cursor: "pointer", color: "#fff", background: `linear-gradient(120deg,${theme.color},${C.deep})`, ...mono, fontSize: 15, fontWeight: 600, marginBottom: 10, boxShadow: `0 12px 30px -14px ${theme.color}` }}>▶ Follow this run</button>
          <a href={gmapsUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", boxSizing: "border-box", textDecoration: "none", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "13px", cursor: "pointer", color: C.deep, ...mono, fontSize: 14, fontWeight: 600, marginBottom: 18 }}>🗺️ Open in Google Maps — real map + walking route</a>
        </>
      ) : (
        <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft, marginBottom: 18 }}>
          <b style={{ color: C.ink }}>GPS art:</b> run this {shape.toLowerCase()} loop and your tracker draws the shape on the map. Scale it anywhere in the city to roughly {target} km.
        </div>
      )}

      {passport.length > 0 && (
        <>
          <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Route passport</span></SectionTitle>
          <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Every themed run you complete earns a stamp. <b style={{ color: C.deep }}>{passport.length}</b> collected.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(82px,1fr))", gap: 10, marginBottom: 14 }}>
            {passport.map((p, i) => (
              <div key={i} style={{ textAlign: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 6px", animation: "popIn .5s both" }}>
                <div style={{ fontSize: 26 }}>{p.emoji}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>{p.label.replace(" Run", "")}</div>
                <div style={{ ...mono, fontSize: 9, color: C.soft }}>{p.km}km</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft }}>
        The in-app map is a stylised preview — a real, navigable map can't load inside the app sandbox, so tap <b style={{ color: C.ink }}>Open in Google Maps</b> for the true map with walking directions. Spots are curated/live suggestions placed by neighbourhood; always check the live map and your surroundings before heading out.
      </div>

      {running && finished && (
        <div onClick={closeRun} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(13,11,7,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28, cursor: "pointer" }}>
          {Array.from({ length: 14 }).map((_, i) => (<span key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${15 + Math.random() * 55}%`, fontSize: 16, animation: `twinkle ${1.4 + Math.random() * 1.6}s ${Math.random()}s infinite` }}>✨</span>))}
          <div style={{ textAlign: "center", animation: "popIn .55s" }}>
            <div style={{ fontSize: 64, animation: "floatMed 3s ease-in-out infinite" }}>{theme.emoji}</div>
            <div style={{ ...mono, fontSize: 12, letterSpacing: ".22em", color: "#ffb59f", marginTop: 8 }}>RUN COMPLETE</div>
            <div style={{ ...serif, fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 4 }}>{theme.label}</div>
            <div style={{ fontSize: 14, color: "#e6ddd2", marginTop: 6 }}>{route.km.toFixed(1)} km · {route.stops.length} stops · stamp earned</div>
            <div style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 20 }}>tap to close</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ GUIDED — session player + race pacing ============================ */
const PACE_LABEL = { easy: "~6:20/km", steady: "~5:45/km", threshold: "~5:05/km", interval: "~4:40/km" };
const PACE_COL = { easy: "#2F7D52", steady: "#C98A12", threshold: "#E2441F", interval: "#B5330F" };
const SESSIONS = {
  easy: { name: "Easy Run", color: "#2F7D52", cue: "Conversational — you should be able to chat the whole way.", steps: [
    { l: "Warm-up jog", s: 120, p: "easy", k: "warm" }, { l: "Easy running", s: 1500, p: "easy", k: "work" }, { l: "Cool-down", s: 120, p: "easy", k: "cool" }] },
  tempo: { name: "Tempo Run", color: "#C98A12", cue: "Comfortably hard — controlled, rhythmic, on the edge of comfort.", steps: [
    { l: "Warm-up", s: 480, p: "easy", k: "warm" }, { l: "Tempo block", s: 1200, p: "steady", k: "work" }, { l: "Cool-down", s: 300, p: "easy", k: "cool" }] },
  threshold: { name: "Threshold · 4×5'", color: "#E2441F", cue: "Hold a strong, repeatable effort. Float the recoveries — this is your missing gear.", steps: [
    { l: "Warm-up", s: 600, p: "easy", k: "warm" },
    { l: "Rep 1", s: 300, p: "threshold", k: "work" }, { l: "Recovery", s: 90, p: "easy", k: "rec" },
    { l: "Rep 2", s: 300, p: "threshold", k: "work" }, { l: "Recovery", s: 90, p: "easy", k: "rec" },
    { l: "Rep 3", s: 300, p: "threshold", k: "work" }, { l: "Recovery", s: 90, p: "easy", k: "rec" },
    { l: "Rep 4", s: 300, p: "threshold", k: "work" }, { l: "Cool-down", s: 480, p: "easy", k: "cool" }] },
  vo2: { name: "VO₂ · 5×3'", color: "#B5330F", cue: "Fast but controlled — the top-end gear your data says you've never trained.", steps: [
    { l: "Warm-up", s: 720, p: "easy", k: "warm" },
    { l: "Interval 1", s: 180, p: "interval", k: "work" }, { l: "Recovery", s: 120, p: "easy", k: "rec" },
    { l: "Interval 2", s: 180, p: "interval", k: "work" }, { l: "Recovery", s: 120, p: "easy", k: "rec" },
    { l: "Interval 3", s: 180, p: "interval", k: "work" }, { l: "Recovery", s: 120, p: "easy", k: "rec" },
    { l: "Interval 4", s: 180, p: "interval", k: "work" }, { l: "Recovery", s: 120, p: "easy", k: "rec" },
    { l: "Interval 5", s: 180, p: "interval", k: "work" }, { l: "Cool-down", s: 480, p: "easy", k: "cool" }] },
  long: { name: "Long Run", color: "#1E5F8C", cue: "Time on feet — keep it easy and relaxed. Patience builds the engine.", steps: [
    { l: "Warm-up", s: 300, p: "easy", k: "warm" }, { l: "Long steady", s: 3600, p: "easy", k: "work" }, { l: "Cool-down", s: 120, p: "easy", k: "cool" }] },
};
/* ============================ CADENCE DJ — music / BPM matching ============================ */
const CAD_TARGETS = [
  { k: "Easy", spm: 168, col: C.green }, { k: "Steady", spm: 174, col: C.amber },
  { k: "Threshold", spm: 178, col: C.accent }, { k: "Intervals", spm: 183, col: C.deep },
];
function CadenceDJ() {
  const [spm, setSpm] = useState(174);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const ctxRef = useRef(null), timerRef = useRef(null);
  const click = () => { try { if (!SOUND_ON) return; const ctx = ctxRef.current; if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 1500; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05); o.start(); o.stop(ctx.currentTime + 0.06); } catch (e) {} };
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!playing) return;
    click(); setBeat((b) => b + 1);
    timerRef.current = setInterval(() => { click(); setBeat((b) => b + 1); }, 60000 / spm);
    return () => clearInterval(timerRef.current);
  }, [playing, spm]);
  useEffect(() => () => clearInterval(timerRef.current), []);
  const toggle = () => { if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); } if (ctxRef.current && ctxRef.current.resume) ctxRef.current.resume(); setPlaying((p) => !p); };
  const songLink = `https://www.google.com/search?q=running+songs+at+${spm}+bpm+playlist`;
  return (
    <>
      <Card style={{ padding: 22, textAlign: "center", marginBottom: 14 }}>
        <div key={beat} style={{ width: 120, height: 120, margin: "4px auto 10px", borderRadius: "50%", border: `3px solid ${C.accent}`, display: "grid", placeItems: "center", animation: playing ? "heartBeat .25s" : "none", boxShadow: playing ? "0 0 22px -4px rgba(226,68,31,.5)" : "none" }}>
          <div><div style={{ ...serif, fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{spm}</div><div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".12em" }}>STEPS / MIN</div></div>
        </div>
        <input type="range" min={150} max={190} value={spm} onChange={(e) => setSpm(+e.target.value)} style={{ width: "85%" }} />
        <div style={{ marginTop: 14 }}>
          <button onClick={toggle} style={{ ...mono, fontSize: 14, fontWeight: 600, color: "#fff", background: playing ? C.ink : C.accent, border: "none", borderRadius: 999, padding: "11px 28px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>{playing ? <><Pause size={17} /> Stop beat</> : <><Play size={17} /> Feel the beat</>}</button>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {CAD_TARGETS.map((t) => (
          <button key={t.k} onClick={() => setSpm(t.spm)} style={{ ...mono, fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${spm === t.spm ? t.col : C.line}`, background: spm === t.spm ? t.col : "transparent", color: spm === t.spm ? "#fff" : C.soft }}>{t.k} · {t.spm}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
        <Card style={{ padding: 14 }}><div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em" }}>MATCH 1:1</div><div style={{ ...serif, fontSize: 26, fontWeight: 800, margin: "4px 0 2px" }}>{spm} <span style={{ fontSize: 13, color: C.soft }}>BPM</span></div><div style={{ fontSize: 12, color: C.soft }}>Step on every beat — driving, up-tempo tracks.</div></Card>
        <Card style={{ padding: 14 }}><div style={{ ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em" }}>HALF-TIME GROOVE</div><div style={{ ...serif, fontSize: 26, fontWeight: 800, margin: "4px 0 2px" }}>{Math.round(spm / 2)} <span style={{ fontSize: 13, color: C.soft }}>BPM</span></div><div style={{ fontSize: 12, color: C.soft }}>Two steps per beat — hip-hop, R&B feel.</div></Card>
      </div>
      <a href={songLink} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", background: C.ink, color: C.paper, borderRadius: 12, padding: "12px", ...mono, fontSize: 13, fontWeight: 600, marginBottom: 16 }}><Music size={16} /> Find songs at {spm} BPM</a>
      <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "13px 16px", fontSize: 12.5, color: C.soft }}>
        <b style={{ color: C.ink }}>Why cadence matters:</b> nudging toward ~175–180 steps/min shortens your stride, lands your foot under your hips, and cuts braking and impact — free speed and fewer niggles. Matching music to the tempo makes it effortless to hold.
      </div>
    </>
  );
}

/* ============================ STRENGTH STUDIO ============================ */
const STRENGTH_SESSIONS = [
  { k: "Power", name: "Power & plyometrics", col: C.accent, why: "Trains the elastic top-end power your Athlete DNA flags as your frontier — it transfers straight to speed.", ex: [
    { n: "Pogo hops", s: "3 × 20", c: "Stiff ankles, minimal ground contact — quick and springy." },
    { n: "Box / step jumps", s: "4 × 5", c: "Explode up, land soft and quiet, full reset between reps." },
    { n: "Bounding", s: "4 × 20 m", c: "Big powerful strides — drive the knee, push the ground back." },
    { n: "Single-leg hops", s: "3 × 8 each", c: "Control every landing — builds force and stability." }] },
  { k: "Foundations", name: "Foundations — posterior chain", col: C.green, why: "Builds the glutes and hamstrings that power push-off and shield your knees over long miles.", ex: [
    { n: "Goblet squat", s: "3 × 8", c: "Chest tall, knees track over toes, drive through mid-foot." },
    { n: "Romanian deadlift", s: "3 × 8", c: "Hinge at the hips, soft knees, feel the hamstrings load." },
    { n: "Reverse lunge", s: "3 × 8 each", c: "Long step back, front shin vertical, controlled." },
    { n: "Single-leg calf raise", s: "3 × 12 each", c: "Full range, pause at the top — Achilles armour." }] },
  { k: "Core", name: "Core & hip stability", col: C.amber, why: "A stable core and hips keep your stride aligned and ward off the IT-band and hip niggles runners pick up.", ex: [
    { n: "Front plank", s: "3 × 40 s", c: "Straight line head-to-heel, squeeze glutes, don't sag." },
    { n: "Side plank", s: "3 × 30 s each", c: "Stack the hips, lift tall." },
    { n: "Dead bug", s: "3 × 10 each", c: "Low back pinned to the floor, slow opposite arm and leg." },
    { n: "Clamshell / band walk", s: "3 × 12", c: "Keep tension on the band, feel the side glute switch on." }] },
  { k: "Mobility", name: "Mobility & prehab", col: C.blue, why: "Ten quiet minutes that keep you durable across running, climbing, cycling and skating alike.", ex: [
    { n: "World's greatest stretch", s: "5 each side", c: "Open the hips and T-spine, breathe into the rotation." },
    { n: "Ankle rocks", s: "15 each", c: "Knee over toes — build the dorsiflexion runners need." },
    { n: "90/90 hip switch", s: "10 each", c: "Slow, controlled rotation through the hips." },
    { n: "Calf & hip-flexor stretch", s: "45 s each", c: "Lengthen exactly what running tightens." }] },
];
const STR_WEEK = [
  ["Mon", "Easy run", "Core (PM)", C.green], ["Tue", "Threshold", "Power — after the run", C.accent],
  ["Wed", "Easy / off", "Mobility", C.blue], ["Thu", "Easy run", "Core", C.amber],
  ["Fri", "Pre-long shake-out", "Mobility only — legs fresh", C.blue], ["Sat", "Long run", "—", C.soft], ["Sun", "Rest / cross-train", "—", C.soft],
];
function Strength() {
  const [sel, setSel] = useState("Power");
  const [done, setDone] = useState([]);
  const [last, setLast] = useState({});
  const [toast, setToast] = useState("");
  const sess = STRENGTH_SESSIONS.find((s) => s.k === sel);
  useEffect(() => { store.get("strength-done").then((d) => setLast(d || {})); }, []);
  useEffect(() => { setDone([]); }, [sel]);
  const toggle = (i) => setDone((d) => d.includes(i) ? d.filter((x) => x !== i) : [...d, i]);
  const complete = () => { const next = { ...last, [sel]: todayKey() }; setLast(next); store.set("strength-done", next); setToast(`${sess.name} logged 💪`); setTimeout(() => setToast(""), 2600); };
  const pct = Math.round((done.length / sess.ex.length) * 100);
  return (
    <div>
      {toast && <div style={{ position: "fixed", left: "50%", bottom: 92, transform: "translateX(-50%)", zIndex: 70, background: C.ink, color: C.paper, ...mono, fontSize: 13, padding: "10px 18px", borderRadius: 999, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", animation: "dropIn .4s both" }}>{toast}</div>}
      <SectionTitle n="01">Strength studio</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>Two short sessions a week is the single biggest thing your training is missing — it builds the power your DNA calls your frontier and keeps you injury-free across every sport you do.</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {STRENGTH_SESSIONS.map((s) => (
          <button key={s.k} onClick={() => setSel(s.k)} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${sel === s.k ? s.col : C.line}`, background: sel === s.k ? s.col : "transparent", color: sel === s.k ? "#fff" : C.soft }}>{s.k}{last[s.k] ? " ✓" : ""}</button>
        ))}
      </div>
      <Card style={{ padding: 18, borderTop: `4px solid ${sess.col}`, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ ...serif, fontSize: 20, fontWeight: 700 }}>{sess.name}</span>
          {last[sel] && <span style={{ ...mono, fontSize: 10.5, color: C.green }}>last {last[sel]}</span>}
        </div>
        <p style={{ fontSize: 12.5, color: C.soft, margin: "6px 0 12px", lineHeight: 1.5 }}>{sess.why}</p>
        <div style={{ height: 7, borderRadius: 99, background: C.line, overflow: "hidden", marginBottom: 14 }}><div style={{ width: `${pct}%`, height: "100%", background: sess.col, transition: "width .4s" }} /></div>
        {sess.ex.map((e, i) => {
          const on = done.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 4px", borderBottom: `1px dashed ${C.line}`, background: "transparent", border: "none", borderBottomStyle: "dashed", cursor: "pointer", opacity: on ? 0.55 : 1 }}>
              <span style={{ width: 24, height: 24, flex: "none", borderRadius: 7, background: on ? sess.col : "transparent", border: `1.5px solid ${sess.col}`, display: "grid", placeItems: "center", marginTop: 1 }}>{on && <Check size={14} color="#fff" />}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 14, textDecoration: on ? "line-through" : "none" }}>{e.n}</b><span style={{ ...mono, fontSize: 12, color: sess.col, flex: "none" }}>{e.s}</span></span>
                <span style={{ display: "block", fontSize: 12, color: C.soft, marginTop: 2 }}>{e.c}</span>
              </span>
            </button>
          );
        })}
        <button onClick={complete} style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", color: "#fff", background: sess.col, ...mono, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Dumbbell size={16} /> Mark session complete</button>
      </Card>
      <SectionTitle n="02"><span style={{ marginTop: 4, display: "inline-block" }}>Your week, one view</span></SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 10 }}>Where strength fits around your runs — power on quality days, mobility before the long run, nothing heavy on tired legs.</p>
      <Card style={{ padding: 8 }}>
        {STR_WEEK.map(([d, run, str, col], i) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: i < 6 ? `1px dashed ${C.line}` : "none" }}>
            <span style={{ ...mono, fontSize: 12, fontWeight: 700, width: 36, color: C.ink }}>{d}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{run}</span>
            <span style={{ ...mono, fontSize: 11.5, color: col, textAlign: "right", flex: 1 }}>{str}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Train() {
  const [mode, setMode] = useState("guided");
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

  /* ---- guided session player ---- */
  const [sessKey, setSessKey] = useState("threshold");
  const sess = SESSIONS[sessKey];
  const steps = sess.steps;
  const totalSec = steps.reduce((a, s) => a + s.s, 0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef(null), prevIdx = useRef(0);
  const [ritual, setRitual] = useState(false);
  const startNow = () => { if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); } if (ctxRef.current && ctxRef.current.resume) ctxRef.current.resume(); setPlaying(true); };
  const beep = (freq = 1000, dur = 0.12, vol = 0.4) => {
    try { if (!SOUND_ON) return; if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); } const ctx = ctxRef.current; if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); o.start(); o.stop(ctx.currentTime + dur + 0.02); } catch (e) {}
  };
  useEffect(() => { setElapsed(0); setPlaying(false); prevIdx.current = 0; }, [sessKey]);
  useEffect(() => { if (!playing) return; const id = setInterval(() => setElapsed((e) => Math.min(totalSec, e + 1)), 1000); return () => clearInterval(id); }, [playing, totalSec]);
  let acc = 0, idx = 0; for (let i = 0; i < steps.length; i++) { if (elapsed < acc + steps[i].s) { idx = i; break; } acc += steps[i].s; idx = i; }
  const stepStart = steps.slice(0, idx).reduce((a, s) => a + s.s, 0);
  const done = elapsed >= totalSec;
  const cur = steps[Math.min(idx, steps.length - 1)];
  const stepRem = done ? 0 : cur.s - (elapsed - stepStart);
  const stepPct = done ? 1 : (elapsed - stepStart) / cur.s;
  useEffect(() => { if (idx !== prevIdx.current) { beep(880); prevIdx.current = idx; } }, [idx]);
  useEffect(() => { if (done && playing) { beep(1320, 0.5); setPlaying(false); } }, [done, playing]);
  const toggle = () => { if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); } if (ctxRef.current && ctxRef.current.resume) ctxRef.current.resume(); setPlaying((p) => !p); };

  /* ---- race pacing ---- */
  const T1 = 46 * 60 + 10, D1 = 10000;
  const [dist, setDist] = useState("Half");
  const dm = GOAL_DIST[dist] || 21097.5;
  const km = dm / 1000;
  const [goal, setGoal] = useState(Math.round(riegel(T1, D1, dm)));
  useEffect(() => { setGoal(Math.round(riegel(T1, D1, GOAL_DIST[dist] || 21097.5))); }, [dist]);
  const [strat, setStrat] = useState("neg");
  const splits = useMemo(() => {
    const n = Math.max(1, Math.round(km)), base = goal / km;
    const factor = (i) => { const f = (i + 0.5) / n; return strat === "even" ? 1 : strat === "neg" ? 1.03 - 0.06 * f : 0.97 + 0.06 * f; };
    const raw = []; for (let i = 0; i < n; i++) raw.push(base * factor(i));
    const corr = goal / raw.reduce((a, b) => a + b, 0);
    let cum = 0; return raw.map((p, i) => { const pace = p * corr; cum += pace; return { km: i + 1, pace, cum, sec: Math.round(pace) }; });
  }, [dist, goal, strat, km]);

  return (
    <div>
      <SectionTitle n="01">Guided training</SectionTitle>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {[["guided", "🎧 Guided session"], ["race", "🏁 Race plan"], ["cadence", "🎵 Cadence"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{ ...mono, fontSize: 13, padding: "9px 15px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${mode === k ? C.accent : C.line}`, background: mode === k ? C.accent : "transparent", color: mode === k ? "#fff" : C.soft }}>{l}</button>
        ))}
      </div>

      {mode === "guided" && (
        <>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(SESSIONS).map(([k, v]) => (
              <button key={k} onClick={() => setSessKey(k)} style={{ ...mono, fontSize: 12, padding: "7px 12px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${sessKey === k ? v.color : C.line}`, background: sessKey === k ? v.color : "transparent", color: sessKey === k ? "#fff" : C.soft }}>{v.name}</button>
            ))}
          </div>
          <Card style={{ padding: 22, marginBottom: 14, textAlign: "center", borderTop: `4px solid ${done ? C.green : cur.k === "work" ? sess.color : C.line}` }}>
            {done ? (
              <div style={{ animation: "popIn .5s" }}>
                <div style={{ fontSize: 50 }}>🎉</div>
                <div style={{ ...serif, fontSize: 26, fontWeight: 800, marginTop: 4 }}>Session complete</div>
                <div style={{ fontSize: 13.5, color: C.soft, marginTop: 4 }}>{sess.name} · {mmss(totalSec)} done. Log it in the Log tab to bank the XP.</div>
              </div>
            ) : (
              <>
                <div style={{ ...mono, fontSize: 11, letterSpacing: ".14em", color: C.soft }}>STEP {idx + 1} / {steps.length} · {cur.k === "work" ? "WORK" : cur.k === "rec" ? "RECOVER" : cur.k.toUpperCase()}</div>
                <div style={{ ...serif, fontSize: 28, fontWeight: 800, color: cur.k === "work" ? sess.color : C.ink, margin: "4px 0" }}>{cur.l}</div>
                <div style={{ ...serif, fontSize: 60, fontWeight: 800, lineHeight: 1, color: C.ink }}>{mmss(stepRem)}</div>
                <div style={{ ...mono, fontSize: 13, color: PACE_COL[cur.p] || C.soft, marginTop: 4 }}>target {PACE_LABEL[cur.p]}</div>
                <div style={{ height: 7, borderRadius: 99, background: C.line, overflow: "hidden", margin: "14px 0 6px" }}><div style={{ width: `${Math.round(stepPct * 100)}%`, height: "100%", background: cur.k === "work" ? sess.color : C.soft, transition: "width .9s linear" }} /></div>
                <div style={{ ...mono, fontSize: 10.5, color: C.soft }}>overall {mmss(elapsed)} / {mmss(totalSec)}</div>
              </>
            )}
          </Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button onClick={() => { if (playing || elapsed > 0) toggle(); else setRitual(true); }} disabled={done} style={{ flex: 2, border: "none", borderRadius: 14, padding: "15px", cursor: done ? "default" : "pointer", color: "#fff", background: done ? C.line : playing ? C.ink : sess.color, ...mono, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{playing ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {elapsed > 0 ? "Resume" : "Start session"}</>}</button>
            <button onClick={() => setElapsed(Math.min(totalSec, stepStart + cur.s))} disabled={done} style={{ flex: 1, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "15px", cursor: "pointer", color: C.deep, background: "transparent", ...mono, fontSize: 13, fontWeight: 600 }}>Skip ▸</button>
            <button onClick={() => { setElapsed(0); setPlaying(false); }} style={{ flex: 1, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "15px", cursor: "pointer", color: C.soft, background: "transparent", ...mono, fontSize: 13, fontWeight: 600 }}>Reset</button>
          </div>
          {ritual && <PreRunRitual sess={sess} onGo={() => { setRitual(false); startNow(); }} />}
          <div style={{ background: "#EDE7D9", border: `1px dashed ${C.soft}`, borderRadius: 12, padding: "12px 16px", fontSize: 12.5, color: C.soft, marginBottom: 16 }}>🎧 <b style={{ color: C.ink }}>{sess.cue}</b></div>
          <div style={{ marginBottom: 6 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 4px", opacity: i < idx && !done ? 0.45 : 1, borderBottom: `1px dashed ${C.line}` }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", flex: "none", background: i === idx && !done ? sess.color : i < idx || done ? C.green : C.paper, border: `1.5px solid ${i <= idx || done ? sess.color : C.line}`, display: "grid", placeItems: "center" }}>{(i < idx || done) ? <Check size={13} color="#fff" /> : <span style={{ ...mono, fontSize: 10, color: i === idx ? "#fff" : C.soft }}>{i + 1}</span>}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: i === idx && !done ? 700 : 400 }}>{s.l}</span>
                <span style={{ ...mono, fontSize: 11, color: C.soft }}>{mmss(s.s)} · {PACE_LABEL[s.p]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {mode === "cadence" && <CadenceDJ />}

      {mode === "race" && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {["5K", "10K", "Half", "Marathon"].map((d) => (
              <button key={d} onClick={() => setDist(d)} style={{ ...mono, fontSize: 12, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${dist === d ? C.accent : C.line}`, background: dist === d ? C.accent : "transparent", color: dist === d ? "#fff" : C.soft }}>{d}</button>
            ))}
          </div>
          <Card style={{ padding: 18, marginBottom: 14, textAlign: "center" }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: ".12em", color: C.soft }}>GOAL FINISH TIME</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "8px 0" }}>
              <button onClick={() => setGoal((g) => g + 15)} style={{ ...mono, fontSize: 18, width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.line}`, background: "transparent", cursor: "pointer", color: C.deep }}>−</button>
              <div style={{ ...serif, fontSize: 40, fontWeight: 800, color: C.accent, minWidth: 150 }}>{fmtTime(goal)}</div>
              <button onClick={() => setGoal((g) => Math.max(60, g - 15))} style={{ ...mono, fontSize: 18, width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.line}`, background: "transparent", cursor: "pointer", color: C.deep }}>+</button>
            </div>
            <button onClick={() => setGoal(Math.round(riegel(T1, D1, dm)))} style={{ ...mono, fontSize: 11.5, color: C.deep, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>use my predicted ({fmtTime(Math.round(riegel(T1, D1, dm)))})</button>
            <div style={{ ...mono, fontSize: 12, color: C.soft, marginTop: 8 }}>avg {secToPace(goal / km)}/km</div>
          </Card>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["even", "Even"], ["neg", "Negative split"], ["fast", "Fast start"]].map(([k, l]) => (
              <button key={k} onClick={() => setStrat(k)} style={{ flex: 1, ...mono, fontSize: 12, padding: "9px 6px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${strat === k ? C.deep : C.line}`, background: strat === k ? C.deep : "transparent", color: strat === k ? "#fff" : C.soft }}>{l}</button>
            ))}
          </div>
          <Card style={{ padding: "14px 8px 6px", marginBottom: 14 }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={splits}>
                <defs>
                  <linearGradient id="splitG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5FBF88" /><stop offset="100%" stopColor={C.green} /></linearGradient>
                  <linearGradient id="splitA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E7B557" /><stop offset="100%" stopColor={C.amber} /></linearGradient>
                  <linearGradient id="splitR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F4794F" /><stop offset="100%" stopColor={C.accent} /></linearGradient>
                </defs>
                <XAxis dataKey="km" tick={{ ...mono, fontSize: 9, fill: C.soft }} interval={Math.floor(splits.length / 12)} />
                <YAxis domain={["dataMin-8", "dataMax+8"]} hide reversed />
                <Tooltip formatter={(v) => [secToPace(v) + "/km", "pace"]} labelFormatter={(l) => `km ${l}`} contentStyle={{ ...mono, fontSize: 12, borderRadius: 10 }} />
                <Bar dataKey="sec" radius={[3, 3, 0, 0]}>{splits.map((s, i) => <Cell key={i} fill={i < splits.length / 3 ? "url(#splitG)" : i < (splits.length * 2) / 3 ? "url(#splitA)" : "url(#splitR)"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", ...mono, fontSize: 10, color: C.soft, letterSpacing: ".08em", padding: "8px 14px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.card }}><span style={{ width: 50 }}>KM</span><span style={{ flex: 1 }}>TARGET PACE</span><span>ELAPSED</span></div>
            {splits.map((s) => (
              <div key={s.km} style={{ display: "flex", alignItems: "center", ...mono, fontSize: 13, padding: "9px 14px", borderBottom: `1px dashed ${C.line}` }}>
                <span style={{ width: 50, fontWeight: 700 }}>{s.km}</span>
                <span style={{ flex: 1, color: C.deep }}>{secToPace(s.pace)}/km</span>
                <span style={{ color: C.soft }}>{fmtTime(s.cum)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {[["First third", "Run it controlled — bank patience, not seconds. It should feel too easy.", C.green], ["Middle third", "Lock into goal pace and rhythm. Stay relaxed, stay fuelled.", C.amber], ["Final third", "Now you spend it — empty the tank, pick people off, finish strong.", C.accent]].map(([t, d, c]) => (
              <div key={t} style={{ borderLeft: `4px solid ${c}`, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 14px" }}><div style={{ fontWeight: 700, fontSize: 13.5, color: c }}>{t}</div><div style={{ fontSize: 12.5, color: C.soft, marginTop: 2 }}>{d}</div></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ AI COACH (Claude in artifact) ============================ */
function Coach() {
  const ctx = `You are STRIDE, ${ATHLETE.name}'s personal running coach embedded in her performance app. You have full access to her Apple Health data:
- VO2 max 48.9 (rose 38->43->49 in 6 months), resting HR 46, max HR ~190, HRV avg 76 (ceiling 107), estimated VDOT ~47.
- Race-equivalents: 5K ~22:15, 10K ~46:10, Half ~1:42, Marathon ~3:33. Goal: sub-1:45 half on 20 June.
- Training is ~100% easy (6:00-6:50/km); ZERO threshold/VO2 work — her biggest opportunity (target 80/20).
- ~33 km/week running plus heavy cross-training (climbing 22x, cycling, skating). Long runs 17-19km.
- Current state: a recovery dip (HRV down to 60s, RHR up to 52-54, SpO2 dipped to 93-94%), ACWR ~1.3 from back-to-back 24km on 24-25 May. Sleep 5-7.5h, fragmented — her main limiter. Lean build (BMI 19.8); fuelling/iron status unknown.
Be specific, scientific, warm and concise. Reference her actual numbers. Give practical running advice. You are not a doctor; for the post-viral/iron/thyroid questions, suggest her GP. Keep replies under ~120 words unless asked for depth.`;

  const [msgs, setMsgs] = useState([{ role: "assistant", content: `Hi ${ATHLETE.name} — I'm STRIDE, and I've read all your data. Ask me anything: why your HRV dipped, how to add speed without losing your base, what today's session should be, how to pace the half. Where shall we start?` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const chips = ["Why did my HRV dip?", "How do I add the missing 20%?", "What should I run today?", "How do I pace sub-1:45?"];

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000, system: ctx,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setMsgs([...next, { role: "assistant", content: reply || "Sorry — I couldn't generate a reply just then. Try again?" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "I hit a connection error. Give it another go in a moment." }]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <SectionTitle n="AI">Coach STRIDE</SectionTitle>
      <p style={{ fontSize: 13.5, color: C.soft, marginBottom: 12 }}>A coach that actually knows your numbers — something no running app on the market ships. Powered by Claude, grounded in your data.</p>
      <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: 460 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "82%", padding: "11px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
                background: m.role === "user" ? C.ink : C.paper, color: m.role === "user" ? C.paper : C.ink,
                border: m.role === "user" ? "none" : `1px solid ${C.line}` }}>{m.content}</div>
            </div>
          ))}
          {loading && <Dots label="STRIDE is thinking" />}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
            {chips.map((c) => (
              <button key={c} onClick={() => send(c)} disabled={loading} style={{ ...mono, fontSize: 11, padding: "6px 10px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.paper, cursor: "pointer", color: C.deep }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask your coach…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14, outline: "none" }} />
            <button onClick={() => send()} disabled={loading} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "0 16px", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
