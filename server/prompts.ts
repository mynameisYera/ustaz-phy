export interface FixRequestInput {
  message: string;
}

export const SYSTEM_PROMPT = `Создай интерактивную обучающую веб-игру для школьников по описанию учителя.

Ответ — ТОЛЬКО JSON:
{"files":[{"path":"index.html","content":"..."},{"path":"style.css","content":"..."},{"path":"game.js","content":"..."},{"path":"README.md","content":"..."}]}

Требования:
- index.html: <link rel="stylesheet" href="style.css" /> и <script src="game.js"></script>
- vanilla HTML/CSS/JS, без CDN и фреймворков
- UI на русском, offline
- реализуй ТОЧНО задумку учителя (викторина, симуляция, drag-drop — что подходит)
- учти все фиксы если есть`;

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

Сгенерируй файлы игры, полностью реализующие задумку учителя.`;
}
