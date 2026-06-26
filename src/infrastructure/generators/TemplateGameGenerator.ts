import type { FixRequest, GameFile } from "@/domain/entities/Game";
import type { GenerateGameInput, GameGenerator } from "@/domain/ports/GameGenerator";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildQuestions(description: string, fixes: FixRequest[]) {
  const topic = description.slice(0, 80);
  const fixHint = fixes.length > 0 ? fixes[fixes.length - 1].message : "";

  const base = [
    {
      q: `«${topic}» тақырыбында не үйренеміз?`,
      options: ["Негізгі заңдар мен құбылыстар", "Әдебиет тарихы", "Қазақстан географиясы"],
      answer: 0,
    },
    {
      q: "Күш қандай SI бірлігімен өлшенеді?",
      options: ["Ньютон (Н)", "Джоуль (Дж)", "Ватт (Вт)"],
      answer: 0,
    },
    {
      q: "Бірқалыпты қозғалыстағы жылдамдық формуласы:",
      options: ["v = s / t", "F = m · a", "E = m · c²"],
      answer: 0,
    },
  ];

  if (fixHint) {
    base.push({
      q: `Мұғалімнің нақтылауы: «${fixHint.slice(0, 120)}». Негізгі ескеру не?`,
      options: ["Тапсырмадағы нақтылауды орындау", "Кеңесті елемеу", "Кездейсоқ жауап беру"],
      answer: 0,
    });
  }

  return base;
}

function buildIndexHtml(description: string, fixes: FixRequest[]): string {
  const questions = buildQuestions(description, fixes);
  const title = escapeHtml(description.slice(0, 60) || "Физика — интерактив");
  const fixNotes = fixes
    .map((f, i) => `<li>v${i + 2}: ${escapeHtml(f.message)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="game">
    <header>
      <h1>${title}</h1>
      <p class="subtitle">Оқушыларға арналған интерактивті ойын</p>
      <p class="score">Есеп: <span id="score">0</span> / <span id="total">${questions.length}</span></p>
    </header>
    <section id="quiz"></section>
    <footer>
      <button id="restart" type="button" hidden>Қайта ойнау</button>
      ${fixNotes ? `<details class="fixes"><summary>Түзету тарихы (${fixes.length})</summary><ul>${fixNotes}</ul></details>` : ""}
    </footer>
  </main>
  <script>
    const QUESTIONS = ${JSON.stringify(questions)};
  </script>
  <script src="game.js"></script>
</body>
</html>`;
}

const STYLE_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a, #1e3a5f);
  color: #f8fafc;
  min-height: 100vh;
}
.game {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}
h1 { font-size: 1.5rem; margin: 0 0 8px; }
.subtitle { opacity: 0.8; margin: 0 0 16px; }
.score { font-weight: 600; }
.card {
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.card h2 { font-size: 1.1rem; margin: 0 0 16px; }
.options { display: flex; flex-direction: column; gap: 8px; }
button.option {
  padding: 12px 16px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  color: inherit;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
}
button.option:hover { background: rgba(255,255,255,0.14); }
button.option.correct { background: #166534; border-color: #22c55e; }
button.option.wrong { background: #7f1d1d; border-color: #ef4444; }
button.option:disabled { cursor: default; opacity: 0.9; }
#restart {
  margin-top: 16px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}
.fixes { margin-top: 24px; font-size: 0.9rem; opacity: 0.85; }
`;

const GAME_JS = `let current = 0;
let score = 0;

const quizEl = document.getElementById("quiz");
const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restart");

function renderQuestion() {
  if (current >= QUESTIONS.length) {
    quizEl.innerHTML = '<div class="card"><h2>Дайын! Нәтиже: ' + score + ' / ' + QUESTIONS.length + '</h2></div>';
    restartBtn.hidden = false;
    return;
  }

  const item = QUESTIONS[current];
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = '<h2>Сұрақ ' + (current + 1) + '</h2><div class="options"></div>';
  const optionsEl = card.querySelector(".options");

  item.options.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = text;
    btn.addEventListener("click", () => selectAnswer(index, btn, item.answer));
    optionsEl.appendChild(btn);
  });

  quizEl.innerHTML = "";
  quizEl.appendChild(card);
}

function selectAnswer(chosen, btn, correct) {
  const buttons = btn.parentElement.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  if (chosen === correct) {
    btn.classList.add("correct");
    score++;
    scoreEl.textContent = score;
  } else {
    btn.classList.add("wrong");
    buttons[correct].classList.add("correct");
  }

  setTimeout(() => {
    current++;
    renderQuestion();
  }, 900);
}

restartBtn.addEventListener("click", () => {
  current = 0;
  score = 0;
  scoreEl.textContent = "0";
  restartBtn.hidden = true;
  renderQuestion();
});

renderQuestion();
`;

function buildReadme(description: string): string {
  return `# Интерактивті ойын

Тақырып: ${description}

## Локальды іске қосу

1. Архивті ашыңыз
2. \`index.html\` файлын браузерде ашыңыз (қос шерту немесе Live Server)

Файлдар:
- \`index.html\` — ойын беті
- \`style.css\` — стильдер
- \`game.js\` — викторина логикасы
`;
}

// Заглушка генератора. Позже заменить на LLM/API без изменения domain.
export class TemplateGameGenerator implements GameGenerator {
  async generate(input: GenerateGameInput): Promise<GameFile[]> {
    await new Promise((r) => setTimeout(r, 36000));

    return [
      { path: "index.html", content: buildIndexHtml(input.description, input.fixHistory) },
      { path: "style.css", content: STYLE_CSS },
      { path: "game.js", content: GAME_JS },
      { path: "README.md", content: buildReadme(input.description) },
    ];
  }
}
