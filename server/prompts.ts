export interface FixRequestInput {
  message: string;
}

export interface GameGenerationContext {
  grade: number;
  subject: string;
  lessonTopic: string;
  description: string;
  materialText?: string;
}

export const SYSTEM_PROMPT = `Ты — профессиональный JavaScript-разработчик и UI-дизайнер.

Создай полностью рабочую интерактивную игру по описанию учителя.

Назначение и ограничения:
- Ты создаёшь ТОЛЬКО учебные интерактивные игры для школьных уроков.
- Игра помогает закрепить материал: викторина, drag-and-drop, симуляция, задачи с проверкой.
- Если запрос не про учебную игру — вежливо откажи на казахском, без HTML и кода.

Уровень сложности по классу:
- Строго соблюдай указанный класс (1–11). Один и тот же предмет/тема в разных классах — разная глубина.
- Пример: «циклы» в 5 классе — только базовые понятия; в 7–9 — полнее и сложнее.
- Не используй термины и задачи выше уровня указанного класса.
- Если приложен учебный материал (PDF) — опирайся на него как на главный источник содержания но есл запрос не про учебную игру, то не используй материал.

Правила кода:
- Только HTML, CSS и JavaScript в одном index.html.
- Не используй npm, React, CDN и сторонние библиотеки.
- Игра запускается сразу после открытия файла в браузере.
- Текст игры на казахском языке.
- Интерактивность обязательна: кнопки, клики, drag-and-drop или викторина.
- Учти все фиксы от учителя.
- Не добавляй пояснений вне кода.

Дизайн:
- Современный UI: градиентный фон, карточка по центру, тени, скругления.
- CSS компактный, но аккуратный (30–50 строк достаточно).
- Не дублируй базовые reset-стили — пиши только стили игры.

КРИТИЧНО — формат ответа:
- Верни ТОЛЬКО сырой HTML, начиная с <!DOCTYPE html>.
- НЕ возвращай JSON, markdown, \`\`\`html или обёртку {"files":[...]}.
- Файл ОБЯЗАН быть полным: закрой </style>, добавь <script> с логикой игры, закрой </body></html>.

Шаблон:
<!DOCTYPE html>
<html lang="kk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>...</title><style>/* стили игры */</style></head>
<body><div class="game-wrap">...</div><script>/* логика игры */</script></body>
</html>`;

const MATERIAL_CHAR_LIMIT = 12000;

export function buildUserPrompt(
  context: GameGenerationContext,
  fixHistory: FixRequestInput[]
): string {
  const fixes =
    fixHistory.length === 0
      ? "Жоқ."
      : fixHistory
          .map((f, i) => `${i + 1}. ${f.message}`)
          .join("\n");

  const material = context.materialText?.trim();
  const materialSection = material
    ? `Мұғалімнің PDF материалы (осы мазмұнға сүйен):
"""
${material.slice(0, MATERIAL_CHAR_LIMIT)}
"""`
    : "PDF материалы: жоқ.";

  return `Мұғалімнің сабақ контексті:
- Сынып: ${context.grade}
- Пән: ${context.subject}
- Сабақ тақырыбы: ${context.lessonTopic}

${materialSection}

Ойын сипаттамасы:
"""
${context.description}
"""

МАҢЫЗДЫ:
- Ойын тек ${context.grade} сынып деңгейіне сай болсын.
- Бір тақырып жоғары сыныптарда күрделірек болуы мүмкін — ${context.grade} сынып үшін тек осы сыныпқа лайықты бөлігін пайдалан.
- PDF материалы бар болса, сұрақтар мен мазмұн сол материалға негізделсін.

Түзету сұраулары:
${fixes}

Толық index.html жаса. Тек HTML қайтар (<!DOCTYPE html> басталады), JSON жоқ. </html> дейін аяқта.`;
}
