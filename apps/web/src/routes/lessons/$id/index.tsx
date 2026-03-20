import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { DEFAULT_LESSONS, validatePuzzleMove, calculatePuzzleScore } from "@hex/game-core";
import { Card, CardContent } from "@hex/ui/card";
import { Button } from "@hex/ui/button";
import { Badge } from "@hex/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, Circle, HelpCircle, Zap } from "lucide-react";

export const Route = createFileRoute("/lessons/$id")({
  component: LessonPage,
});

function LessonPage() {
  const { id } = useParams({ from: "/lessons/$id" });
  const lesson = DEFAULT_LESSONS.find((l) => l.id === id);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [puzzleGuess, setPuzzleGuess] = useState<{ q: number; r: number } | null>(null);
  const [puzzleResult, setPuzzleResult] = useState<"correct" | "incorrect" | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const nextSlide = useCallback(() => {
    if (currentSlide < lesson!.slides.length - 1) {
      setCurrentSlide((c) => c + 1);
    }
  }, [currentSlide, lesson]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((c) => c - 1);
    }
  }, [currentSlide]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Lesson not found</h1>
          <Link to="/lessons">
            <Button>Back to Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const slide = lesson.slides[currentSlide];
  const isPuzzleSlide = lesson.puzzle && currentSlide === lesson.slides.length - 1;
  const isLastSlide = currentSlide === lesson.slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handlePuzzleCellClick = (q: number, r: number) => {
    if (!lesson.puzzle || puzzleResult) return;
    setPuzzleGuess({ q, r });
    const correct = validatePuzzleMove(lesson.puzzle, { q, r });
    setPuzzleResult(correct ? "correct" : "incorrect");
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed((h) => h + 1);
  };

  const resetPuzzle = () => {
    setPuzzleGuess(null);
    setPuzzleResult(null);
    setShowHint(false);
    setHintsUsed(0);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "bg-green-500/15 text-green-400 border-green-500/30";
    if (difficulty <= 6) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  const renderBoardSlide = (boardSlide: any) => {
    const cellSize = 40;

    const axialToPixel = (coord: { q: number; r: number }) => {
      const x = cellSize * (1.5 * coord.q);
      const y = cellSize * (Math.sqrt(3) * 0.5 * coord.q + Math.sqrt(3) * coord.r);
      return { x, y };
    };

    const hexCorners = (cx: number, cy: number, size: number) => {
      const corners = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        corners.push({
          x: cx + size * Math.cos(angle),
          y: cy + size * Math.sin(angle),
        });
      }
      return corners;
    };

    const allCoords = boardSlide.cells;
    if (boardSlide.highlight) {
      allCoords.push(
        ...boardSlide.highlight.filter((h) => !allCoords.find((c) => c.q === h.q && c.r === h.r)),
      );
    }

    const minQ = Math.min(...allCoords.map((c) => c.q));
    const maxQ = Math.max(...allCoords.map((c) => c.q));
    const minR = Math.min(...allCoords.map((c) => c.r));
    const maxR = Math.max(...allCoords.map((c) => c.r));

    const offsetX = cellSize * 2;
    const offsetY = cellSize * 2;

    return (
      <div className="flex justify-center my-6">
        <svg width={cellSize * 3 * (maxQ - minQ + 1)} height={cellSize * 3 * (maxR - minR + 1)}>
          {boardSlide.cells.map((cell: any) => {
            const { x, y } = axialToPixel(cell);
            const corners = hexCorners(x + offsetX, y + offsetY, cellSize * 0.9);
            return (
              <g key={`${cell.q},${cell.r}`}>
                <polygon
                  points={corners.map((c) => `${c.x},${c.y}`).join(" ")}
                  fill={cell.player === "X" ? "#22d3ee" : "#fb923c"}
                  stroke="#334155"
                  strokeWidth="2"
                />
              </g>
            );
          })}
          {boardSlide.highlight?.map((coord: any) => {
            const { x, y } = axialToPixel(coord);
            const corners = hexCorners(x + offsetX, y + offsetY, cellSize * 0.85);
            return (
              <g key={`hl-${coord.q},${coord.r}`}>
                <polygon
                  points={corners.map((c) => `${c.x},${c.y}`).join(" ")}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderInteractiveSlide = (interactive: any) => {
    return (
      <div className="my-6">
        <p className="text-slate-300 mb-4">{interactive.prompt}</p>
        <div className="flex justify-center">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Click a cell to place your piece</div>
            <svg width={300} height={260}>
              {interactive.cells.map((cell: any) => {
                const x = 150 + cell.q * 35;
                const y = 130 + (cell.r - cell.q * 0.5) * 40;
                const corners = hexCorners(x, y, 18);
                return (
                  <g key={`${cell.q},${cell.r}`}>
                    <polygon
                      points={corners.map((c) => `${c.x},${c.y}`).join(" ")}
                      fill={cell.player === "X" ? "rgba(34,211,238,0.3)" : "rgba(251,146,60,0.3)"}
                      stroke="#475569"
                      strokeWidth="1"
                      className="cursor-pointer hover:fill-opacity-60"
                      onClick={() => handlePuzzleCellClick(cell.q, cell.r)}
                    />
                  </g>
                );
              })}
              {puzzleGuess && (
                <circle
                  cx={150 + puzzleGuess.q * 35}
                  cy={130 + (puzzleGuess.r - puzzleGuess.q * 0.5) * 40}
                  r="12"
                  fill={puzzleResult === "correct" ? "#22c55e" : "#ef4444"}
                  stroke="white"
                  strokeWidth="2"
                />
              )}
            </svg>
          </div>
        </div>
        {puzzleResult && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${puzzleResult === "correct" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
          >
            {puzzleResult === "correct" ? "✓ Correct!" : "✗ Try again"}
          </div>
        )}
        {showHint && lesson.puzzle?.hints && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
            💡 Hint: {lesson.puzzle.hints[hintsUsed - 1] || lesson.puzzle.hints[0]}
          </div>
        )}
        {puzzleResult === "correct" && (
          <div className="mt-4 text-center">
            <p className="text-green-400 font-semibold mb-2">
              Puzzle solved! Score:{" "}
              {calculatePuzzleScore(lesson.puzzle, hintsUsed, (Date.now() - startTime) / 1000)}/100
              XP
            </p>
            <Button onClick={resetPuzzle}>Try Again</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to="/lessons"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Lessons</span>
        </Link>

        {/* Lesson header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${getDifficultyColor(lesson.difficulty)} border`}>
              Difficulty {lesson.difficulty}/10
            </Badge>
            <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
              {lesson.category}
            </Badge>
            <Badge
              variant="outline"
              className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
            >
              <Zap size={12} className="mr-1" />
              {lesson.xpReward} XP
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{lesson.title}</h1>
          <p className="text-slate-400 text-lg">{lesson.description}</p>
        </div>

        {/* Slide content */}
        <Card className="bg-slate-800/40 border-slate-700/50 mb-6">
          <CardContent className="pt-6">
            {slide.type === "text" && (
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {slide.content}
                </p>
              </div>
            )}

            {slide.type === "board" && renderBoardSlide(slide)}

            {slide.type === "interactive" && renderInteractiveSlide(slide)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={isFirstSlide}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            <ChevronLeft className="mr-2" />
            Previous
          </Button>

          <div className="text-slate-400 text-sm">
            Slide {currentSlide + 1} of {lesson.slides.length}
          </div>

          <Button
            variant="outline"
            onClick={nextSlide}
            disabled={isLastSlide}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            Next
            <ChevronRight className="ml-2" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {lesson.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`p-1.5 rounded-full transition-colors ${
                idx === currentSlide
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {idx === currentSlide ? <ChevronLeft size={14} /> : <Circle size={14} />}
            </button>
          ))}
        </div>

        {/* Hints button */}
        {isPuzzleSlide && lesson.puzzle && !puzzleResult && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleShowHint}
              disabled={showHint}
              className="bg-slate-800/50 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            >
              <HelpCircle className="mr-2" size={16} />
              Show Hint ({lesson.puzzle.hints.length} available)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
