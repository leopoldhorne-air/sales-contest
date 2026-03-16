import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ─────────────────────────────────────────────────────────
const SALES_REPS = [
  { name: "Alex Aaron", team: "Sales", role: "AE" },
  { name: "Marley Cavalcanti", team: "Sales", role: "AE" },
  { name: "Luke Dial", team: "Sales", role: "AE" },
  { name: "Zoe Kruize", team: "Sales", role: "AE" },
  { name: "Eric Magne", team: "Sales", role: "AE" },
  { name: "Jeff Randorf", team: "Sales", role: "AE" },
  { name: "Jacob Rhee", team: "Sales", role: "AE" },
  { name: "Austin Villela", team: "Sales", role: "AE" },
];
const AAE_REPS = [
  { name: "Graham Collector", team: "AAE", role: "AAE" },
  { name: "Kyle Haslett", team: "AAE", role: "AAE" },
  { name: "Jacqueline Lo", team: "AAE", role: "AAE" },
  { name: "Julia Veith", team: "AAE", role: "AAE" },
];
const CS_REPS = [
  { name: "Daniel Alexander", team: "CS", role: "CSM" },
  { name: "Will Auther", team: "CS", role: "CSM" },
  { name: "Evan Opolski", team: "CS", role: "CSM" },
  { name: "Hazan Raza", team: "CS", role: "CSM" },
  { name: "Cayla Wolfberg", team: "CS", role: "CSM" },
];
const SALES_ACTIONS = [
  { id: "canvas_business", label: "New business Canvas on Business plan", points: 10 },
  { id: "canvas_enterprise", label: "New business Canvas on Enterprise plan", points: 25 },
  { id: "credit_addon", label: "Credit add-on at close", points: 5 },
  { id: "first_canvas", label: "First Canvas-led deal (one-time per rep)", points: 10 },
  { id: "multi_year", label: "Multi-year deal on new pricing", points: 10 },
];
const CS_ACTIONS = [
  { id: "migration", label: "Customer migrated to new credit-based plan", points: 10 },
  { id: "tier_upgrade", label: "Customer upgraded tier (e.g., Starter → Business)", points: 15 },
  { id: "enterprise_upgrade", label: "Customer upgraded to Enterprise", points: 25 },
  { id: "credit_addon", label: "Credit add-on sold (per 1K credits)", points: 5 },
  { id: "brand_kit", label: "Customer completed Brand Kit setup", points: 5, bonus: true },
  { id: "expansion_5k", label: "Expansion deal over $5K incremental ARR", points: 5, bonus: true },
  { id: "expansion_15k", label: "Expansion deal over $15K incremental ARR", points: 15, bonus: true },
  { id: "multi_year_renewal", label: "Multi-year renewal with upgrade to new pricing", points: 10, bonus: true },
];
const AAE_ACTIONS = [
  { id: "meeting_booked", label: "Canvas-focused meeting booked (LinkedIn, email)", points: 5 },
  { id: "cold_call_meeting", label: "Canvas cold call meeting booked", points: 8 },
  { id: "meeting_held", label: "Canvas-focused meeting held", points: 5 },
  { id: "held_to_sql", label: "Held to SQL", points: 5 },
];
const ARR_TIERS = [
  { threshold: 800000, label: "$800K", prize: "🔒 Prize TBA. Trust us, you want this one." },
  { threshold: 900000, label: "$900K", prize: "🔒🔒 It gets better. Way better." },
  { threshold: 1000000, label: "$1M", prize: "🔒🔒🔒 Hit seven figures and find out." },
];

