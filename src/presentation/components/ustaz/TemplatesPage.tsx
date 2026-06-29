import { useState } from 'react';
import { UstazHeader } from './UstazHeader';
import { IconQuizSmall } from './icons';

interface TemplatesPageProps {
  onBack: () => void;
  onOpen: (title: string) => void;
}

const ALL_TEMPLATES = [
  { title: 'Викторина: сравнение дробей', meta: '5 класс · Математика', type: 'quiz', tint: '#EAF1ED' },
  { title: 'Карточки: столицы мира', meta: '7 класс · География', type: 'cards', tint: '#F1ECE2' },
  { title: 'Кроссворд: литературные термины', meta: '9 класс · Литература', type: 'cross', tint: '#EDEAF1' },
  { title: 'Сортировка: царства природы', meta: '6 класс · Биология', type: 'sort', tint: '#EAEFF1' },
  { title: 'Симулятор: электрические цепи', meta: '8 класс · Физика', type: 'sim', tint: '#F1ECE2' },
  { title: 'Викторина: части речи', meta: '6 класс · Казахский язык', type: 'quiz', tint: '#EDEAF1' },
  { title: 'Карточки: неправильные глаголы', meta: '7 класс · Английский язык', type: 'cards', tint: '#EAF1ED' },
  { title: 'Кроссворд: химические элементы', meta: '8 класс · Химия', type: 'cross', tint: '#EAEFF1' },
];

export function TemplatesPage({ onBack, onOpen }: TemplatesPageProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_TEMPLATES.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.meta.toLowerCase().includes(search.toLowerCase()))
    : ALL_TEMPLATES;

  const isEmpty = filtered.length === 0;

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      <UstazHeader onLogoClick={onBack} />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '34px', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
          Библиотека шаблонов
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 28px' }}>
          Готовые игры — откройте и используйте как основу для своего урока.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['Предмет', 'Класс', 'Тип игры'].map((label) => (
              <button key={label} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>
                {label}
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5 6 7.5 9 4.5"/></svg>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', width: '240px' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#A6A498" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="m11 11 3 3" strokeLinecap="round"/></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск шаблонов…"
              style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', color: '#1A1A17', background: 'transparent', width: '100%' }}
            />
          </div>
        </div>

        {/* Grid */}
        {!isEmpty && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {filtered.map((t) => (
              <button key={t.title} type="button" className="u365-gallery-card" onClick={() => onOpen(t.title)} style={{ textAlign: 'left' }}>
                <div style={{ height: '120px', background: t.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #EEEAE0' }}>
                  <IconQuizSmall type={t.type} />
                </div>
                <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '14px', lineHeight: '1.4', color: '#1A1A17' }}>{t.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span style={{ fontSize: '12px', color: '#6F6E66' }}>{t.meta}</span>
                    <span style={{ fontSize: '13px', color: '#1E6E5C' }}>Открыть →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '14px', padding: '90px 20px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C3BFB2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5"/>
              <path d="m20 20-4.7-4.7"/>
            </svg>
            <h3 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '22px', margin: 0 }}>Шаблоны не найдены</h3>
            <p style={{ fontSize: '14px', color: '#6F6E66', maxWidth: '340px', margin: 0, lineHeight: '1.55' }}>
              Попробуйте изменить запрос или снять часть фильтров, чтобы увидеть больше шаблонов.
            </p>
            <button type="button" onClick={() => setSearch('')} style={{ marginTop: '4px', height: '36px', padding: '0 18px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
