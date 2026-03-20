import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hex/ui/card";
import { Badge } from "@hex/ui/badge";
import { Trophy, Medal, Target, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

async function getLeaderboard() {
  // In a real implementation, this would fetch from D1 database
  // For now, return mock data
  return [
    {
      rank: 1,
      username: "Grandmaster01",
      elo: 2450,
      gamesPlayed: 342,
      wins: 256,
      losses: 86,
      streak: 12,
      tier: "Grandmaster",
    },
    {
      rank: 2,
      username: "HexKing",
      elo: 2380,
      gamesPlayed: 287,
      wins: 212,
      losses: 75,
      streak: 8,
      tier: "Grandmaster",
    },
    {
      rank: 3,
      username: "TacticalGenius",
      elo: 2320,
      gamesPlayed: 421,
      wins: 298,
      losses: 123,
      streak: 5,
      tier: "Grandmaster",
    },
    {
      rank: 4,
      username: "CenterControl",
      elo: 2280,
      gamesPlayed: 198,
      wins: 142,
      losses: 56,
      streak: 3,
      tier: "Diamond",
    },
    {
      rank: 5,
      username: "SixInARow",
      elo: 2240,
      gamesPlayed: 267,
      wins: 187,
      losses: 80,
      streak: -2,
      tier: "Diamond",
    },
    {
      rank: 6,
      username: "HexMaster",
      elo: 2190,
      gamesPlayed: 334,
      wins: 228,
      losses: 106,
      streak: 4,
      tier: "Diamond",
    },
    {
      rank: 7,
      username: "ForkExpert",
      elo: 2150,
      gamesPlayed: 189,
      wins: 126,
      losses: 63,
      streak: 1,
      tier: "Platinum",
    },
    {
      rank: 8,
      username: "BoardDominator",
      elo: 2120,
      gamesPlayed: 256,
      wins: 168,
      losses: 88,
      streak: -1,
      tier: "Platinum",
    },
    {
      rank: 9,
      username: "StrategicMind",
      elo: 2080,
      gamesPlayed: 301,
      wins: 193,
      losses: 108,
      streak: 2,
      tier: "Platinum",
    },
    {
      rank: 10,
      username: "RisingStar",
      elo: 2050,
      gamesPlayed: 142,
      wins: 92,
      losses: 50,
      streak: 6,
      tier: "Platinum",
    },
    {
      rank: 11,
      username: "GoldFinger",
      elo: 1980,
      gamesPlayed: 387,
      wins: 241,
      losses: 146,
      streak: -3,
      tier: "Gold",
    },
    {
      rank: 12,
      username: "SilverFox",
      elo: 1950,
      gamesPlayed: 223,
      wins: 134,
      losses: 89,
      streak: 1,
      tier: "Gold",
    },
    {
      rank: 13,
      username: "BronzeBrawler",
      elo: 1890,
      gamesPlayed: 168,
      wins: 98,
      losses: 70,
      streak: 2,
      tier: "Gold",
    },
    {
      rank: 14,
      username: "NewbiePro",
      elo: 1750,
      gamesPlayed: 89,
      wins: 48,
      losses: 41,
      streak: -2,
      tier: "Silver",
    },
    {
      rank: 15,
      username: "LearningCurve",
      elo: 1620,
      gamesPlayed: 56,
      wins: 28,
      losses: 28,
      streak: 0,
      tier: "Silver",
    },
  ];
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    Grandmaster: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    Diamond: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    Platinum: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    Gold: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    Silver: "bg-gray-400/15 text-gray-300 border-gray-400/30",
    Bronze: "bg-orange-700/15 text-orange-300 border-orange-700/30",
  };
  return colors[tier] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
  if (rank === 2) return <Medal className="text-slate-300" size={24} />;
  if (rank === 3) return <Medal className="text-amber-600" size={24} />;
  return <span className="text-slate-400 font-bold text-lg">#{rank}</span>;
}

function LeaderboardPage() {
  const leaderboard = getLeaderboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-4">
            <Trophy size={16} />
            <span>Competition</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Leaderboard</h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Top players ranked by ELO rating. Climb the ranks by winning games and improving your
            strategy.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="text-cyan-400" size={20} />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">2,847</div>
              <p className="text-slate-400 text-sm">registered players</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="text-green-400" size={20} />
                Highest ELO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">2,450</div>
              <p className="text-slate-400 text-sm">Grandmaster01</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="text-yellow-400" size={20} />
                Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">15,234</div>
              <p className="text-slate-400 text-sm">total matches</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Top Players</CardTitle>
            <CardDescription>Rankings based on ELO rating with tier breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider w-16">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      Player
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      ELO
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      Games
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => {
                    const winRate = ((player.wins / player.gamesPlayed) * 100).toFixed(1);
                    const isPositiveStreak = player.streak > 0;

                    return (
                      <tr
                        key={player.rank}
                        className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            {getRankIcon(player.rank)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{player.username}</div>
                              <div className="text-slate-400 text-xs">
                                ID: {player.username.toLowerCase().replace(/\s/g, "")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={`${getTierColor(player.tier)} border`}
                          >
                            {player.tier}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="text-white font-bold font-mono text-lg">{player.elo}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="text-slate-300">{player.gamesPlayed}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="text-slate-300">{winRate}%</div>
                          <div className="text-slate-500 text-xs">
                            {player.wins}W / {player.losses}L
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div
                            className={`font-semibold ${isPositiveStreak ? "text-green-400" : "text-red-400"}`}
                          >
                            {isPositiveStreak ? "+" : ""}
                            {player.streak}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tier Legend */}
        <Card className="mt-8 bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Rating Tiers</CardTitle>
            <CardDescription>ELO ranges for each competitive tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  tier: "Grandmaster",
                  min: 2400,
                  max: "∞",
                  color: "bg-purple-500/15 border-purple-500/30 text-purple-300",
                },
                {
                  tier: "Diamond",
                  min: 2000,
                  max: 2399,
                  color: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
                },
                {
                  tier: "Platinum",
                  min: 1600,
                  max: 1999,
                  color: "bg-slate-400/15 border-slate-400/30 text-slate-300",
                },
                {
                  tier: "Gold",
                  min: 1200,
                  max: 1599,
                  color: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
                },
                {
                  tier: "Silver",
                  min: 800,
                  max: 1199,
                  color: "bg-gray-400/15 border-gray-400/30 text-gray-300",
                },
                {
                  tier: "Bronze",
                  min: 0,
                  max: 799,
                  color: "bg-orange-700/15 border-orange-700/30 text-orange-300",
                },
              ].map((tier) => (
                <div key={tier.tier} className={`p-3 rounded-lg border ${tier.color}`}>
                  <div className="font-semibold">{tier.tier}</div>
                  <div className="text-sm opacity-80">
                    {tier.min}+ ELO
                    {tier.max !== "∞" && ` - ${tier.max}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">Ready to climb the ranks?</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
          >
            <Trophy size={18} />
            Play a Match
          </a>
        </div>
      </div>
    </div>
  );
}
