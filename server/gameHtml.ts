const BASE_GAME_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100vh;
  width: 100%;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: #0f172a;
  background: linear-gradient(160deg, #e0e7ff 0%, #f8fafc 45%, #dbeafe 100%);
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
  width: 100%;
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.92);
  padding: 28px 24px;
  box-sizing: border-box;
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

  if (!/<style/i.test(result)) {
    if (result.includes("</head>")) {
      result = result.replace("</head>", `<style>${BASE_GAME_CSS}</style></head>`);
    } else if (result.includes("<body")) {
      result = result.replace(/<body/i, `<style>${BASE_GAME_CSS}</style>\n<body`);
    } else {
      result = `<style>${BASE_GAME_CSS}</style>\n${result}`;
    }
  } else {
    // Always prepend base CSS — AI game styles that follow will override where needed
    result = result.replace(/<style([^>]*)>/i, `<style$1>${BASE_GAME_CSS}\n`);
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
  if (!/<\/html>/i.test(html)) {
    throw new Error(
      "ЖИ ойын кодын толық аяқтамады (жауап кесілді). Қайта көріңіз."
    );
  }

  // if (!/<script[\s>]/i.test(html) || !/<\/script>/i.test(html)) {
  //   throw new Error("index.html ішінде толық <script> жоқ — ойын интерактивті емес");
  // }

  // const hasClosedStyle = /<style[^>]*>[\s\S]*<\/style>/i.test(html);
  // if (!hasClosedStyle) {
  //   throw new Error("index.html ішінде CSS толық емес — жауап кесілді");
  // }
}
