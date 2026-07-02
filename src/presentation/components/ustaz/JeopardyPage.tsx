import { useMemo, useState, type ChangeEvent } from "react";

interface JeopardyCell {
  points: number;
  q: string;
  a: string;
  used: boolean;
}

interface JeopardyCategory {
  name: string;
  cells: JeopardyCell[];
}

interface Team {
  name: string;
  score: number;
  color: string;
}

interface Material {
  name: string;
}

type Mode = "setup" | "play";
type Active = { ci: number; ri: number };
type Editing = { ci: number; ri: number };

const PALETTE = ["#1E6E5C", "#B4533B", "#4A6C8C", "#8C7A3C", "#6E5B8A"];
const POINTS = [100, 200, 300, 400, 500];

function blankCategories(): JeopardyCategory[] {
  return Array.from({ length: 5 }, () => ({
    name: "",
    cells: POINTS.map((points) => ({ points, q: "", a: "", used: false })),
  }));
}

function demoCategories(): JeopardyCategory[] {
  const demo: { name: string; qa: [string, string][] }[] = [
    {
      name: "Ғарыш",
      qa: [
        ["Күнге ең жақын планета", "Меркурий"],
        ["Күн жүйесінде неше планета бар", "Сегіз"],
        ["Біздің галактикамыздың атауы", "Құс жолы"],
        ["Ғарышқа ұшқан алғашқы адам", "Юрий Гагарин"],
        ["Сақиналары ең айқын көрінетін планета", "Сатурн"],
      ],
    },
    {
      name: "Жануарлар",
      qa: [
        ["Жердегі ең үлкен жануар", "Көк кит"],
        ["Өрмекшінің неше аяғы бар", "Сегіз"],
        ["Қоршаған ортаға қарай түсін өзгертетін жануар", "Хамелеон"],
        ["Құрлықтағы ең жылдам жануар", "Гепард"],
        ["Ұша алатын жалғыз сүтқоректі", "Жарқанат"],
      ],
    },
    {
      name: "Қазақстан",
      qa: [
        ["Қазақстанның астанасы", "Астана"],
        ["Батыс шекарадағы ең үлкен теңіз", "Каспий теңізі"],
        ["Қазақстанның ең үлкен қаласы", "Алматы"],
        ["Елдің ұлттық валютасы", "Теңге"],
        ["Қазақстандағы әлемге әйгілі ғарыш айлағы", "Байқоңыр"],
      ],
    },
    {
      name: "Адам денесі",
      qa: [
        ["Қанды денеге айдайтын мүше", "Жүрек"],
        ["Ересек адамда неше тіс бар", "32 тіс"],
        ["Тыныс алуға жауапты мүше", "Өкпе"],
        ["Адам денесіндегі ең ұзын сүйек", "Ортан жілік"],
        ["Ересек адамда барлығы неше сүйек бар", "206 сүйек"],
      ],
    },
    {
      name: "Өнертабыстар",
      qa: [
        ["Телефонды кім ойлап тапты", "Александр Белл"],
        ["Иоганн Гутенберг нені ойлап тапты", "Баспа станогы"],
        ["Қағаз қай елде ойлап табылған", "Қытай"],
        ["Жалынды шамды жетілдірген кім", "Томас Эдисон"],
        ["Дүниежүзілік компьютер желісінің атауы", "Интернет"],
      ],
    },
  ];
  return demo.map((c) => ({
    name: c.name,
    cells: c.qa.map(([q, a], i) => ({ points: POINTS[i], q, a, used: false })),
  }));
}

