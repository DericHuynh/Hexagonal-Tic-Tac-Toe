import { createFileRoute, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hex/ui/card";
import { Badge } from "@hex/ui/badge";
import { Button } from "@hex/ui/button";
import { Trophy, TrendingUp, Calendar, Clock, Medal, Target, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/profile/$username")({ component: ProfilePage });

function ProfilePage() {
  const { username } = useParams({ from: "/profile/$username" });

  // Mock data - in real implementation would fetch from D1
  const profile = {
    username,
    email: `${username.toLowerCase().replace(/\s/g, "")}@example.com`,
    avatarUrl: null,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    rating: {
      elo: 2150,
      peakElo: 2180,
      gamesPlayed: 87,
      wins: 52,
      losses: 32,
      draws: 3,
      streak: 4,
    },
    recentMatches: [
      {
        id: "1",
        opponent: "HexMaster",
        result: "win",
        eloChange: 18,
        date: Date.now() - 3600 * 1000,
      },
      {
        id: "2",
        opponent: "ForkExpert",
        result: "win",
        eloChange: 15,
        date: Date.now() - 7200 * 1000,
      },
      {
        id: "3",
        opponent: "CenterControl",
        result: "loss",
        eloChange: -12,
        date: Date.now() - 10800 * 1000,
      },
      {
        id: "4",
        opponent: "SilverFox",
        result: "win",
        eloChange: 20,
        date: Date.now() - 14400 * 1000,
      },
      {
        id: "5",
        opponent: "GoldFinger",
        result: "win",
        eloChange: 14,
        date: Date.now() - 18000 * 1000,
      },
    ],
  };

  const getTierColor = (elo: number) => {
    if (elo >= 2400) return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    if (elo >= 2000) return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    if (elo >= 1600) return "bg-slate-400/15 text-slate-300 border-slate-400/30";
    if (elo >= 1200) return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    if (elo >= 800) return "bg-gray-400/15 text-gray-300 border-gray-400/30";
    return "bg-orange-700/15 text-orange-300 border-orange-700/30";
  };

  const getTierName = (elo: number) => {
    if (elo >= 2400) return "Grandmaster";
    if (elo >= 2000) return "Diamond";
    if (elo >= 1600) return "Platinum";
    if (elo >= 1200) return "Gold";
    if (elo >= 800) return "Silver";
    return "Bronze";
  };

  const winRate = ((profile.rating.wins / profile.rating.gamesPlayed) * 100).toFixed(1);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back link */}
        <a
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Leaderboard</span>
        </a>

        {/* Profile Header */}
        <Card className="bg-slate-800/40 border-slate-700/50 mb-8">
          <CardHeader>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
                {profile.username.charAt(0).toUpperCase()}
              </div>

              {/* User info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl font-bold text-white">
                    {profile.username}
                  </CardTitle>
                  <Badge variant="outline" className={`${getTierColor(profile.rating.elo)} border`}>
                    {getTierName(profile.rating.elo)}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400 mb-4">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {profile.rating.gamesPlayed} games
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    Peak: {profile.rating.peakElo} ELO
                  </span>
                </div>
              </div>

              {/* ELO display */}
              <div className="text-center px-6 py-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <div className="text-4xl font-black text-white mb-1">{profile.rating.elo}</div>
                <div className="text-slate-400 text-sm">Current ELO</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="text-green-400" size={20} />
                Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{profile.rating.wins}</div>
              <p className="text-slate-400 text-sm">{winRate}% win rate</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="text-red-400" size={20} />
                Losses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{profile.rating.losses}</div>
              <p className="text-slate-400 text-sm">
                {((profile.rating.losses / profile.rating.gamesPlayed) * 100).toFixed(1)}% loss rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Medal className="text-yellow-400" size={20} />
                Draws
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{profile.rating.draws}</div>
              <p className="text-slate-400 text-sm">
                {((profile.rating.draws / profile.rating.gamesPlayed) * 100).toFixed(1)}% draw rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="text-indigo-400" size={20} />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${profile.rating.streak > 0 ? "text-green-400" : profile.rating.streak < 0 ? "text-red-400" : "text-slate-300"}`}
              >
                {profile.rating.streak > 0 ? "+" : ""}
                {profile.rating.streak}
              </div>
              <p className="text-slate-400 text-sm">current</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches */}
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Recent Matches</CardTitle>
            <CardDescription>Last 5 games played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        match.result === "win"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : match.result === "loss"
                            ? "bg-gradient-to-br from-red-500 to-rose-600"
                            : "bg-gradient-to-br from-yellow-500 to-amber-600"
                      }`}
                    >
                      {match.result === "win" ? "W" : match.result === "loss" ? "L" : "D"}
                    </div>
                    <div>
                      <div className="text-white font-semibold">vs {match.opponent}</div>
                      <div className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(match.date)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${match.eloChange > 0 ? "text-green-400" : match.eloChange < 0 ? "text-red-400" : "text-yellow-400"}`}
                  >
                    {match.eloChange > 0 ? "+" : ""}
                    {match.eloChange}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            asChild
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400"
          >
            <a href="/">Play a Match</a>
          </Button>
          <Button
            variant="outline"
            asChild
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            <a href="/lessons">View Lessons</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
