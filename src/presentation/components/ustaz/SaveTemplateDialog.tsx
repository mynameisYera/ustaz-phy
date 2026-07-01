import { useEffect, useState } from "react";
import {
  fetchClasses,
  fetchSubjects,
  fetchTopics,
  type CatalogItem,
} from "@/infrastructure/templates/CatalogApi";
import { createTemplate } from "@/infrastructure/templates/TemplatesApi";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  templateName: string;
  content: string;
  initialClassId?: number;
  initialSubjectName?: string;
  initialTopicName?: string;
  onSaved: () => void;
}

type TopicMode = "existing" | "new";

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function SaveTemplateDialog({
  open,
  onClose,
  templateName,
  content,
  initialClassId,
  initialSubjectName,
  initialTopicName,
  onSaved,
}: SaveTemplateDialogProps) {
  const [classes, setClasses] = useState<CatalogItem[]>([]);
  const [subjects, setSubjects] = useState<CatalogItem[]>([]);
  const [topics, setTopics] = useState<CatalogItem[]>([]);

  const [classId, setClassId] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [topicMode, setTopicMode] = useState<TopicMode>("existing");
  const [newTopicName, setNewTopicName] = useState("");

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setSaving(false);
    setTopicMode("existing");
    setNewTopicName(initialTopicName?.trim() ?? "");

    let cancelled = false;
    setCatalogLoading(true);

    void (async () => {
      try {
        const { items } = await fetchClasses();
        if (cancelled) return;
        setClasses(items);

        const matchedClass = initialClassId != null
          ? items.find((c) => c.id === initialClassId)
          : undefined;
        const nextClassId = matchedClass?.id ?? "";
        setClassId(nextClassId);

        if (nextClassId === "") {
          setSubjects([]);
          setSubjectId("");
          setTopics([]);
          setTopicId("");
          return;
        }

        const { items: subjectItems } = await fetchSubjects(nextClassId);
        if (cancelled) return;
        setSubjects(subjectItems);

        const matchedSubject = initialSubjectName
          ? subjectItems.find((s) => normalizeName(s.name) === normalizeName(initialSubjectName))
          : undefined;
        const nextSubjectId = matchedSubject?.id ?? "";
        setSubjectId(nextSubjectId);

        if (nextSubjectId === "") {
          setTopics([]);
          setTopicId("");
          return;
        }

        const { items: topicItems } = await fetchTopics(nextSubjectId);
        if (cancelled) return;
        setTopics(topicItems);

        const matchedTopic = initialTopicName
          ? topicItems.find((t) => normalizeName(t.name) === normalizeName(initialTopicName))
          : undefined;
        setTopicId(matchedTopic?.id ?? "");
        setTopicMode(matchedTopic ? "existing" : "new");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Каталогты жүктеу мүмкін болмады");
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, initialClassId, initialSubjectName, initialTopicName]);

  async function handleClassChange(nextClassId: number | "") {
    setClassId(nextClassId);
    setSubjectId("");
    setTopicId("");
    setTopics([]);
    setSubjects([]);

    if (nextClassId === "") return;

    setCatalogLoading(true);
    try {
      const { items } = await fetchSubjects(nextClassId);
      setSubjects(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Пәндерді жүктеу мүмкін болмады");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function handleSubjectChange(nextSubjectId: number | "") {
    setSubjectId(nextSubjectId);
    setTopicId("");
    setTopics([]);

    if (nextSubjectId === "") return;

    setCatalogLoading(true);
    try {
      const { items } = await fetchTopics(nextSubjectId);
      setTopics(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Тақырыптарды жүктеу мүмкін болмады");
    } finally {
      setCatalogLoading(false);
    }
  }

  if (!open) return null;

  const canSave =
    !saving &&
    !catalogLoading &&
    classId !== "" &&
    subjectId !== "" &&
    (topicMode === "existing" ? topicId !== "" : newTopicName.trim().length > 0);

  async function handleSubmit() {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      if (topicMode === "existing") {
        if (topicId === "") return;
        await createTemplate({
          classId,
          subjectId,
          topicId,
          name: templateName || "Ойын",
          content,
        });
      } else {
        await createTemplate({
          classId,
          subjectId,
          topicName: newTopicName.trim(),
          name: templateName || "Ойын",
          content,
        });
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Үлгіні сақтау мүмкін болмады");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(26, 26, 23, 0.45)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E6E2D8",
          boxShadow: "0 16px 48px rgba(26, 26, 23, 0.12)",
          padding: "28px 28px 24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="save-template-title"
          style={{
            margin: "0 0 6px",
            fontFamily: "Spectral, serif",
            fontSize: "22px",
            fontWeight: 500,
            color: "#1A1A17",
          }}
        >
          Үлгі ретінде сақтау
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: "14px", color: "#6F6E66", lineHeight: 1.5 }}>
          Сынып пен тақырыпты таңдаңыз. Қажет болса жаңа тақырып жасай аласыз.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Сынып">
            <select
              value={classId === "" ? "" : String(classId)}
              onChange={(e) => void handleClassChange(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={catalogLoading || saving}
              style={selectStyle}
            >
              <option value="">Сыныпты таңдаңыз</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Пән">
            <select
              value={subjectId === "" ? "" : String(subjectId)}
              onChange={(e) => void handleSubjectChange(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={classId === "" || catalogLoading || saving}
              style={selectStyle}
            >
              <option value="">Пәнді таңдаңыз</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Тақырып">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#1A1A17", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="topicMode"
                    checked={topicMode === "existing"}
                    onChange={() => setTopicMode("existing")}
                    disabled={subjectId === "" || saving}
                  />
                  Бар тақырып
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#1A1A17", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="topicMode"
                    checked={topicMode === "new"}
                    onChange={() => setTopicMode("new")}
                    disabled={subjectId === "" || saving}
                  />
                  Жаңа тақырып
                </label>
              </div>

              {topicMode === "existing" ? (
                <select
                  value={topicId === "" ? "" : String(topicId)}
                  onChange={(e) => setTopicId(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={subjectId === "" || catalogLoading || saving}
                  style={selectStyle}
                >
                  <option value="">Тақырыпты таңдаңыз</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Жаңа тақырып атауы"
                  maxLength={200}
                  disabled={subjectId === "" || saving}
                  style={inputStyle}
                />
              )}
            </div>
          </Field>
        </div>

        {error && (
          <p style={{ margin: "14px 0 0", fontSize: "13px", color: "#B4533B", lineHeight: 1.45 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "22px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              height: "36px",
              padding: "0 16px",
              border: "1px solid #E6E2D8",
              borderRadius: "8px",
              background: "#FFFFFF",
              color: "#1A1A17",
              fontFamily: "inherit",
              fontSize: "14px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Болдырмау
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSave}
            style={{
              height: "36px",
              padding: "0 18px",
              border: "none",
              borderRadius: "8px",
              background: !canSave ? "#A6C8C0" : "#1E6E5C",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "14px",
              cursor: !canSave ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Сақталуда…" : "Сақтау"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "#1A1A17" }}>{label}</span>
      {children}
    </label>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  padding: "0 12px",
  background: "#FFFFFF",
  border: "1px solid #E6E2D8",
  borderRadius: "8px",
  color: "#1A1A17",
  fontFamily: "inherit",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  padding: "0 12px",
  background: "#FFFFFF",
  border: "1px solid #E6E2D8",
  borderRadius: "8px",
  color: "#1A1A17",
  fontFamily: "inherit",
  fontSize: "14px",
};