function pluralKk(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

interface JeopardyPageProps {
  onBack: () => void;
}

export function JeopardyPage({ onBack }: JeopardyPageProps) {
  const [mode, setMode] = useState<Mode>("setup");
  const [categories, setCategories] = useState<JeopardyCategory[] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [manualGrid, setManualGrid] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [teams, setTeams] = useState<Team[]>([
    { name: "Сұңқарлар", score: 0, color: "#1E6E5C" },
    { name: "Барыстар", score: 0, color: "#B4533B" },
    { name: "Кометалар", score: 0, color: "#4A6C8C" },
  ]);

  const [active, setActive] = useState<Active | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const cats = categories ?? blankCategories();

  const totalQuestions = cats.reduce(
    (n, c) => n + c.cells.filter((cl) => cl.q.trim()).length,
    0
  );
  const counts = `${totalQuestions} ${pluralKk(totalQuestions, "сұрақ", "сұрақ")} · ${cats.length} ${pluralKk(cats.length, "санат", "санат")}`;

  const boardEmpty =
    !generating && !manualGrid && cats.every((c) => c.cells.every((cl) => !cl.q.trim() && !cl.a.trim()));
  const showGrid = !generating && !boardEmpty;
  const canGenerate = !generating && materials.length > 0;

  const setupHint = boardEmpty
    ? "Сабақ материалынан бастаңыз — сұрақтар мен жауаптар автоматты түрде жасалады. Немесе торды қолмен толтырыңыз."
    : "Сұрақ пен жауапты өзгерту үшін ұяшықты басыңыз. Санат атаулары тікелей тақырыпта өңделеді.";

  const genHint = canGenerate || generating
    ? "Содан кейін қолмен өңдеуге болады"
    : "Алдымен сабақ материалын қосыңыз";

  function updateCategories(updater: (prev: JeopardyCategory[]) => JeopardyCategory[]) {
    setCategories((prev) => updater(prev ?? blankCategories()));
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const added = files.map((f) => ({ name: f.name }));
    setMaterials((prev) => [...prev, ...added]);
    runGenerate(added[added.length - 1].name);
  }

  function removeMaterial(i: number) {
    setMaterials((prev) => prev.filter((_, k) => k !== i));
  }

  function runGenerate(fromName?: string) {
    const name = fromName ?? materials[materials.length - 1]?.name ?? "материал";
    setGenerating(true);
    setEditing(null);
    setGenStatus(`«${name}» талдануда…`);
    setTimeout(() => setGenStatus("Санаттар бойынша сұрақтар мен жауаптар құрастырылуда…"), 850);
    setTimeout(() => {
      setCategories(demoCategories());
      setGenerating(false);
      setGenStatus("");
    }, 1900);
  }

  function fillManual() {
    setManualGrid(true);
  }

  function clearAll() {
    updateCategories((prev) =>
      prev.map((c) => ({ ...c, cells: c.cells.map((cl) => ({ ...cl, q: "", a: "", used: false })) }))
    );
    setManualGrid(false);
    setEditing(null);
  }

  function setCategoryName(ci: number, name: string) {
    updateCategories((prev) => prev.map((c, i) => (i !== ci ? c : { ...c, name })));
  }

  function openCellEditor(ci: number, ri: number) {
    const cell = cats[ci].cells[ri];
    setEditing({ ci, ri });
    setEditQ(cell.q);
    setEditA(cell.a);
  }

  function saveEdit() {
    if (!editing) return;
    const { ci, ri } = editing;
    updateCategories((prev) =>
      prev.map((c, i) =>
        i !== ci ? c : { ...c, cells: c.cells.map((cl, j) => (j !== ri ? cl : { ...cl, q: editQ, a: editA })) }
      )
    );
    setEditing(null);
  }

  function clearCell() {
    setEditQ("");
    setEditA("");
  }

  function cancelEdit() {
    setEditing(null);
  }

  function setTeamName(ti: number, name: string) {
    setTeams((prev) => prev.map((t, i) => (i !== ti ? t : { ...t, name })));
  }

  function addTeam() {
    setTeams((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, { name: `Команда ${prev.length + 1}`, score: 0, color: PALETTE[prev.length % PALETTE.length] }];
    });
  }

  function removeTeam(ti: number) {
    setTeams((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== ti)));
  }

  function goPlay() {
    setMode("play");
    setActive(null);
    setRevealed(false);
    setResults(false);
    setEditing(null);
  }

  function goSetup() {
    setMode("setup");
    setActive(null);
    setRevealed(false);
    setResults(false);
  }

  function openCell(ci: number, ri: number) {
    if (cats[ci].cells[ri].used) return;
    setActive({ ci, ri });
    setRevealed(false);
  }

  function closeQuestion() {
    setActive(null);
    setRevealed(false);
  }

  function award(ti: number | null) {
    if (!active) return;
    const { ci, ri } = active;
    const points = cats[ci].cells[ri].points;
    updateCategories((prev) =>
      prev.map((c, i) =>
        i !== ci ? c : { ...c, cells: c.cells.map((cl, j) => (j !== ri ? cl : { ...cl, used: true })) }
      )
    );
    if (ti !== null) {
      setTeams((prev) => prev.map((t, i) => (i !== ti ? t : { ...t, score: t.score + points })));
    }
    const allUsed = cats.every((c, i) =>
      c.cells.every((cl, j) => (i === ci && j === ri ? true : cl.used))
    );
    setActive(null);
    setRevealed(false);
    if (allUsed) setResults(true);
  }

  function resetGame() {
    updateCategories((prev) => prev.map((c) => ({ ...c, cells: c.cells.map((cl) => ({ ...cl, used: false })) })));
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
    setResults(false);
    setActive(null);
    setRevealed(false);
  }

  const activeCell = active ? cats[active.ci] : null;
  const activeCellData = active ? cats[active.ci].cells[active.ri] : null;
  const editingCell = editing ? cats[editing.ci].cells[editing.ri] : null;
  const editingCat = editing ? cats[editing.ci] : null;

  const maxScore = Math.max(0, ...teams.map((t) => t.score));
  const resultTeams = useMemo(
    () =>
      [...teams].sort((a, b) => b.score - a.score).map((t, idx) => ({
        ...t,
        rank: idx + 1,
        leader: maxScore > 0 && t.score === maxScore,
      })),
    [teams, maxScore]
  );

  return (
    <div style={{ position: "relative", background: "#F7F5EF", color: "#1A1A17", height: "100%", display: "flex", flexDirection: "column", fontSize: "15px", lineHeight: 1.5, overflow: "hidden" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "11px 20px", borderBottom: "1px solid #E6E2D8", background: "#F7F5EF", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            title="Басты бетке"
            style={{ width: "32px", height: "32px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1A1A17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5" /></svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <span style={{ fontFamily: "Spectral, serif", fontSize: "18px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Өз ойының
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <Chip>Викторина</Chip>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{ display: "flex", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "8px", padding: "2px" }}>
            <SegBtn active={mode === "setup"} onClick={goSetup}>Баптау</SegBtn>
            <SegBtn active={mode === "play"} onClick={goPlay}>Презентация</SegBtn>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {mode === "setup" && (
          <div style={{ flex: 1, overflow: "auto", padding: "24px 28px 40px", display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "22px", margin: "0 0 4px" }}>Ойын алаңын баптау</h1>
                <p style={{ fontSize: "13px", color: "#6F6E66", margin: 0 }}>{setupHint}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "13px", color: "#6F6E66", whiteSpace: "nowrap" }}>{counts}</span>
                {showGrid && (
                  <button type="button" onClick={clearAll} style={{ border: "none", background: "none", padding: 0, color: "#B4533B", fontFamily: "inherit", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
                    Алаңды тазалау
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1E6E5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2.5h5L12 5.5v8H4z" /><path d="M9 2.5v3h3M8 11.7V8M6.6 9.4 8 8l1.4 1.4" /></svg>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A17" }}>Сабақ материалдары</span>
                    <span style={{ padding: "3px 9px", background: "#E4EFEA", color: "#3B5A50", borderRadius: "99px", fontSize: "11.5px" }}>сұрақтар автоматты жасалады</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    {materials.map((m, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 6px", background: "#FBFAF6", border: "1px solid #E6E2D8", borderRadius: "9px", fontSize: "13px", color: "#33322C" }}>
                        <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#E4EFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#1E6E5C" strokeWidth="1.3"><rect x="2.5" y="1.5" width="9" height="11" rx="1.5" /><path d="M5 5h4M5 7.5h4" strokeLinecap="round" /></svg>
                        </span>
                        <span style={{ maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                        <button type="button" onClick={() => removeMaterial(i)} title="Материалды алып тастау" style={{ width: "22px", height: "22px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", flexShrink: 0 }}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#A6A498" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
                        </button>
                      </span>
                    ))}
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 13px", background: "#FFFFFF", border: "1px dashed #D2CDBF", borderRadius: "9px", color: "#6F6E66", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9" /></svg>
                      Материал қосу
                      <input type="file" accept=".pdf,.pptx,.docx,.txt,.png,.jpg,.jpeg" multiple style={{ display: "none" }} onChange={handleFiles} />
                    </label>
                  </div>
                  <p style={{ fontSize: "12px", color: "#A6A498", margin: "11px 0 0" }}>PDF, PPTX, DOCX немесе сурет · 20 МБ дейін</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "7px", flexShrink: 0 }}>
                  {generating ? (
                    <button type="button" disabled style={{ display: "inline-flex", alignItems: "center", gap: "9px", height: "40px", padding: "0 18px", border: "none", borderRadius: "8px", background: "#93B7AD", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "default" }}>
                      <span style={{ display: "inline-flex", gap: "3px" }}>
                        <span className="u365-dot-1" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff" }} />
                        <span className="u365-dot-2" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff" }} />
                        <span className="u365-dot-3" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff" }} />
                      </span>
                      Жасалуда…
                    </button>
                  ) : canGenerate ? (
                    <button type="button" onClick={() => runGenerate()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.2 9.3 6 13 7.3 9.3 8.6 8 12.4 6.7 8.6 3 7.3 6.7 6z" /></svg>
                      Сұрақтарды жасау
                    </button>
                  ) : (
                    <button type="button" disabled style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", border: "none", borderRadius: "8px", background: "#E7E4DB", color: "#A6A498", fontFamily: "inherit", fontSize: "14px", cursor: "default" }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#A6A498" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.2 9.3 6 13 7.3 9.3 8.6 8 12.4 6.7 8.6 3 7.3 6.7 6z" /></svg>
                      Сұрақтарды жасау
                    </button>
                  )}
                  <span style={{ fontSize: "12px", color: "#6F6E66", textAlign: "right" }}>{genHint}</span>
                </div>
              </div>
              {generating && (
                <>
                  <div style={{ position: "relative", height: "3px", background: "#EEEAE0", overflow: "hidden" }}>
                    <div className="u365-bar-progress" style={{ position: "absolute", top: 0, height: "100%", width: "35%" }} />
                  </div>
                  <div style={{ padding: "11px 18px", background: "#FBFAF6", borderTop: "1px solid #EEEAE0", display: "flex", alignItems: "center", gap: "10px", color: "#6F6E66", fontSize: "13.5px" }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.2 9.3 6 13 7.3 9.3 8.6 8 12.4 6.7 8.6 3 7.3 6.7 6z" /></svg>
                    {genStatus}
                  </div>
                </>
              )}
            </div>

            {generating && (
              <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
                {[0, 1, 2, 3, 4].map((c) => (
                  <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                    <div className="u365-skeleton-line" style={{ height: "44px", borderRadius: "8px", background: "#E7E4DB" }} />
                    {[0, 1, 2, 3, 4].map((r) => (
                      <div key={r} className="u365-skeleton-line-d1" style={{ minHeight: "98px", borderRadius: "8px", background: "#F0EDE4" }} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {boardEmpty && (
              <div style={{ background: "#FFFFFF", border: "1px dashed #D2CDBF", borderRadius: "12px", minHeight: "390px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#E4EFEA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" /><path d="M16.75 13.6v6.3M13.6 16.75h6.3" /></svg>
                </div>
                <h2 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "21px", margin: "18px 0 8px" }}>Ойын алаңы әзірше бос</h2>
                <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#6F6E66", maxWidth: "440px", margin: 0 }}>
                  Сабақ материалын — PDF, презентация немесе құжатты — жүктеңіз, сұрақтар мен жауаптар автоматты түрде жасалады. Немесе ұяшықтарды қолмен толтырыңыз.
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", justifyContent: "center" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V3.5M4.8 6.7 8 3.5l3.2 3.2M3 12.5h10" /></svg>
                    Материал жүктеу
                    <input type="file" accept=".pdf,.pptx,.docx,.txt,.png,.jpg,.jpeg" multiple style={{ display: "none" }} onChange={handleFiles} />
                  </label>
                  <button type="button" onClick={fillManual} style={{ height: "40px", padding: "0 18px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#1A1A17", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                    Қолмен толтыру
                  </button>
                </div>
              </div>
            )}

            {showGrid && (
              <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
                {cats.map((col, ci) => (
                  <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                    <input
                      value={col.name}
                      onChange={(e) => setCategoryName(ci, e.target.value)}
                      placeholder="Санат"
                      style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "15px", textAlign: "center", color: "#1A1A17", background: "#ECEAE2", border: "1px solid #E6E2D8", borderRadius: "8px", padding: "11px 8px", width: "100%" }}
                    />
                    {col.cells.map((cell, ri) => (
                      <button
                        key={ri}
                        type="button"
                        onClick={() => openCellEditor(ci, ri)}
                        style={{ textAlign: "left", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "8px", padding: "10px 11px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px", minHeight: "98px" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "15px", color: "#1E6E5C" }}>{cell.points}</span>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#C3BFB2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2.5 11.5 5 5 11.5 2.5 12l.5-2.5z" /></svg>
                        </span>
                        <span style={{ fontSize: "12.5px", lineHeight: 1.42, color: "#6F6E66", maxHeight: "54px", overflow: "hidden" }}>
                          {cell.q.trim() || "Сұрақ қосу"}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: "1px solid #E6E2D8", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                <h2 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "16px", margin: 0 }}>Командалар</h2>
                <span style={{ fontSize: "12.5px", color: "#6F6E66" }}>Ұпайлар ойын кезінде командаларға беріледі</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {teams.map((t, ti) => (
                  <div key={ti} style={{ display: "flex", alignItems: "center", gap: "9px", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "10px", padding: "7px 10px 7px 12px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <input
                      value={t.name}
                      onChange={(e) => setTeamName(ti, e.target.value)}
                      style={{ border: "none", background: "transparent", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#1A1A17", width: "124px" }}
                    />
                    {teams.length > 2 && (
                      <button type="button" onClick={() => removeTeam(ti)} title="Команданы алып тастау" style={{ width: "24px", height: "24px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#A6A498" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                {teams.length < 5 && (
                  <button type="button" onClick={addTeam} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px dashed #D2CDBF", borderRadius: "10px", padding: "8px 13px", color: "#6F6E66", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9" /></svg>
                    Команда қосу
                  </button>
                )}
              </div>
            </div>

            {showGrid && (
              <div>
                <button type="button" onClick={goPlay} style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 20px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                  Презентацияны бастау
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" /></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "play" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#F1EEE6" }}>
            <div style={{ flex: 1, display: "flex", gap: "12px", padding: "22px 24px", minHeight: 0 }}>
              {cats.map((col, ci) => (
                <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                  <div style={{ background: "#1E6E5C", color: "#fff", borderRadius: "10px", padding: "10px 8px", textAlign: "center", fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "16.5px", lineHeight: 1.2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "56px" }}>
                    {col.name || "—"}
                  </div>
                  {col.cells.map((cell, ri) =>
                    cell.used ? (
                      <div key={ri} style={{ flex: 1, borderRadius: "10px", background: "#E8E5DD", border: "1px solid #E2DED4", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", minHeight: "64px" }}>
                        <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "21px", color: "#C0BCAF", textDecoration: "line-through" }}>{cell.points}</span>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A6A498" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19 6.5" /></svg>
                      </div>
                    ) : (
                      <button
                        key={ri}
                        type="button"
                        onClick={() => openCell(ci, ri)}
                        style={{ flex: 1, border: "1px solid #E6E2D8", borderRadius: "10px", background: "#FCFBF8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "64px", fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "31px", color: "#1E6E5C" }}
                      >
                        {cell.points}
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #E6E2D8", background: "#F7F5EF", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {teams.map((t, ti) => (
                  <div key={ti} style={{ display: "flex", alignItems: "center", gap: "9px", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "10px", padding: "7px 14px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13.5px", color: "#33322C" }}>{t.name}</span>
                    <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "16px", color: "#1A1A17" }}>{t.score}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={resetGame} style={{ height: "34px", padding: "0 14px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#6F6E66", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                  Қалпына келтіру
                </button>
                <button type="button" onClick={() => setResults(true)} style={{ height: "34px", padding: "0 16px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                  Ойын қорытындысы
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "play" && active && !revealed && !results && activeCell && activeCellData && (
          <div style={{ position: "absolute", inset: 0, background: "#F7F5EF", display: "flex", flexDirection: "column", zIndex: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                <Chip>{activeCell.name || "—"}</Chip>
                <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "19px", color: "#1E6E5C" }}>{activeCellData.points}</span>
              </span>
              <button type="button" onClick={closeQuestion} title="Алаңға оралу" style={{ width: "36px", height: "36px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#6F6E66" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px 64px", gap: "44px" }}>
              <h2 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "46px", lineHeight: 1.25, margin: 0, maxWidth: "960px" }}>
                {activeCellData.q || "Сұрақ енгізілмеген"}
              </h2>
              <button type="button" onClick={() => setRevealed(true)} style={{ height: "54px", padding: "0 32px", border: "none", borderRadius: "10px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "17px", cursor: "pointer" }}>
                Жауапты көрсету
              </button>
            </div>
          </div>
        )}

        {mode === "play" && active && revealed && !results && activeCell && activeCellData && (
          <div style={{ position: "absolute", inset: 0, background: "#F7F5EF", display: "flex", flexDirection: "column", zIndex: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                <Chip>{activeCell.name || "—"}</Chip>
                <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "19px", color: "#1E6E5C" }}>{activeCellData.points}</span>
              </span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px 64px", gap: "20px" }}>
              <span style={{ fontSize: "17px", color: "#6F6E66", maxWidth: "820px", lineHeight: 1.5 }}>{activeCellData.q}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "#A6A498" }}>Жауабы</span>
                <h2 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "52px", lineHeight: 1.18, margin: 0, color: "#1E6E5C", maxWidth: "960px" }}>
                  {activeCellData.a || "Жауап енгізілмеген"}
                </h2>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #E6E2D8", padding: "15px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", background: "#FCFBF8" }}>
              <span style={{ fontSize: "14px", color: "#6F6E66", marginRight: "4px" }}>Кім дұрыс жауап берді?</span>
              {teams.map((t, ti) => (
                <button
                  key={ti}
                  type="button"
                  onClick={() => award(ti)}
                  style={{ display: "flex", alignItems: "center", gap: "9px", height: "42px", padding: "0 17px", border: "1px solid #E6E2D8", borderRadius: "9px", background: "#FFFFFF", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", color: "#1A1A17" }}
                >
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  {t.name}
                  <span style={{ color: "#1E6E5C", fontWeight: 600 }}>+{activeCellData.points}</span>
                </button>
              ))}
              <button type="button" onClick={() => award(null)} style={{ height: "42px", padding: "0 16px", border: "none", borderRadius: "9px", background: "transparent", color: "#6F6E66", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                Ешкім
              </button>
            </div>
          </div>
        )}

        {mode === "play" && results && (
          <div style={{ position: "absolute", inset: 0, background: "#F7F5EF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 6, padding: "30px" }}>
            <span style={{ fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "#6F6E66", marginBottom: "8px" }}>Ойын аяқталды</span>
            <h2 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "34px", margin: "0 0 26px" }}>Ойын қорытындысы</h2>
            <div style={{ width: "100%", maxWidth: "470px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {resultTeams.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", background: t.leader ? "#EEF4F1" : "#FFFFFF", border: `1px solid ${t.leader ? "#1E6E5C" : "#E6E2D8"}` }}>
                  <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "18px", color: "#A6A498", width: "20px", textAlign: "center" }}>{t.rank}</span>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "16px", color: "#1A1A17" }}>{t.name}</span>
                  {t.leader && (
                    <span style={{ padding: "3px 10px", background: "#1E6E5C", color: "#fff", borderRadius: "99px", fontSize: "11.5px", letterSpacing: ".02em" }}>Көшбасшы</span>
                  )}
                  <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "23px", color: "#1A1A17", minWidth: "44px", textAlign: "right" }}>{t.score}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button type="button" onClick={() => setResults(false)} style={{ height: "40px", padding: "0 20px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#1A1A17", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                Алаңға оралу
              </button>
              <button type="button" onClick={resetGame} style={{ height: "40px", padding: "0 20px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                Қайта ойнау
              </button>
            </div>
          </div>
        )}

        {mode === "setup" && editing && editingCell && editingCat && (
          <div onClick={cancelEdit} style={{ position: "absolute", inset: 0, background: "rgba(26,26,23,.30)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "24px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "14px", boxShadow: "0 14px 44px rgba(0,0,0,.18)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #EEEAE0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <Chip>{editingCat.name || "—"}</Chip>
                  <span style={{ fontFamily: "Spectral, serif", fontWeight: 600, fontSize: "16px", color: "#1E6E5C" }}>{editingCell.points}</span>
                </div>
                <button type="button" onClick={cancelEdit} style={{ width: "30px", height: "30px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "7px" }}>
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="#6F6E66" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
                </button>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ fontSize: "13px", color: "#6F6E66" }}>Сұрақ</span>
                  <textarea
                    value={editQ}
                    onChange={(e) => setEditQ(e.target.value)}
                    placeholder="Сұрақты енгізіңіз…"
                    style={{ minHeight: "82px", resize: "vertical", fontFamily: "inherit", fontSize: "15px", lineHeight: 1.5, color: "#1A1A17", border: "1px solid #E6E2D8", borderRadius: "9px", padding: "11px 12px", background: "#FCFBF8" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <span style={{ fontSize: "13px", color: "#6F6E66" }}>Жауап</span>
                  <textarea
                    value={editA}
                    onChange={(e) => setEditA(e.target.value)}
                    placeholder="Жауапты енгізіңіз…"
                    style={{ minHeight: "58px", resize: "vertical", fontFamily: "inherit", fontSize: "15px", lineHeight: 1.5, color: "#1A1A17", border: "1px solid #E6E2D8", borderRadius: "9px", padding: "11px 12px", background: "#FCFBF8" }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 20px", borderTop: "1px solid #EEEAE0", background: "#FBFAF6" }}>
                <button type="button" onClick={clearCell} style={{ border: "none", background: "none", color: "#B4533B", fontFamily: "inherit", fontSize: "13.5px", cursor: "pointer", padding: 0 }}>
                  Ұяшықты тазалау
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={cancelEdit} style={{ height: "38px", padding: "0 16px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#1A1A17", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                    Бас тарту
                  </button>
                  <button type="button" onClick={saveEdit} style={{ height: "38px", padding: "0 20px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                    Сақтау
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: "4px 9px", background: "#E4EFEA", color: "#3B5A50", borderRadius: "8px", fontSize: "12px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: "28px", padding: "0 14px", border: "none", borderRadius: "6px", background: active ? "#1E6E5C" : "transparent", color: active ? "#fff" : "#6F6E66", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}
    >
      {children}
    </button>
  );
}
