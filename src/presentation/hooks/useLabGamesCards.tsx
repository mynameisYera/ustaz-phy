import { useCallback, useEffect, useState } from "react";
import type { LabGameCard } from "@/presentation/components/ustaz/LabShell";
import { fetchLabGames, fetchLabSubjects, openLabItemContent } from "@/infrastructure/labs/LabsApi";

type LoadStatus = "loading" | "ready" | "error";

function labIcon(index: number, tone: "accent" | "amber") {
  const stroke = tone === "accent" ? "var(--accent-bright)" : "#FBBF24";
  const fill = tone === "accent" ? "var(--accent-bright)" : "#FBBF24";

  if (index % 2 === 0) {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
        <line x1="4" y1="24" x2="44" y2="24" />
        <line x1="24" y1="4" x2="24" y2="44" />
        <polyline points="10,38 20,20 30,28 40,10" />
        <circle cx="20" cy="20" r="3" fill={fill} opacity="0.25" />
        <circle cx="30" cy="28" r="3" fill={fill} opacity="0.25" />
      </svg>
    );
  }

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
      <polygon points="12,38 24,10 36,38" />
      <line x1="16" y1="30" x2="32" y2="30" />
      <path d="M10 14h8M28 14h8" />
    </svg>
  );
}

function mapItemsToCards(items: Awaited<ReturnType<typeof fetchLabGames>>["items"]): LabGameCard[] {
  return items.map((item, index) => {
    const tone = index % 3 === 0 ? "amber" : "accent";
    return {
      tone,
      tag: tone === "accent" ? "СИМУЛЯТОР" : "ОЙЫН",
      name: item.name,
      desc: item.name,
      icon: labIcon(index, tone),
      onClick: () => openLabItemContent(item),
    };
  });
}

export function useLabGamesCards(apiSubjectName: string, notFoundMessage: string) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [cards, setCards] = useState<LabGameCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((id: number) => {
    setStatus("loading");
    setError(null);
    void fetchLabGames(id)
      .then(({ items }) => {
        setCards(mapItemsToCards(items));
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Зертханаларды жүктеу мүмкін болмады");
        setStatus("error");
      });
  }, []);

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
        load(match.subjectId);
      })
      .catch((e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Пәндерді жүктеу мүмкін болмады");
      });
  }, [apiSubjectName, load, notFoundMessage]);

  const reload = () => {
    if (subjectId) load(subjectId);
  };

  return { status, cards, error, subjectId, reload };
}
