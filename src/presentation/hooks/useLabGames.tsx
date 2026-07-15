import { useCallback, useEffect, useState } from "react";
import { fetchLabGames, fetchLabSubjects, type LabItem } from "@/infrastructure/labs/LabsApi";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Shared subject-lab game loading: resolves the backend subjectId by name,
 * then loads games for a selectable class (1-11) with optional name search.
 * Also tracks which game is currently open inline (replacing the subject's
 * calculator/simulator panel).
 */
export function useLabGames(apiSubjectName: string, notFoundMessage: string) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [items, setItems] = useState<LabItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [classId, setClassId] = useState(1);
  const [search, setSearch] = useState("");
  const [activeGame, setActiveGame] = useState<LabItem | null>(null);

  const load = (id: number, cls: number, name?: string) => {
    setStatus("loading");
    setError(null);
    void fetchLabGames(id, cls, name)
      .then(({ items }) => {
        setItems(items);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Зертханаларды жүктеу мүмкін болмады");
        setStatus("error");
      });
  };

  useEffect(() => {
    void fetchLabSubjects()
      .then((subjects) => {
        const needle = apiSubjectName.toLowerCase();
        const match =
          subjects.find((s) => s.name.toLowerCase() === needle) ??
          subjects.find((s) => s.name.toLowerCase().includes(needle)) ??
          null;

        if (!match) {
          setStatus("error");
          setError(notFoundMessage);
          return;
        }

        setSubjectId(match.subjectId);
        load(match.subjectId, classId);
      })
      .catch((e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Пәндерді жүктеу мүмкін болмады");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSubjectName, notFoundMessage]);

  // When a game is opened it replaces the calculator/simulator panel at the top
  // of the page, so scroll back up to bring that panel into view (the cards live
  // further down). Opening from a card click otherwise leaves the user staring
  // at the grid with no visible change.
  const openGame = useCallback((game: LabItem | null) => {
    setActiveGame(game);
    if (game) {
      // Scroll after the panel has swapped in — running it in the same tick as
      // setState can get cancelled by the ensuing layout change. Two rAFs defer
      // it past React's commit + the resulting reflow; we hit both window and
      // the scrolling element so it works whichever one actually scrolls.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.scrollingElement?.scrollTo({ top: 0, behavior: "smooth" });
        })
      );
    }
  }, []);

  const selectClass = (cls: number) => {
    if (cls === classId) return;
    setClassId(cls);
    setActiveGame(null);
    if (subjectId) load(subjectId, cls, search);
  };

  // Debounce the search text so we don't hit the backend on every keystroke.
  useEffect(() => {
    if (!subjectId) return;
    const timer = setTimeout(() => {
      load(subjectId, classId, search);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const reload = () => {
    if (subjectId) load(subjectId, classId, search);
  };

  return {
    status,
    error,
    subjectId,
    items,
    classId,
    search,
    setSearch,
    selectClass,
    activeGame,
    setActiveGame: openGame,
    reload,
  };
}
