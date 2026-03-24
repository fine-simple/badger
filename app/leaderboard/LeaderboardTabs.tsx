"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, Avatar } from "@/components/ui";

const RANK_COLORS = ["#f0c040", "#c0c0c0", "#cd7f32"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHTS = [140, 180, 110];

interface Member {
  uid: string;
  name: string;
  photoURL: string | null;
  totalPoints: number;
  badgeCount: number;
  role: string;
  status: string;
}

function Podium({ members }: { members: Member[] }) {
  if (members.length < 3) return null;
  return (
    <div className="flex items-end justify-center gap-4 mb-14 px-4">
      {[members[1], members[0], members[2]].map((m, vi) => {
        const rank = vi === 0 ? 2 : vi === 1 ? 1 : 3;
        return (
          <Link key={m.uid} href={`/profile/${m.uid}`}
            className="flex flex-col items-center gap-3 group">
            <Avatar name={m.name} photoURL={m.photoURL} size={rank === 1 ? 56 : 44} />
            <div className="text-center">
              <p className="font-sans text-sm font-semibold text-text-base group-hover:text-accent transition-colors truncate max-w-[100px]">
                {m.name.split(" ")[0]}
              </p>
              <p className="font-mono text-sm font-bold text-accent">{m.totalPoints}pts</p>
            </div>
            <div className="w-24 flex flex-col items-center justify-start pt-3 rounded-t-lg border-t border-x"
              style={{
                height: PODIUM_HEIGHTS[vi],
                background: `linear-gradient(to top, ${RANK_COLORS[rank - 1]}15, ${RANK_COLORS[rank - 1]}05)`,
                borderColor: `${RANK_COLORS[rank - 1]}30`,
              }}>
              <span style={{ fontSize: rank === 1 ? 28 : 20 }}>{RANK_ICONS[rank - 1]}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function MemberTable({ members }: { members: Member[] }) {
  if (members.length === 0) return (
    <div className="text-center py-16 font-mono text-text-muted">
      <p className="text-4xl mb-3">🏆</p>
      <p className="text-sm">No members here yet.</p>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border font-mono text-[10px] text-text-muted tracking-widest uppercase">
        <span>Rank</span><span>Member</span><span className="text-right">Badges</span><span className="text-right">Points</span>
      </div>
      {members.map((m, i) => (
        <Link key={m.uid} href={`/profile/${m.uid}`}
          className="grid grid-cols-[40px_1fr_auto_auto] gap-4 px-5 py-4 border-b border-border items-center hover:bg-white/[0.015] transition-all"
          style={{ background: i === 0 ? "rgba(57,211,83,0.03)" : undefined }}>
          <span className="font-mono font-bold text-base text-center"
            style={{ color: i < 3 ? RANK_COLORS[i] : "#3d5c36" }}>
            {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
          </span>
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={m.name} photoURL={m.photoURL} size={36} />
            <div className="min-w-0">
              <p className="font-sans text-sm font-semibold text-text-base truncate">{m.name}</p>
              <div className="flex gap-2">
                {m.role === "admin" && (
                  <span className="font-mono text-xs text-yellow-400/70">admin</span>
                )}
              </div>
            </div>
          </div>
          <span className="font-mono text-sm text-text-dim text-right">{m.badgeCount}</span>
          <span className="font-mono font-bold text-lg text-accent text-right">{m.totalPoints}</span>
        </Link>
      ))}
    </Card>
  );
}

export function LeaderboardTabs({ active, alumni }: { active: Member[]; alumni: Member[] }) {
  const [tab, setTab] = useState<"active" | "alumni">("active");
  const members = tab === "active" ? active : alumni;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setTab("active")}
          className={`font-mono text-sm px-5 py-2 rounded-lg border transition-all ${
            tab === "active"
              ? "bg-accent/10 border-accent text-accent"
              : "border-border text-text-dim hover:border-accent/30 hover:text-accent"
          }`}>
          Active Members
          <span className="ml-2 font-mono text-xs opacity-70">({active.length})</span>
        </button>
        <button onClick={() => setTab("alumni")}
          className={`font-mono text-sm px-5 py-2 rounded-lg border transition-all ${
            tab === "alumni"
              ? "bg-purple-400/10 border-purple-400/50 text-purple-400"
              : "border-border text-text-dim hover:border-purple-400/30 hover:text-purple-400"
          }`}>
          Alumni
          <span className="ml-2 font-mono text-xs opacity-70">({alumni.length})</span>
        </button>
      </div>

<Podium members={members} />
      {/* Table */}
      <MemberTable members={members} />
    </>
  );
}