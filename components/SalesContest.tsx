"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Deal, FirstCanvas, Team, Score } from "@/lib/types";
import {
  SALES_REPS, AAE_REPS, CS_REPS,
  SALES_ACTIONS, CS_ACTIONS, AAE_ACTIONS,
  ARR_TIERS, AIR, AIR_LOGO_URI,
} from "@/lib/config";

interface Props {
  initialDeals: Deal[];
  initialFirstCanvas: FirstCanvas;
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function teamColor(team: Team) {
  if (team === "Sales") return { primary: AIR.cyan, dim: AIR.cyanDim, border: AIR.cyanBorder, label: "🔵 SALES" };
  if (team === "AAE") return { primary: AIR.gold, dim: AIR.goldDim, border: AIR.goldBorder, label: "🟡 AAE" };
  return { primary: AIR.teal, dim: AIR.tealDim, border: AIR.tealBorder, label: "🟢 CS" };
}

// Capture group 1 extracts the record ID
const SF_OPP_REGEX = /^https:\/\/airinc\.lightning\.force\.com\/lightning\/r\/Opportunity\/([A-Za-z0-9]+)\/view$/;
const SF_ACCOUNT_REGEX = /^https:\/\/airinc\.lightning\.force\.com\/lightning\/r\/Account\/([A-Za-z0-9]+)\/view$/;
const SF_LINK_REGEX = SF_OPP_REGEX; // kept for any remaining references

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 11,
  fontFamily: "'Space Mono', monospace", color: AIR.textMuted, letterSpacing: "0.08em",
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.text,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", appearance: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.text,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
};

