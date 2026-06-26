const BASE_GAME_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100vh;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: #0f172a;
  background: linear-gradient(160deg, #e0e7ff 0%, #f8fafc 45%, #dbeafe 100%);
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
h1, h2, h3 { margin: 0 0 12px; line-height: 1.25; }
p { margin: 0 0 12px; line-height: 1.5; color: #334155; }
button, .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
button:hover, .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.32);
}
button:active { transform: translateY(0); }
.game-wrap, .container, main, #app, .app {
  width: min(760px, 100%);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
}
[draggable="true"], .draggable, .gene, .item {
  cursor: grab;
  user-select: none;
  touch-action: none;
}
[draggable="true"]:active, .draggable:active { cursor: grabbing; }
`;

function extractStyleContent(html: string): string {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match?.[1]?.trim() ?? "";
}

export function polishGameHtml(html: string): string {
  let result = html.trim();

  if (!/<!DOCTYPE/i.test(result)) {
    result = `<!DOCTYPE html>\n${result}`;
  }

  const styleContent = extractStyleContent(result);
  const needsBase = styleContent.length < 120;

  if (!/<style/i.test(result)) {
    if (result.includes("</head>")) {
      result = result.replace("</head>", `<style>${BASE_GAME_CSS}</style></head>`);
    } else if (result.includes("<body")) {
      result = result.replace(/<body/i, `<style>${BASE_GAME_CSS}</style>\n<body`);
    } else {
      result = `<style>${BASE_GAME_CSS}</style>\n${result}`;
    }
    return wrapBodyIfNeeded(result);
  }

  if (needsBase) {
    result = result.replace(
      /<style([^>]*)>/i,
      `<style$1>${BASE_GAME_CSS}\n`
    );
  }

  return wrapBodyIfNeeded(result);
}

function wrapBodyIfNeeded(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return html;

  const bodyInner = bodyMatch[1];
  if (/class=["'](game-wrap|container|app)["']|<main|<div class=["']game/i.test(bodyInner)) {
    return html;
  }

  const wrapped = bodyInner.trim().startsWith("<div")
    ? bodyInner
    : `<div class="game-wrap">${bodyInner}</div>`;

  return html.replace(bodyMatch[0], bodyMatch[0].replace(bodyInner, `\n${wrapped}\n`));
}

export function validateGameHtml(html: string): void {
  if (!html.includes("<script")) {
    throw new Error("index.html без <script> — игра не интерактивна");
  }
  if (!html.includes("<style") && extractStyleContent(html).length === 0) {
    throw new Error("index.html без CSS");
  }
}
