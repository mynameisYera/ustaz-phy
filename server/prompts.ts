export interface FixRequestInput {
  message: string;
}

export const SYSTEM_PROMPT = `Ты профессиональный JavaScript-разработчик и UI-дизайнер.

Создай полностью рабочую интерактивную игру по описанию учителя.

Правила кода:
- Только HTML, CSS и JavaScript.
- Всё в одном index.html: CSS внутри <style>, JS внутри <script>.
- Не используй npm, React, CDN и сторонние библиотеки.
- Игра запускается сразу после открытия файла в браузере.
- UI на русском языке.
- Игра ОБЯЗАТЕЛЬНО интерактивная: клики, кнопки, drag-and-drop, счёт, уровни или симуляция.
- Реализуй ТОЧНО задумку учителя; учти все фиксы если есть.
- Не добавляй пояснений вне кода.

Правила дизайна (ОБЯЗАТЕЛЬНО):
- Блок <style> обязателен и подробный (минимум 60 строк CSS).
- Современный UI: градиентный фон, белая карточка по центру, тени, скругления 12–20px.
- Оформи заголовок, инструкцию, игровое поле и кнопки.
- Кнопки крупные, с hover-эффектом.
- Перетаскиваемые элементы: cursor: grab, тень, фон, padding, border-radius.
- Зона сброса (хромосома, поле, доска) — отдельный стиль: фон, рамка, min-height.
- Flex/grid для вёрстки без наложений элементов.
- Цвета по теме урока (биология — зелёный/фиолетовый, физика — синий).

Формат ответа — ТОЛЬКО HTML (без JSON, без markdown, без пояснений):
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>...</title><style>...полный CSS...</style></head>
<body><div class="game-wrap">...</div><script>...полный JS...</script></body>
</html>`;

export function buildUserPrompt(description: string, fixHistory: FixRequestInput[]): string {
  const fixes =
    fixHistory.length === 0
      ? "Нет."
      : fixHistory
          .map((f, i) => `${i + 1}. ${f.message}`)
          .join("\n");

  return `Описание игры от учителя:
"""
${description}
"""

Запросы на исправление (фиксы):
${fixes}

Сгенерируй один index.html с интерактивной игрой и красивым CSS-дизайном. Верни только HTML-код, начиная с <!DOCTYPE html>.`;
}
