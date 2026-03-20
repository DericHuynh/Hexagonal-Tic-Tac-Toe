import { createFileRoute, Link } from "@tanstack/react-router";
import { DEFAULT_LESSONS, filterByCategory, sortLessons } from "@hex/game-core";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hex/ui/card";
import { Badge } from "@hex/ui/badge";
import { BookOpen, Star, Zap } from "lucide-react";

export const Route = createFileRoute("/lessons")({ component: LessonsIndex });

function LessonsIndex() {
  // Group lessons by category
  const categories = ["basics", "tactics", "strategy", "endgame", "puzzles"] as const;

  const getLessonsByCategory = (category: (typeof categories)[number]) => {
    return sortLessons(filterByCategory(DEFAULT_LESSONS, category));
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "bg-green-500/15 text-green-400 border-green-500/30";
    if (difficulty <= 6) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "basics":
        return "🎯";
      case "tactics":
        return "⚔️";
      case "strategy":
        return "🧠";
      case "endgame":
        return "🏁";
      case "puzzles":
        return "🧩";
      default:
        return "📚";
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "basics":
        return "Basics";
      case "tactics":
        return "Tactics";
      case "strategy":
        return "Strategy";
      case "endgame":
        return "Endgame";
      case "puzzles":
        return "Puzzles";
      default:
        return category;
    }
  };

  const totalXp = DEFAULT_LESSONS.reduce((sum, l) => sum + l.xpReward, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-4">
            <BookOpen size={16} />
            <span>Learning Center</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Lessons & Puzzles</h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Master hexagonal tic-tac-toe with structured lessons covering basics, tactics, strategy,
            endgame, and puzzle challenges. Earn XP as you progress.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
            <Zap className="text-yellow-400" size={20} />
            <span className="text-white font-semibold">{totalXp} XP</span>
            <span className="text-slate-400 text-sm">total available</span>
          </div>
        </div>

        {/* Categories */}
        {categories.map((category) => {
          const lessons = getLessonsByCategory(category);
          if (lessons.length === 0) return null;

          return (
            <section key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{getCategoryIcon(category)}</span>
                <h2 className="text-2xl font-bold text-white">{getCategoryTitle(category)}</h2>
                <span className="text-slate-500 text-sm">{lessons.length} lessons</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="group block">
                    <Card className="h-full bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/50 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/10 group-hover:-translate-y-0.5">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {lesson.title}
                          </CardTitle>
                          {lesson.puzzle && (
                            <Badge
                              variant="outline"
                              className="shrink-0 bg-purple-500/10 text-purple-300 border-purple-500/30"
                            >
                              <Star size={12} className="mr-1" />
                              Puzzle
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-slate-400 text-sm line-clamp-2">
                          {lesson.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${getDifficultyColor(lesson.difficulty)} border`}
                          >
                            Difficulty {lesson.difficulty}/10
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-slate-700/30 text-slate-300 border-slate-600/30"
                          >
                            {lesson.slides.length} slides
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center justify-between w-full text-sm">
                          <span className="text-slate-500">{lesson.category}</span>
                          <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                            <Zap size={14} />
                            <span>{lesson.xpReward} XP</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty state */}
        {DEFAULT_LESSONS.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No lessons yet</h3>
            <p className="text-slate-400">Check back later for learning content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
