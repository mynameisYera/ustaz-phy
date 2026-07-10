import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent } from 'react';
import {
  fetchLabSubjects,
  toContentBase64,
  uploadLabGame,
  type LabSubject,
  type LabGameCreated,
} from '@/infrastructure/labs/LabsApi';

const ACCENT = '#1E6E5C';
const ACCENT_SOFT = '#E4F2ED';

type SubjectsStatus = 'loading' | 'ready' | 'error';
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function UploadHtmlPage() {
  const [subjects, setSubjects] = useState<LabSubject[]>([]);
  const [subjectsStatus, setSubjectsStatus] = useState<SubjectsStatus>('loading');

  const [subjectId, setSubjectId] = useState<string>('');
  const [classId, setClassId] = useState<string>('7');
  const [name, setName] = useState<string>('Жаңа ойын');
  const [content, setContent] = useState<string>('');
  const [isBase64, setIsBase64] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [created, setCreated] = useState<LabGameCreated | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchLabSubjects()
      .then((list) => {
        setSubjects(list);
        setSubjectsStatus('ready');
        if (list.length > 0) {
          setSubjectId(String(list[0].subjectId));
        }
      })
      .catch(() => {
        setSubjectsStatus('error');
      });
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    setIsBase64(false);
    setFileName(file.name);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const subjectIdNum = Number(subjectId);
    const classIdNum = Number(classId);
    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    if (!Number.isFinite(subjectIdNum) || subjectId.trim() === '') {
      setStatus('error');
      setMessage('Пәнді таңдаңыз (subjectId).');
      return;
    }
    if (!Number.isFinite(classIdNum) || classId.trim() === '') {
      setStatus('error');
      setMessage('Сынып нөмірін енгізіңіз (classId).');
      return;
    }
    if (trimmedName === '') {
      setStatus('error');
      setMessage('Ойын атауын енгізіңіз.');
      return;
    }
    if (trimmedContent === '') {
      setStatus('error');
      setMessage('HTML мазмұнын енгізіңіз немесе файл жүктеңіз.');
      return;
    }

    const contentBase64 = isBase64 ? trimmedContent : toContentBase64(content);

    setStatus('submitting');
    setMessage('');
    setCreated(null);

    try {
      const result = await uploadLabGame({
        subjectId: subjectIdNum,
        classId: classIdNum,
        name: trimmedName,
        contentBase64,
      });
      setStatus('success');
      setCreated(result);
      setMessage('Ойын сәтті жүктелді.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Белгісіз қате орын алды.');
    }
  }

  const submitting = status === 'submitting';

  return (
    <div style={rootStyle}>
      <main style={mainStyle}>
        <span style={eyebrowStyle}>Ішкі құрал</span>
        <h1 style={titleStyle}>HTML ойынын серверге жүктеу</h1>
        <p style={subtitleStyle}>
          HTML файлын немесе base64 мазмұнын <code>/api/lab/games</code> эндпойнтіне жіберіңіз.
        </p>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Пән (subjectId)</span>
            {subjectsStatus === 'ready' ? (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={inputStyle}
              >
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name} (#{s.subjectId})
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="number"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  placeholder="12"
                  style={inputStyle}
                />
                {subjectsStatus === 'loading' && <span style={hintStyle}>Пәндер жүктелуде…</span>}
                {subjectsStatus === 'error' && (
                  <span style={hintStyle}>
                    Пәндер тізімін жүктеу мүмкін болмады — subjectId-ді қолмен енгізіңіз.
                  </span>
                )}
              </>
            )}
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Сынып (classId)</span>
            <input
              type="number"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="7"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Атауы (name)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Big Game"
              style={inputStyle}
            />
          </label>

          <div style={fieldStyle}>
            <span style={labelStyle}>HTML файлы</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,text/html"
              onChange={handleFile}
              style={{ fontSize: '14px' }}
            />
            {fileName && <span style={hintStyle}>Жүктелген файл: {fileName}</span>}
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>Мазмұн (HTML немесе base64)</span>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setFileName('');
              }}
              placeholder="<html><body>...</body></html>"
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#3A3A34' }}>
            <input
              type="checkbox"
              checked={isBase64}
              onChange={(e) => setIsBase64(e.target.checked)}
            />
            Мазмұн base64 форматында (қайта кодталмайды)
          </label>

          <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Жіберілуде…' : 'Серверге жүктеу →'}
          </button>

          {status === 'error' && <div style={errorBoxStyle}>{message}</div>}
          {status === 'success' && created && (
            <div style={successBoxStyle}>
              <strong>{message}</strong>
              <div style={{ marginTop: '6px', fontSize: '14px' }}>
                ID: <b>{created.id}</b> · Атауы: {created.name} · Сынып: {created.classId}
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

const rootStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#F7F5EF',
  overflowY: 'auto',
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#1A1A17',
};

const mainStyle: CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '56px 24px 80px',
};

const eyebrowStyle: CSSProperties = {
  display: 'inline-flex',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: ACCENT,
  background: ACCENT_SOFT,
  padding: '4px 10px',
  borderRadius: '999px',
  marginBottom: '12px',
};

const titleStyle: CSSProperties = {
  fontFamily: 'Spectral, serif',
  fontWeight: 600,
  fontSize: '32px',
  letterSpacing: '-0.01em',
  margin: '0 0 8px',
};

const subtitleStyle: CSSProperties = {
  color: '#6F6E66',
  fontSize: '15px',
  margin: '0 0 28px',
};

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  border: '1px solid #E6E2D8',
  borderRadius: '16px',
  background: '#FFFFFF',
  padding: '32px',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#3A3A34',
};

const inputStyle: CSSProperties = {
  height: '42px',
  padding: '0 12px',
  border: '1px solid #D8D4C8',
  borderRadius: '8px',
  background: '#FFFFFF',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: '#1A1A17',
  boxSizing: 'border-box',
  width: '100%',
};

const hintStyle: CSSProperties = {
  fontSize: '12px',
  color: '#8A8A80',
};

const buttonStyle: CSSProperties = {
  height: '46px',
  border: 'none',
  borderRadius: '8px',
  background: ACCENT,
  color: '#FFFFFF',
  fontFamily: 'inherit',
  fontSize: '15px',
  fontWeight: 500,
  cursor: 'pointer',
};

const errorBoxStyle: CSSProperties = {
  border: '1px solid #F0C4B4',
  background: '#FBEAE3',
  color: '#9A3B12',
  borderRadius: '8px',
  padding: '12px 14px',
  fontSize: '14px',
};

const successBoxStyle: CSSProperties = {
  border: `1px solid ${ACCENT}`,
  background: ACCENT_SOFT,
  color: '#155040',
  borderRadius: '8px',
  padding: '12px 14px',
  fontSize: '14px',
};
