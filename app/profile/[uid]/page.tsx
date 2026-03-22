export const revalidate = 0;
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { Card, SectionLabel, Avatar, BadgePill, StatusPill, EmptyState } from "@/components/ui";
import type { ClubUser, EarnedBadge, BadgeRequest } from "@/types";
import { ProfileClient } from "./ProfileClient";

async function getProfileData(uid: string) {
  if (!uid) return null;

  const [userSnap, requestsSnap, leaderSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("badgeRequests").where("userId", "==", uid).orderBy("createdAt", "desc").get(),
    adminDb.collection("users").orderBy("totalPoints", "desc").limit(100).get(),
  ]);

  const earnedSnap = await adminDb
    .collection("users").doc(uid)
    .collection("earnedBadges").get();

  if (!userSnap.exists) return null;

  const earnedBadges = earnedSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EarnedBadge[];

  // Fetch all badge details in one parallel query
  const badgeIds = [...new Set(earnedBadges.map(b => b.badgeId))];
  const badgeSnaps = await Promise.all(
    badgeIds.map(id => adminDb.collection("badges").doc(id).get())
  );
  const badgeMap = Object.fromEntries(
    badgeSnaps.map(snap => [snap.id, snap.data()])
  );

  // Enrich earned badges with latest category from badges collection
  const enrichedBadges = earnedBadges.map(b => ({
    ...b,
    badgeCategory: badgeMap[b.badgeId]?.category ?? "",
  }));

  const user = { uid: userSnap.id, ...userSnap.data() } as ClubUser & {
    discordHandle?: string;
    githubUsername?: string;
  };
  const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BadgeRequest[];
  const rank = leaderSnap.docs.findIndex(d => d.id === uid) + 1;

  return { user, earnedBadges: enrichedBadges, requests, rank };
}


export default async function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const session = await getServerSession(authOptions);
  const data = await getProfileData(uid);

  if (!data) notFound();

  const { user, earnedBadges, requests, rank } = data;
  const isOwnProfile = session?.user?.uid === uid;

  // Group earned badges by season
  const bySeason = earnedBadges.reduce<Record<string, EarnedBadge[]>>((acc, b) => {
    const key = b.seasonName || "Unknown Season";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      {/* Profile header — client component to handle edit modal */}
      <ProfileClient
        user={user}
        rank={rank}
        earnedCount={earnedBadges.length}
        requestCount={requests.length}
        isOwnProfile={isOwnProfile}
      />

      {/* Earned badges */}
      <div className="mb-6">
        <SectionLabel>Earned Badges</SectionLabel>
        {earnedBadges.length === 0 && <EmptyState icon="🏅" message="No badges earned yet." />}
       {Object.entries(bySeason).map(([seasonName, badges]) => (
  <div key={seasonName} className="mb-6">
    <p className="font-mono text-xs text-text-muted mb-3 tracking-wider">{seasonName}</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {badges.map(b =>  (
        
<div key={b.id}
  className="rounded-xl p-4 flex flex-col items-center gap-2 text-center"
  style={{
    background: `${b.badgeColor}12`,
    border: `1.5px solid ${b.badgeColor}40`,
  }}>

  {/* Icon */}
  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
    style={{ background: `${b.badgeColor}25`, border: `1.5px solid ${b.badgeColor}60` }}>
    {b.badgeImageURL
      ? <img src={b.badgeImageURL} alt={b.badgeName} className="w-8 h-8 object-cover rounded-lg" />
      : b.badgeIcon
    }
  </div>

  {/* Name */}
  <p className="font-mono text-xs font-semibold leading-tight"
    style={{ color: b.badgeColor }}>{b.badgeName}</p>

{/* Category */}
<span className="font-mono text-[10px] px-2 py-0.5 rounded-md"
  style={{ background: `${b.badgeColor}15`, color: `${b.badgeColor}cc`, border: `1px solid ${b.badgeColor}30` }}>
  {b.badgeCategory}
</span>
  {/* Points */}
  <p className="font-mono text-xs" style={{ color: `${b.badgeColor}99` }}>+{b.badgePoints} pts</p>

  {/* Earned tag */}
  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
    style={{ background: `${b.badgeColor}20`, color: b.badgeColor, border: `1px solid ${b.badgeColor}40` }}>
    earned
  </span>
</div>
      ))}
    </div>
  </div>
))}
      </div>

      {/* Request history */}
      {(isOwnProfile || session?.user?.role === "admin") && (
        <div>
          <SectionLabel>Request History</SectionLabel>
          {requests.length === 0 && <EmptyState icon="📋" message="No requests submitted yet." />}
          <div className="space-y-2">
            {requests.map(r => (
              <Card key={r.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl shrink-0">{r.badgeIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-text-base font-medium">{r.badgeName}</p>
                  <p className="font-sans text-xs text-text-dim truncate mt-0.5">{r.note}</p>
                  <p className="font-mono text-xs text-text-muted mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusPill status={r.status} />
                  <span className="font-mono text-xs text-accent">+{r.badgePoints}pts</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}