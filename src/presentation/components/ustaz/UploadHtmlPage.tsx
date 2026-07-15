import { useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent } from 'react';
import {
  deleteLabGame,
  toContentBase64,
  updateLabGame,
  uploadLabGame,
  type LabGameCreated,
  type LabGameUpdated,
  type UpdateLabGameInput,
} from '@/infrastructure/labs/LabsApi';

const ACCENT = '#1E6E5C';
const ACCENT_SOFT = '#E4F2ED';

const SUBJECTS: { name: string; subjectId: number }[] = [
  { name: 'math', subjectId: 12 },
  { name: 'physics', subjectId: 13 },
  { name: 'chemistry', subjectId: 14 },
  { name: 'geography', subjectId: 15 },
  { name: 'kzhistory', subjectId: 16 },
  { name: 'worldhistory', subjectId: 17 },
  { name: 'biology', subjectId: 18 },
  { name: 'informatic', subjectId: 19 },
  { name: 'literature', subjectId: 20 },
];

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function UploadHtmlPage() {
  const [subjectId, setSubjectId] = useState<string>(String(SUBJECTS[0].subjectId));
  const [classId, setClassId] = useState<string>('7');
  const [name, setName] = useState<string>('Жаңа ойын');
  const [content, setContent] = useState<string>('');
  const [isBase64, setIsBase64] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [created, setCreated] = useState<LabGameCreated | null>(null);

  const [deleteId, setDeleteId] = useState<string>('');
  const [deleteStatus, setDeleteStatus] = useState<SubmitStatus>('idle');
  const [deleteMessage, setDeleteMessage] = useState<string>('');

  const [updateId, setUpdateId] = useState<string>('');
  const [updateSubjectId, setUpdateSubjectId] = useState<string>('');
  const [updateClassId, setUpdateClassId] = useState<string>('');
  const [updateName, setUpdateName] = useState<string>('');
  const [updateContent, setUpdateContent] = useState<string>('');
  const [updateIsBase64, setUpdateIsBase64] = useState<boolean>(false);
  const [updateFileName, setUpdateFileName] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<SubmitStatus>('idle');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [updated, setUpdated] = useState<LabGameUpdated | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDelete(event: FormEvent) {
    event.preventDefault();

    const idNum = Number(deleteId);
    if (!Number.isInteger(idNum) || deleteId.trim() === '') {
      setDeleteStatus('error');
      setDeleteMessage('Жарамды ойын ID енгізіңіз.');
      return;
    }

    if (!window.confirm(`#${idNum} ойынын өшіру керек пе? Бұл әрекетті болдырмау мүмкін емес.`)) {
      return;
    }

    setDeleteStatus('submitting');
    setDeleteMessage('');

    try {
      await deleteLabGame(idNum);
      setDeleteStatus('success');
      setDeleteMessage(`#${idNum} ойыны өшірілді.`);
      setDeleteId('');
    } catch (err) {
      setDeleteStatus('error');
      setDeleteMessage(err instanceof Error ? err.message : 'Белгісіз қате орын алды.');
    }
  }

  async function handleUpdateFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setUpdateContent(text);
    setUpdateIsBase64(false);
    setUpdateFileName(file.name);
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();

    const idNum = Number(updateId);
    if (!Number.isInteger(idNum) || updateId.trim() === '') {
      setUpdateStatus('error');
      setUpdateMessage('Жарамды ойын ID енгізіңіз.');
      return;
    }

    const payload: UpdateLabGameInput = {};

    if (updateSubjectId.trim() !== '') {
      const n = Number(updateSubjectId);
      if (!Number.isFinite(n)) {
        setUpdateStatus('error');
        setUpdateMessage('subjectId дұрыс емес.');
        return;
      }
      payload.subjectId = n;
    }

    if (updateClassId.trim() !== '') {
      const n = Number(updateClassId);
      if (!Number.isFinite(n)) {
        setUpdateStatus('error');
        setUpdateMessage('classId дұрыс емес.');
        return;
      }
      payload.classId = n;
    }

    if (updateName.trim() !== '') {
      payload.name = updateName.trim();
    }

    if (updateContent.trim() !== '') {
      payload.contentBase64 = updateIsBase64
        ? updateContent.trim()
        : toContentBase64(updateContent);
    }

    if (Object.keys(payload).length === 0) {
      setUpdateStatus('error');
      setUpdateMessage('Кемінде бір өрісті өзгертіңіз.');
      return;
    }

    setUpdateStatus('submitting');
    setUpdateMessage('');
    setUpdated(null);

    try {
      const result = await updateLabGame(idNum, payload);
      setUpdateStatus('success');
      setUpdated(result);
      setUpdateMessage(`#${idNum} ойыны жаңартылды.`);
    } catch (err) {
      setUpdateStatus('error');
      setUpdateMessage(err instanceof Error ? err.message : 'Белгісіз қате орын алды.');
    }
  }

  const submitting = status === 'submitting';
  const deleting = deleteStatus === 'submitting';
  const updating = updateStatus === 'submitting';

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
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={inputStyle}
            >
              {SUBJECTS.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.name} (#{s.subjectId})
                </option>
              ))}
            </select>
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

        <h2 style={sectionTitleStyle}>Ойынды жаңарту</h2>
        <p style={subtitleStyle}>
          <code>PATCH /lab/games/{'{game_id}'}</code> — тек өзгерткіңіз келетін өрістерді толтырыңыз.
        </p>

        <form onSubmit={handleUpdate} style={cardStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Ойын ID (game_id)</span>
            <input
              type="number"
              value={updateId}
              onChange={(e) => setUpdateId(e.target.value)}
              placeholder="123"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Пән (subjectId)</span>
            <select
              value={updateSubjectId}
              onChange={(e) => setUpdateSubjectId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— өзгертпеу —</option>
              {SUBJECTS.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.name} (#{s.subjectId})
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Сынып (classId)</span>
            <input
              type="number"
              value={updateClassId}
              onChange={(e) => setUpdateClassId(e.target.value)}
              placeholder="өзгертпеу үшін бос қалдырыңыз"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Атауы (name)</span>
            <input
              type="text"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              placeholder="өзгертпеу үшін бос қалдырыңыз"
              style={inputStyle}
            />
          </label>

          <div style={fieldStyle}>
            <span style={labelStyle}>HTML файлы</span>
            <input
              ref={updateFileInputRef}
              type="file"
              accept=".html,.htm,text/html"
              onChange={handleUpdateFile}
              style={{ fontSize: '14px' }}
            />
            {updateFileName && <span style={hintStyle}>Жүктелген файл: {updateFileName}</span>}
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>Мазмұн (HTML немесе base64)</span>
            <textarea
              value={updateContent}
              onChange={(e) => {
                setUpdateContent(e.target.value);
                setUpdateFileName('');
              }}
              placeholder="өзгертпеу үшін бос қалдырыңыз"
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#3A3A34' }}>
            <input
              type="checkbox"
              checked={updateIsBase64}
              onChange={(e) => setUpdateIsBase64(e.target.checked)}
            />
            Мазмұн base64 форматында (қайта кодталмайды)
          </label>

          <button type="submit" disabled={updating} style={{ ...buttonStyle, opacity: updating ? 0.6 : 1 }}>
            {updating ? 'Жаңартылуда…' : 'Ойынды жаңарту'}
          </button>

          {updateStatus === 'error' && <div style={errorBoxStyle}>{updateMessage}</div>}
          {updateStatus === 'success' && updated && (
            <div style={successBoxStyle}>
              <strong>{updateMessage}</strong>
              <div style={{ marginTop: '6px', fontSize: '14px' }}>
                ID: <b>{updated.id}</b> · Атауы: {updated.name} · Сынып: {updated.classId}
              </div>
            </div>
          )}
        </form>

        <h2 style={sectionTitleStyle}>Ойынды өшіру</h2>
        <p style={subtitleStyle}>
          <code>POST /lab/games</code> жауабындағы ID арқылы ойынды өшіріңіз.
        </p>

        <form onSubmit={handleDelete} style={cardStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Ойын ID (game_id)</span>
            <input
              type="number"
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              placeholder="123"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={deleting}
            style={{ ...buttonStyle, background: '#B0361F', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? 'Өшірілуде…' : 'Ойынды өшіру'}
          </button>

          {deleteStatus === 'error' && <div style={errorBoxStyle}>{deleteMessage}</div>}
          {deleteStatus === 'success' && <div style={successBoxStyle}>{deleteMessage}</div>}
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

const sectionTitleStyle: CSSProperties = {
  fontFamily: 'Spectral, serif',
  fontWeight: 600,
  fontSize: '24px',
  letterSpacing: '-0.01em',
  margin: '48px 0 8px',
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