// ─── AIR BRAND COLORS ───────────────────────────────────────────────
const AIR = {
  bg: "#1a1a1a",
  surface: "#242424",
  surfaceHover: "#2e2e2e",
  border: "rgba(255,255,255,0.08)",
  borderActive: "rgba(255,255,255,0.16)",
  text: "#f0f0f0",
  textMuted: "#999",
  textDim: "#666",
  cyan: "#4dd4e6",
  cyanDim: "rgba(77,212,230,0.12)",
  cyanBorder: "rgba(77,212,230,0.25)",
  blue: "#2d7ff9",
  teal: "#3aada8",
  tealDim: "rgba(58,173,168,0.12)",
  tealBorder: "rgba(58,173,168,0.25)",
  gold: "#d4a843",
  goldDim: "rgba(212,168,67,0.12)",
  goldBorder: "rgba(212,168,67,0.25)",
  tan: "#c4a882",
  olive: "#a3b87c",
  pink: "#e8a0bf",
  red: "#e84855",
  orange: "#f26430",
  green: "#3aada8",
  greenDim: "rgba(58,173,168,0.12)",
  greenBorder: "rgba(58,173,168,0.25)",
};

function formatCurrency(n) { return "$" + n.toLocaleString("en-US"); }

// ─── SHARED STORAGE ─────────────────────────────────────────────────
async function loadDeals() {
  try {
    const result = await window.storage.get("spiff-deals", true);
    return result ? JSON.parse(result.value) : [];
  } catch { return []; }
}
async function saveDeals(deals) {
  try { await window.storage.set("spiff-deals", JSON.stringify(deals), true); } catch (e) { console.error("Save failed", e); }
}
async function loadFirstCanvas() {
  try {
    const result = await window.storage.get("spiff-first-canvas", true);
    return result ? JSON.parse(result.value) : {};
  } catch { return {}; }
}
async function saveFirstCanvas(fc) {
  try { await window.storage.set("spiff-first-canvas", JSON.stringify(fc), true); } catch (e) { console.error("Save failed", e); }
}

// ─── STYLES ─────────────────────────────────────────────────────────
const labelStyle = { display: "block", marginBottom: 6, fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.textMuted, letterSpacing: "0.08em" };
const selectStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", appearance: "auto" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" };

const AIR_LOGO_URI = "data:image/png;base64,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";

// Team colors helper
function teamColor(team) {
  if (team === "Sales") return { primary: AIR.cyan, dim: AIR.cyanDim, border: AIR.cyanBorder, label: "🔵 SALES" };
  if (team === "AAE") return { primary: AIR.gold, dim: AIR.goldDim, border: AIR.goldBorder, label: "🟡 AAE" };
  return { primary: AIR.teal, dim: AIR.tealDim, border: AIR.tealBorder, label: "🟢 CS" };
}