export default function SalesContest({ initialDeals, initialFirstCanvas }: Props) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [firstCanvas, setFirstCanvas] = useState<FirstCanvas>(initialFirstCanvas);
  const [view, setView] = useState<"leaderboard" | "rules" | "submit" | "deals">("leaderboard");
  const [submitTeam, setSubmitTeam] = useState<Team>("Sales");
  const [submitRep, setSubmitRep] = useState("");
  const [submitActions, setSubmitActions] = useState<string[]>([]);
  const [submitARR, setSubmitARR] = useState("");
  const [submitAccount, setSubmitAccount] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitGong, setSubmitGong] = useState("");
  const [submitSfLink, setSubmitSfLink] = useState("");
  const [sfLinkError, setSfLinkError] = useState("");
  const [submitLegacy, setSubmitLegacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeBoard, setActiveBoard] = useState<Team>("Sales");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const refresh = async () => {
    if (syncing || refreshCooldown > 0) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(data.deals);
      setFirstCanvas(data.firstCanvas);
      // Start 5-minute cooldown
      setRefreshCooldown(300);
      cooldownRef.current = setInterval(() => {
        setRefreshCooldown((prev) => {
          if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setSyncing(false);
    }
  };

  const getScores = useCallback((team: Team): Score[] => {
    const reps = team === "Sales" ? SALES_REPS : team === "AAE" ? AAE_REPS : CS_REPS;
    const scores: Record<string, Score> = {};
    reps.forEach((r) => { scores[r.name] = { name: r.name, points: 0, arr: 0, deals: 0, role: r.role }; });
    deals.filter((d) => d.team === team).forEach((d) => {
      if (!scores[d.rep]) scores[d.rep] = { name: d.rep, points: 0, arr: 0, deals: 0, role: "?" };
      scores[d.rep].points += d.points;
      scores[d.rep].arr += d.arr || 0;
      scores[d.rep].deals += 1;
    });
    return Object.values(scores).sort((a, b) => b.points - a.points);
  }, [deals]);

  const totalARR = 175000 + deals.reduce((s, d) => s + (d.arr || 0), 0);
  const creditsARR = deals.filter((d) => !d.isLegacy).reduce((s, d) => s + (d.arr || 0), 0);
  const currentTier = [...ARR_TIERS].reverse().find((t) => totalARR >= t.threshold);
  const nextTier = ARR_TIERS.find((t) => totalARR < t.threshold);

  const handleSubmit = async () => {
    if (!submitRep) return;
    if (!submitLegacy && submitActions.length === 0) return;
    const activeRegex = submitTeam === "AAE" ? SF_ACCOUNT_REGEX : SF_OPP_REGEX;
    const linkLabel = submitTeam === "AAE" ? "SFDC account link" : "Salesforce opportunity link";

    if (!submitSfLink) {
      setSfLinkError(`${linkLabel.charAt(0).toUpperCase() + linkLabel.slice(1)} is required.`);
      return;
    }
    if (!activeRegex.test(submitSfLink)) {
      const expected = submitTeam === "AAE"
        ? "airinc.lightning.force.com/lightning/r/Account/…/view"
        : "airinc.lightning.force.com/lightning/r/Opportunity/…/view";
      setSfLinkError(`Must match: ${expected}`);
      return;
    }
    setSfLinkError("");

    let pts = 0;
    const newFC = { ...firstCanvas };
    if (!submitLegacy) {
      const actions = submitTeam === "Sales" ? SALES_ACTIONS : submitTeam === "AAE" ? AAE_ACTIONS : CS_ACTIONS;
      submitActions.forEach((aId) => {
        const action = actions.find((a) => a.id === aId);
        if (action) {
          if (aId === "first_canvas") {
            if (!newFC[submitRep]) { pts += action.points; newFC[submitRep] = true; }
          } else {
            pts += action.points;
          }
        }
      });
    }

    // Extract the Salesforce record ID from the URL
    const sfIdMatch = activeRegex.exec(submitSfLink);
    const sfId = sfIdMatch?.[1];

    const deal: Deal = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      team: submitTeam,
      rep: submitRep,
      actions: submitLegacy ? ["legacy_deal"] : submitActions,
      points: pts,
      arr: parseInt(submitARR) || 0,
      account: submitAccount,
      notes: submitNotes,
      gong: submitGong,
      sfLink: submitSfLink,
      sfId,
      isLegacy: submitLegacy,
      date: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });

      if (res.status === 409) {
        setSfLinkError("This Salesforce opportunity has already been logged.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.message || `Server error (${res.status}). Check Vercel logs.`);
        return;
      }

      // Update local state only after server confirms
      setDeals((prev) => [...prev, deal]);
      setFirstCanvas(newFC);

      setSubmitActions([]);
      setSubmitARR("");
      setSubmitAccount("");
      setSubmitNotes("");
      setSubmitGong("");
      setSubmitSfLink("");
      setSfLinkError("");
      setSubmitLegacy(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch {
      setSubmitError("Network error — check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
    await fetch("/api/deals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const toggleAction = (actionId: string) => {
    setSubmitActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
  };

  const repsForTeam = submitTeam === "Sales" ? SALES_REPS : submitTeam === "AAE" ? AAE_REPS : CS_REPS;
  const actionsForTeam = submitTeam === "Sales" ? SALES_ACTIONS : submitTeam === "AAE" ? AAE_ACTIONS : CS_ACTIONS;
  const tc = teamColor(activeBoard);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: AIR.bg, color: AIR.text, minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${AIR.border}`, background: `linear-gradient(180deg, rgba(77,212,230,0.04) 0%, transparent 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden" }}>
              <img src={AIR_LOGO_URI} style={{ width: 40, height: 40 }} alt="Air" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>CREDITS LAUNCH</h1>
              <p style={{ fontSize: 11, color: AIR.textMuted, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>SALES & CS CONTEST · MARCH 16–31</p>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={syncing || refreshCooldown > 0}
            style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${AIR.border}`, background: AIR.surface, color: AIR.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: (syncing || refreshCooldown > 0) ? "not-allowed" : "pointer", opacity: (syncing || refreshCooldown > 0) ? 0.5 : 1, minWidth: 100 }}
          >
            {syncing
              ? "↻ Syncing..."
              : refreshCooldown > 0
              ? `↻ ${Math.floor(refreshCooldown / 60)}:${String(refreshCooldown % 60).padStart(2, "0")}`
              : "↻ Refresh"}
          </button>
        </div>

        {/* MARCH TOTAL ARR */}
        <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: AIR.surface, border: `1px solid ${AIR.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.textMuted, letterSpacing: "0.1em" }}>MARCH TOTAL ARR — THE NUMBER</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: currentTier ? AIR.teal : "#fff" }}>{formatCurrency(totalARR)}</span>
          </div>
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
          <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative", marginTop: 32 }}>
            {ARR_TIERS.map((tier, i) => (
              <div key={i} style={{ position: "absolute", left: `${(tier.threshold / 1200000) * 100}%`, top: 0, bottom: 0, width: 2, background: totalARR >= tier.threshold ? AIR.teal : "rgba(255,255,255,0.15)", zIndex: 1 }} />
            ))}
            <div style={{ height: "100%", borderRadius: 5, width: `${Math.min((totalARR / 1200000) * 100, 100)}%`, background: `linear-gradient(90deg, ${AIR.cyan}, ${AIR.teal}, ${AIR.olive})`, transition: "width 0.8s ease" }} />
          </div>
          {currentTier && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: AIR.tealDim, border: `1px solid ${AIR.tealBorder}`, fontSize: 12, color: AIR.teal }}>🎉 Unlocked: {currentTier.prize}</div>}
          {nextTier && <div style={{ marginTop: 8, fontSize: 12, color: AIR.textMuted }}>{formatCurrency(nextTier.threshold - totalARR)} away from {nextTier.label} → {nextTier.prize}</div>}
          {!nextTier && totalARR >= 1000000 && <div style={{ marginTop: 8, fontSize: 12, color: AIR.teal }}>All tiers unlocked. Legends.</div>}
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
          {([
            { id: "rules", label: "Contest Info" },
            { id: "leaderboard", label: "Leaderboards" },
            { id: "submit", label: "Submit Deal" },
            { id: "deals", label: `Deal Log (${deals.length})` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, background: view === tab.id ? AIR.cyan : AIR.surface, color: view === tab.id ? AIR.bg : AIR.textMuted, transition: "all 0.2s" }}
            >
              {tab.label}
            </button>
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
            <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.red, letterSpacing: "0.08em", marginBottom: 8 }}>WHAT DOESN&apos;T</div>
            <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}>❌ Legacy plan deals</div>
              <div style={{ marginBottom: 4 }}>❌ New biz without Canvas demo in the sales cycle</div>
              <div style={{ marginBottom: 4 }}>❌ Renewals at legacy pricing without upgrade</div>
              <div>❌ Pipeline that hasn&apos;t closed by 11:59 PM ET on March 31</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.cyan, letterSpacing: "0.08em", marginBottom: 8 }}>🔵 SALES POINTS</div>
          <div style={{ marginBottom: 20 }}>
            {SALES_ACTIONS.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}>
                <span style={{ color: AIR.textMuted }}>{a.label}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: AIR.cyan, fontWeight: 700 }}>+{a.points}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.teal, letterSpacing: "0.08em", marginBottom: 8 }}>🟢 CS POINTS</div>
          <div style={{ marginBottom: 20 }}>
            {CS_ACTIONS.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}>
                <span style={{ color: AIR.textMuted }}>{a.label}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: AIR.teal, fontWeight: 700 }}>+{a.points}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: AIR.gold, letterSpacing: "0.08em", marginBottom: 8 }}>🟡 AAE POINTS (TOP OF FUNNEL)</div>
          <div style={{ marginBottom: 20 }}>
            {AAE_ACTIONS.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", marginBottom: 2, borderRadius: 6, background: AIR.surface, fontSize: 12 }}>
                <span style={{ color: AIR.textMuted }}>{a.label}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: AIR.gold, fontWeight: 700 }}>+{a.points}</span>
              </div>
            ))}
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
            {(["Sales", "AAE", "CS"] as Team[]).map((t) => {
              const c = teamColor(t);
              return (
                <button key={t} onClick={() => setActiveBoard(t)} style={{ padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", background: activeBoard === t ? c.primary : AIR.surface, color: activeBoard === t ? AIR.bg : AIR.textDim }}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {getScores(activeBoard).map((rep, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const isTop3 = i < 3;
            const maxPts = Math.max(...getScores(activeBoard).map((r) => r.points), 1);
            return (
              <div key={rep.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", marginBottom: 6, borderRadius: 10, background: isTop3 ? tc.dim : AIR.surface, border: `1px solid ${isTop3 ? tc.border : AIR.border}` }}>
                <div style={{ width: 32, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: medal ? 20 : 14, color: medal ? undefined : AIR.textDim, fontWeight: 700 }}>{medal || (i + 1)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{rep.name}</span>
                    {rep.role === "AAE" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: AIR.goldDim, color: AIR.gold, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>AAE</span>}
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
              {(["Sales", "AAE", "CS"] as Team[]).map((t) => {
                const c = teamColor(t);
                return (
                  <button key={t} onClick={() => { setSubmitTeam(t); setSubmitRep(""); setSubmitActions([]); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, background: submitTeam === t ? c.primary : AIR.surface, color: submitTeam === t ? AIR.bg : AIR.textDim }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Rep</label>
            <select value={submitRep} onChange={(e) => setSubmitRep(e.target.value)} style={selectStyle}>
              <option value="">Select rep...</option>
              {repsForTeam.map((r) => <option key={r.name} value={r.name}>{r.name} ({r.role})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Account Name</label>
            <input value={submitAccount} onChange={(e) => setSubmitAccount(e.target.value)} placeholder="e.g., Betterment, ZAGG" style={inputStyle} />
          </div>
          {/* LEGACY DEAL TOGGLE */}
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => { setSubmitLegacy(!submitLegacy); setSubmitActions([]); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${submitLegacy ? "rgba(242,100,48,0.4)" : AIR.border}`, background: submitLegacy ? "rgba(242,100,48,0.1)" : AIR.surface, color: submitLegacy ? AIR.orange : AIR.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: "left" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${submitLegacy ? AIR.orange : AIR.textDim}`, background: submitLegacy ? AIR.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{submitLegacy ? "✓" : ""}</div>
              <div>
                <div style={{ fontWeight: 600 }}>Legacy Deal (no contest points)</div>
                <div style={{ fontSize: 11, color: AIR.textDim, marginTop: 2 }}>Counts toward March Total ARR only. Does not earn SPIFF points.</div>
              </div>
            </button>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Deal ARR ($)</label>
            <input type="number" value={submitARR} onChange={(e) => setSubmitARR(e.target.value)} placeholder="e.g., 25000" style={inputStyle} />
          </div>
          {!submitLegacy && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Point Actions (select all that apply)</label>
              {actionsForTeam.map((a) => {
                const selected = submitActions.includes(a.id);
                const isUsed = a.id === "first_canvas" && firstCanvas[submitRep];
                const stc = teamColor(submitTeam);
                return (
                  <button
                    key={a.id}
                    onClick={() => !isUsed && toggleAction(a.id)}
                    disabled={!!isUsed}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", marginBottom: 4, borderRadius: 8, border: `1px solid ${selected ? stc.border : AIR.border}`, background: selected ? stc.dim : AIR.surface, color: isUsed ? AIR.textDim : selected ? "#fff" : AIR.textMuted, cursor: isUsed ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: "left", opacity: isUsed ? 0.4 : 1 }}
                  >
                    <span>{a.label}{isUsed ? " (already claimed)" : ""}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: selected ? stc.primary : AIR.textDim, whiteSpace: "nowrap", marginLeft: 12 }}>+{a.points} pts</span>
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="Canvas demo notes, context..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Gong Recording Link (optional)</label>
            <input value={submitGong} onChange={(e) => setSubmitGong(e.target.value)} placeholder="https://app.gong.io/call?id=..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>{submitTeam === "AAE" ? "SFDC Account Link *" : "Salesforce Opportunity Link *"}</label>
            <input
              value={submitSfLink}
              onChange={(e) => { setSubmitSfLink(e.target.value); if (sfLinkError) setSfLinkError(""); }}
              placeholder={submitTeam === "AAE" ? "https://airinc.lightning.force.com/lightning/r/Account/.../view" : "https://airinc.lightning.force.com/lightning/r/Opportunity/.../view"}
              style={{ ...inputStyle, borderColor: sfLinkError ? AIR.red : undefined }}
            />
            {sfLinkError && <div style={{ marginTop: 4, fontSize: 11, color: AIR.red }}>{sfLinkError}</div>}
          </div>
          {!submitLegacy && submitActions.length > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: AIR.cyanDim, border: `1px solid ${AIR.cyanBorder}`, fontFamily: "'Space Mono', monospace", fontSize: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: AIR.textMuted }}>Points for this deal:</span>
              <span style={{ color: AIR.cyan, fontWeight: 700 }}>
                {submitActions.reduce((sum, aId) => {
                  const a = actionsForTeam.find((x) => x.id === aId);
                  if (!a) return sum;
                  if (aId === "first_canvas" && firstCanvas[submitRep]) return sum;
                  return sum + a.points;
                }, 0)} pts
              </span>
            </div>
          )}
          {submitLegacy && (
            <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: "rgba(242,100,48,0.08)", border: "1px solid rgba(242,100,48,0.2)", fontFamily: "'Space Mono', monospace", fontSize: 13, color: AIR.orange }}>
              Legacy deal — 0 contest points. ARR counts toward March Total only.
            </div>
          )}
          {submitError && (
            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(232,72,85,0.08)", border: "1px solid rgba(232,72,85,0.3)", fontSize: 12, color: AIR.red }}>
              ⚠ {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !submitRep || !submitSfLink || (!submitLegacy && submitActions.length === 0)}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: (isSubmitting || !submitRep || !submitSfLink || (!submitLegacy && submitActions.length === 0)) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, background: (isSubmitting || !submitRep || !submitSfLink || (!submitLegacy && submitActions.length === 0)) ? AIR.surface : submitLegacy ? AIR.orange : AIR.cyan, color: (isSubmitting || !submitRep || !submitSfLink || (!submitLegacy && submitActions.length === 0)) ? AIR.textDim : AIR.bg, opacity: isSubmitting ? 0.7 : 1 }}
          >
            {submitted ? "✅ Deal Logged!" : isSubmitting ? "Submitting..." : "Submit Deal"}
          </button>
        </div>
      )}

      {/* DEAL LOG */}
      {view === "deals" && (
        <div style={{ padding: "24px" }}>
          <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", marginBottom: 20 }}>DEAL LOG ({deals.length})</h2>
          {deals.length === 0 && <div style={{ textAlign: "center", padding: "48px 20px", color: AIR.textDim, fontSize: 14 }}>No deals logged yet. Go close something.</div>}
          {[...deals].reverse().map((d) => {
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
                    <div style={{ fontSize: 11, color: AIR.textDim, marginBottom: 4 }}>
                      {d.actions.map((aId) => actions.find((a) => a.id === aId)?.label || aId).join(" + ")}
                    </div>
                    <div style={{ fontSize: 10, color: AIR.textDim }}>
                      {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {d.notes && ` · ${d.notes}`}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {d.gong && (
                        <a href={d.gong} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: AIR.pink, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          🎙️ Gong ↗
                        </a>
                      )}
                      {d.sfLink && (
                        <a href={d.sfLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: AIR.blue, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          {d.team === "AAE" ? "☁️ SFDC Account ↗" : "☁️ Salesforce ↗"}
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 12 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>{d.points} pts</div>
                    {d.arr > 0 && <div style={{ fontSize: 11, color: AIR.textMuted }}>{formatCurrency(d.arr)} ARR</div>}
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