// ─── APP ────────────────────────────────────────────────────────────
export default function CanvasSPIFF() {
  const [deals, setDeals] = useState([]);
  const [firstCanvas, setFirstCanvas] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("leaderboard");
  const [submitTeam, setSubmitTeam] = useState("Sales");
  const [submitRep, setSubmitRep] = useState("");
  const [submitActions, setSubmitActions] = useState([]);
  const [submitARR, setSubmitARR] = useState("");
  const [submitAccount, setSubmitAccount] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitGong, setSubmitGong] = useState("");
  const [submitLegacy, setSubmitLegacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeBoard, setActiveBoard] = useState("Sales");
  const [deletingId, setDeletingId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, fc] = await Promise.all([loadDeals(), loadFirstCanvas()]);
      setDeals(d); setFirstCanvas(fc); setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    setSyncing(true);
    const [d, fc] = await Promise.all([loadDeals(), loadFirstCanvas()]);
    setDeals(d); setFirstCanvas(fc); setSyncing(false);
  };

  const getScores = useCallback((team) => {
    const reps = team === "Sales" ? SALES_REPS : team === "AAE" ? AAE_REPS : CS_REPS;
    const scores = {};
    reps.forEach(r => { scores[r.name] = { points: 0, arr: 0, deals: 0, role: r.role }; });
    deals.filter(d => d.team === team).forEach(d => {
      if (!scores[d.rep]) scores[d.rep] = { points: 0, arr: 0, deals: 0, role: "?" };
      scores[d.rep].points += d.points;
      scores[d.rep].arr += d.arr || 0;
      scores[d.rep].deals += 1;
    });
    return Object.entries(scores).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.points - a.points);
  }, [deals]);

  const totalARR = 175000 + deals.reduce((s, d) => s + (d.arr || 0), 0);
  const creditsARR = deals.filter(d => !d.isLegacy).reduce((s, d) => s + (d.arr || 0), 0);
  const currentTier = [...ARR_TIERS].reverse().find(t => totalARR >= t.threshold);
  const nextTier = ARR_TIERS.find(t => totalARR < t.threshold);

  const handleSubmit = async () => {
    if (!submitRep) return;
    if (!submitLegacy && submitActions.length === 0) return;
    let pts = 0;
    const newFC = { ...firstCanvas };
    if (!submitLegacy) {
      const actions = submitTeam === "Sales" ? SALES_ACTIONS : submitTeam === "AAE" ? AAE_ACTIONS : CS_ACTIONS;
      submitActions.forEach(aId => {
        const action = actions.find(a => a.id === aId);
        if (action) {
          if (aId === "first_canvas") { if (!newFC[submitRep]) { pts += action.points; newFC[submitRep] = true; } }
          else { pts += action.points; }
        }
      });
    }
    const deal = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      team: submitTeam, rep: submitRep, actions: submitLegacy ? ["legacy_deal"] : submitActions, points: pts,
      arr: parseInt(submitARR) || 0, account: submitAccount, notes: submitNotes,
      gong: submitGong, isLegacy: submitLegacy, date: new Date().toISOString(),
    };
    const newDeals = [...deals, deal];
    setDeals(newDeals); setFirstCanvas(newFC);
    await Promise.all([saveDeals(newDeals), saveFirstCanvas(newFC)]);
    setSubmitActions([]); setSubmitARR(""); setSubmitAccount(""); setSubmitNotes(""); setSubmitGong(""); setSubmitLegacy(false);
    setSubmitted(true); setTimeout(() => setSubmitted(false), 2500);
  };

  const handleDelete = async (id) => {
    const newDeals = deals.filter(d => d.id !== id);
    setDeals(newDeals); await saveDeals(newDeals); setDeletingId(null);
  };

  const toggleAction = (actionId) => {
    setSubmitActions(prev => prev.includes(actionId) ? prev.filter(a => a !== actionId) : [...prev, actionId]);
  };

  const repsForTeam = submitTeam === "Sales" ? SALES_REPS : submitTeam === "AAE" ? AAE_REPS : CS_REPS;
  const actionsForTeam = submitTeam === "Sales" ? SALES_ACTIONS : submitTeam === "AAE" ? AAE_ACTIONS : CS_ACTIONS;
  const tc = teamColor(activeBoard);

  if (loading) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: AIR.textMuted, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: AIR.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", margin: "0 auto 12px",  }}><img src={AIR_LOGO_URI} style={{ width: 48, height: 48,  }} alt="Air" /></div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", color: AIR.cyan }}>LOADING CREDITS LAUNCH...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: AIR.bg, color: AIR.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${AIR.border}`, background: `linear-gradient(180deg, rgba(77,212,230,0.04) 0%, transparent 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden" }}><img src={AIR_LOGO_URI} style={{ width: 40, height: 40,  }} alt="Air" /></div>
            <div>
              <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>CREDITS LAUNCH</h1>
              <p style={{ fontSize: 11, color: AIR.textMuted, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>SALES & CS CONTEST · MARCH 16–31</p>
            </div>
          </div>
          <button onClick={refresh} disabled={syncing} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer", opacity: syncing ? 0.5 : 1 }}>
            {syncing ? "↻ Syncing..." : "↻ Refresh"}
          </button>
        </div>

        {/* MARCH TOTAL ARR — THE NUMBER (group prize) */}
        <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: AIR.surface, border: `1px solid ${AIR.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.textMuted, letterSpacing: "0.1em" }}>MARCH TOTAL ARR — THE NUMBER</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: currentTier ? AIR.teal : "#fff" }}>{formatCurrency(totalARR)}</span>
          </div>
          {/* Tier milestone markers */}
          <div style={{ position: "relative", marginBottom: 4 }}>
            {ARR_TIERS.map((tier, i) => {
              const pct = (tier.threshold / 1200000) * 100;
              const hit = totalARR >= tier.threshold;
              const tierPct = Math.round((totalARR / tier.threshold) * 100);
              return (
                <div key={i} style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: hit ? AIR.teal : "#fff", marginBottom: 2 }}>{tier.label}</div>
                  <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: hit ? AIR.teal : AIR.textDim }}>{hit ? "✓" : `${Math.min(tierPct, 99)}%`}</div>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative", marginTop: 32 }}>
            {ARR_TIERS.map((tier, i) => (<div key={i} style={{ position: "absolute", left: `${(tier.threshold / 1200000) * 100}%`, top: 0, bottom: 0, width: 2, background: totalARR >= tier.threshold ? AIR.teal : "rgba(255,255,255,0.15)", zIndex: 1 }} />))}
            <div style={{ height: "100%", borderRadius: 5, width: `${Math.min((totalARR / 1200000) * 100, 100)}%`, background: `linear-gradient(90deg, ${AIR.cyan}, ${AIR.teal}, ${AIR.olive})`, transition: "width 0.8s ease" }} />
          </div>
          {currentTier && (<div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: AIR.tealDim, border: `1px solid ${AIR.tealBorder}`, fontSize: 12, color: AIR.teal }}>🎉 Unlocked: {currentTier.prize}</div>)}
          {nextTier && (<div style={{ marginTop: 8, fontSize: 12, color: AIR.textMuted }}>{formatCurrency(nextTier.threshold - totalARR)} away from {nextTier.label} → {nextTier.prize}</div>)}
          {!nextTier && totalARR >= 1000000 && (<div style={{ marginTop: 8, fontSize: 12, color: AIR.teal }}>All tiers unlocked. Legends.</div>)}
        </div>

        {/* CREDITS ARR TRACKER */}
        <div style={{ marginTop: 8, padding: "12px 20px", borderRadius: 12, background: AIR.surface, border: `1px solid ${AIR.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.textMuted, letterSpacing: "0.1em" }}>CREDITS ARR SOLD</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: AIR.cyan }}>{formatCurrency(creditsARR)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${Math.min((creditsARR / 500000) * 100, 100)}%`, background: AIR.cyan, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: AIR.textDim }}>Credit-based pricing deals only (excludes legacy)</div>
        </div>

        {/* NAV */}
        <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
          {[{ id: "rules", label: "Contest Info" }, { id: "leaderboard", label: "Leaderboards" }, { id: "submit", label: "Submit Deal" }, { id: "deals", label: `Deal Log (${deals.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, background: view === tab.id ? AIR.cyan : AIR.surface, color: view === tab.id ? AIR.bg : AIR.textMuted, transition: "all 0.2s" }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* CONTEST INFO */}
      {view === "rules" && (
        <div style={{ padding: "24px" }}>
          <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", marginBottom: 16 }}>CREDITS LAUNCH — THE RULES</h2>
          <p style={{ fontSize: 13, color: AIR.textMuted, lineHeight: 1.6, marginBottom: 20 }}>Two-week sprint. Canvas + credit-based deals only. No legacy pricing. No deals without Canvas in the sales cycle. March 16–31.</p>

          <div style={{ padding: "14px 16px", borderRadius: 10, background: AIR.cyanDim, border: `1px solid ${AIR.cyanBorder}`, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.cyan, letterSpacing: "0.08em", marginBottom: 8 }}>WHAT COUNTS</div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}>✅ New business deals on credit-based pricing with Canvas demoed</div>
              <div style={{ marginBottom: 4 }}>✅ Existing customers migrated to new credit-based plans</div>
              <div style={{ marginBottom: 4 }}>✅ Tier upgrades, credit add-ons, and expansion on new pricing</div>
              <div style={{ marginBottom: 4 }}>✅ Brand Kit setup by existing customers in Canvas</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(232,72,85,0.06)", border: `1px solid rgba(232,72,85,0.2)`, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.red, letterSpacing: "0.08em", marginBottom: 8 }}>WHAT DOESN'T</div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}>❌ Legacy plan deals</div>
              <div style={{ marginBottom: 4 }}>❌ New biz without Canvas demo in the sales cycle</div>
              <div style={{ marginBottom: 4 }}>❌ Renewals at legacy pricing without upgrade</div>
              <div>❌ Pipeline that hasn't closed by 11:59 PM ET on March 31</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.cyan, letterSpacing: "0.08em", marginBottom: 8 }}>🔵 SALES POINTS</div>
          <div style={{ marginBottom: 20 }}>
            {SALES_ACTIONS.map(a => (<div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}><span style={{ color: AIR.textMuted }}>{a.label}</span><span style={{ fontFamily: "'Space Mono', monospace", color: AIR.cyan, fontWeight: 700 }}>+{a.points}</span></div>))}
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.teal, letterSpacing: "0.08em", marginBottom: 8 }}>🟢 CS POINTS</div>
          <div style={{ marginBottom: 20 }}>
            {CS_ACTIONS.map(a => (<div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}><span style={{ color: AIR.textMuted }}>{a.label}</span><span style={{ fontFamily: "'Space Mono', monospace", color: AIR.teal, fontWeight: 700 }}>+{a.points}</span></div>))}
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.gold, letterSpacing: "0.08em", marginBottom: 8 }}>🟡 AAE POINTS (TOP OF FUNNEL)</div>
          <div style={{ marginBottom: 20 }}>
            {AAE_ACTIONS.map(a => (<div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}><span style={{ color: AIR.textMuted }}>{a.label}</span><span style={{ fontFamily: "'Space Mono', monospace", color: AIR.gold, fontWeight: 700 }}>+{a.points}</span></div>))}
          </div>

          {/* PRIZES */}
          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.tan, letterSpacing: "0.08em", marginBottom: 8 }}>🏆 PRIZES</div>
          {[
            { label: "🔵 Sales Track (AEs)", color: AIR.cyan, bg: AIR.cyanDim, border: AIR.cyanBorder, lines: ["🥇 1st — Courtside seats + \"Canvas Closer\" title", "🥈 2nd — $300 gift card to a top NYC restaurant"] },
            { label: "🟡 AAE Track (Top of Funnel)", color: AIR.gold, bg: AIR.goldDim, border: AIR.goldBorder, lines: ["🥇 1st — $300 gift card to a top NYC restaurant"] },
            { label: "🟢 CS Track", color: AIR.teal, bg: AIR.tealDim, border: AIR.tealBorder, lines: ["🥇 1st — Courtside seats + \"Expansion Engine\" title", "🥈 2nd — $300 gift card to a top NYC restaurant"] },
          ].map((t, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: t.bg, border: `1px solid ${t.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>{t.lines.map((l, j) => <div key={j}>{l}</div>)}</div>
            </div>
          ))}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(232,160,191,0.06)", border: `1px solid rgba(232,160,191,0.2)`, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>🎙️ Call of the Week</div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              <div>Best Canvas play from any team. Decided by leadership at the end of each week. Winner gets a $150 gift card for professional development.</div>
              <div style={{ marginTop: 4, color: AIR.textDim, fontSize: 11 }}>Submit your Gong links when logging deals so leadership can review.</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(163,184,124,0.06)", border: `1px solid rgba(163,184,124,0.2)`, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>The Number — Joint ARR Targets</div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              <div>$800K — 🔒 Prize TBA. Trust us, you want this one.</div>
              <div>$900K — 🔒🔒 It gets better. Way better.</div>
              <div>$1M — 🔒🔒🔒 Hit seven figures and find out.</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.textDim, letterSpacing: "0.08em", marginBottom: 8 }}>FINE PRINT</div>
          <div style={{ fontSize: 11, color: AIR.textDim, lineHeight: 1.8 }}>
            <div>• Deals must be fully executed (signed order form) by 11:59 PM ET March 31</div>
            <div>• Canvas demo must be logged in CRM with notes. No Canvas demo = no points.</div>
            <div>• CS migrations must be live on new plan, not just quoted</div>
            <div>• Revenue leadership has final say on disputes</div>
            <div>• Leaderboard updated daily in Slack</div>
          </div>
        </div>
      )}

      {/* LEADERBOARDS */}
      {view === "leaderboard" && (
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            {["Sales", "AAE", "CS"].map(t => {
              const c = teamColor(t);
              return (<button key={t} onClick={() => setActiveBoard(t)} style={{ padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", background: activeBoard === t ? c.primary : AIR.surface, color: activeBoard === t ? AIR.bg : AIR.textDim }}>{c.label}</button>);
            })}
          </div>
          {getScores(activeBoard).map((rep, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const isTop3 = i < 3;
            const maxPts = Math.max(...getScores(activeBoard).map(r => r.points), 1);
            return (
              <div key={rep.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 6, borderRadius: 10, background: isTop3 ? tc.dim : AIR.surface, border: `1px solid ${isTop3 ? tc.border : AIR.border}` }}>
                <div style={{ width: 32, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: medal ? 20 : 14, color: medal ? undefined : AIR.textDim, fontWeight: 700 }}>{medal || (i + 1)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{rep.name}</span>
                    {rep.role === "AAE" && (<span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: AIR.goldDim, color: AIR.gold, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>AAE</span>)}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${(rep.points / maxPts) * 100}%`, background: `linear-gradient(90deg, ${tc.primary}, ${tc.primary}cc)`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: rep.points > 0 ? "#fff" : AIR.textDim }}>{rep.points}</div>
                  <div style={{ fontSize: 10, color: AIR.textDim }}>{rep.deals} deal{rep.deals !== 1 ? "s" : ""} · {formatCurrency(rep.arr)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT */}
      {view === "submit" && (
        <div style={{ padding: "24px" }}>
          <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", marginBottom: 20 }}>LOG A DEAL</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Team</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["Sales", "AAE", "CS"].map(t => { const c = teamColor(t); return (<button key={t} onClick={() => { setSubmitTeam(t); setSubmitRep(""); setSubmitActions([]); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, background: submitTeam === t ? c.primary : AIR.surface, color: submitTeam === t ? AIR.bg : AIR.textDim }}>{t}</button>); })}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Rep</label>
            <select value={submitRep} onChange={e => setSubmitRep(e.target.value)} style={selectStyle}>
              <option value="">Select rep...</option>
              {repsForTeam.map(r => (<option key={r.name} value={r.name}>{r.name} ({r.role})</option>))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Account Name</label>
            <input value={submitAccount} onChange={e => setSubmitAccount(e.target.value)} placeholder="e.g., Betterment, ZAGG" style={inputStyle} />
          </div>
          {/* LEGACY DEAL TOGGLE */}
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => { setSubmitLegacy(!submitLegacy); setSubmitActions([]); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${submitLegacy ? "rgba(242,100,48,0.4)" : AIR.border}`, background: submitLegacy ? "rgba(242,100,48,0.1)" : AIR.surface, color: submitLegacy ? AIR.orange : AIR.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: "left" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${submitLegacy ? AIR.orange : AIR.textDim}`, background: submitLegacy ? AIR.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{submitLegacy ? "✓" : ""}</div>
              <div>
                <div style={{ fontWeight: 600 }}>Legacy Deal (no contest points)</div>
                <div style={{ fontSize: 11, color: AIR.textDim, marginTop: 2 }}>Counts toward March Total ARR only. Does not earn SPIFF points.</div>
              </div>
            </button>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Deal ARR ($)</label>
            <input type="number" value={submitARR} onChange={e => setSubmitARR(e.target.value)} placeholder="e.g., 25000" style={inputStyle} />
          </div>
          {!submitLegacy && (<div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Point Actions (select all that apply)</label>
            {actionsForTeam.map(a => {
              const selected = submitActions.includes(a.id);
              const isUsed = a.id === "first_canvas" && firstCanvas[submitRep];
              const stc = teamColor(submitTeam);
              return (
                <button key={a.id} onClick={() => !isUsed && toggleAction(a.id)} disabled={isUsed} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", marginBottom: 4, borderRadius: 8, border: `1px solid ${selected ? stc.border : AIR.border}`, background: selected ? stc.dim : AIR.surface, color: isUsed ? AIR.textDim : selected ? "#fff" : AIR.textMuted, cursor: isUsed ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: "left", opacity: isUsed ? 0.4 : 1 }}>
                  <span>{a.label}{isUsed ? " (already claimed)" : ""}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: selected ? stc.primary : AIR.textDim, whiteSpace: "nowrap", marginLeft: 12 }}>+{a.points} pts</span>
                </button>
              );
            })}
          </div>)}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} placeholder="Canvas demo notes, context..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Gong Recording Link (optional)</label>
            <input value={submitGong} onChange={e => setSubmitGong(e.target.value)} placeholder="https://app.gong.io/call?id=..." style={inputStyle} />
          </div>
          {!submitLegacy && submitActions.length > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: AIR.cyanDim, border: `1px solid ${AIR.cyanBorder}`, fontFamily: "'Space Mono', monospace", fontSize: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: AIR.textMuted }}>Points for this deal:</span>
              <span style={{ color: AIR.cyan, fontWeight: 700 }}>
                {submitActions.reduce((sum, aId) => { const a = actionsForTeam.find(x => x.id === aId); if (!a) return sum; if (aId === "first_canvas" && firstCanvas[submitRep]) return sum; return sum + a.points; }, 0)} pts
              </span>
            </div>
          )}
          {submitLegacy && (
            <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: "rgba(242,100,48,0.08)", border: "1px solid rgba(242,100,48,0.2)", fontFamily: "'Space Mono', monospace", fontSize: 13, color: AIR.orange }}>
              Legacy deal — 0 contest points. ARR counts toward March Total only.
            </div>
          )}
          <button onClick={handleSubmit} disabled={!submitRep || (!submitLegacy && submitActions.length === 0)} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: (!submitRep || (!submitLegacy && submitActions.length === 0)) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, background: (!submitRep || (!submitLegacy && submitActions.length === 0)) ? AIR.surface : submitLegacy ? AIR.orange : AIR.cyan, color: (!submitRep || (!submitLegacy && submitActions.length === 0)) ? AIR.textDim : AIR.bg }}>
            {submitted ? "✅ Deal Logged!" : "Submit Deal"}
          </button>
        </div>
      )}

      {/* DEAL LOG */}
      {view === "deals" && (
        <div style={{ padding: "24px" }}>
          <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", marginBottom: 20 }}>DEAL LOG ({deals.length})</h2>
          {deals.length === 0 && (<div style={{ textAlign: "center", padding: "48px 20px", color: AIR.textDim, fontSize: 14 }}>No deals logged yet. Go close something.</div>)}
          {[...deals].reverse().map(d => {
            const actions = d.team === "Sales" ? SALES_ACTIONS : d.team === "AAE" ? AAE_ACTIONS : CS_ACTIONS;
            const dtc = teamColor(d.team);
            return (
              <div key={d.id} style={{ padding: "14px 16px", marginBottom: 6, borderRadius: 10, background: AIR.surface, border: `1px solid ${AIR.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontFamily: "'Space Mono', monospace", fontWeight: 700, background: dtc.dim, color: dtc.primary }}>{d.team}</span>
                      {d.isLegacy && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontFamily: "'Space Mono', monospace", fontWeight: 700, background: "rgba(242,100,48,0.15)", color: AIR.orange }}>LEGACY</span>}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{d.rep}</span>
                      {d.account && <span style={{ fontSize: 12, color: AIR.textDim }}>· {d.account}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: AIR.textDim, marginBottom: 4 }}>{d.actions.map(aId => actions.find(a => a.id === aId)?.label || aId).join(" + ")}</div>
                    <div style={{ fontSize: 10, color: AIR.textDim }}>{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{d.notes && ` · ${d.notes}`}</div>
                    {d.gong && <a href={d.gong} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: AIR.pink, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>🎙️ Gong Recording ↗</a>}
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 12 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>{d.points} pts</div>
                    {d.arr > 0 && (<div style={{ fontSize: 11, color: AIR.textMuted }}>{formatCurrency(d.arr)} ARR</div>)}
                    {deletingId === d.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleDelete(d.id)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid rgba(232,72,85,0.4)`, background: "rgba(232,72,85,0.1)", color: AIR.red, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Confirm</button>
                        <button onClick={() => setDeletingId(null)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${AIR.border}`, background: "transparent", color: AIR.textDim, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(d.id)} style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "transparent", color: AIR.textDim, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
