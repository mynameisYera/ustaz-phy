import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { transform } from "esbuild";

const require = createRequire(import.meta.url);

// Read the React/ReactDOM UMD production builds once from node_modules. They are
// inlined as literal <script> text into every generated game, so the sandboxed
// iframe never performs a network fetch at display time.
//
// Note: React 18's package "exports" map does NOT expose the ./umd/* files, so
// require.resolve("react/umd/...") fails. Resolve the package root via its
// package.json (which is exported) and build the UMD path from that directory.
let reactSourceCache: { react: string; reactDom: string } | null = null;

function readUmd(pkg: string, file: string): string {
  const pkgRoot = dirname(require.resolve(`${pkg}/package.json`));
  return readFileSync(join(pkgRoot, "umd", file), "utf-8");
}

function getReactSource(): { react: string; reactDom: string } {
  if (!reactSourceCache) {
    reactSourceCache = {
      react: readUmd("react", "react.production.min.js"),
      reactDom: readUmd("react-dom", "react-dom.production.min.js"),
    };
  }
  return reactSourceCache;
}

const REACT_GAME_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#F7F5EF;min-height:100vh;width:100%;font-family:'Inter',system-ui,sans-serif;color:#1A1A17;font-size:15px;line-height:1.5}
#root{min-height:100vh;width:100%;display:flex;flex-direction:column}
.game-wrap{background:#fff;min-height:100vh;width:100%;flex:1;padding:32px clamp(20px,5vw,64px)}
.content{max-width:900px;margin:0 auto}
h1,h2{font-family:'Spectral',serif;font-weight:500;color:#1A1A17}
h1{font-size:28px;margin:0 0 24px;text-align:center}
button{background:#1E6E5C;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;transition:background .15s}
button:hover{background:#175f4f}
.ustaz-error{max-width:720px;margin:24px auto;padding:20px 24px;background:#FDECEA;border:1px solid #E6E2D8;border-radius:12px;color:#B4533B;font-family:'Inter',system-ui,sans-serif}
`;

/**
 * Transpile a raw JSX "function Game() {...}" component (as authored by the LLM)
 * into plain browser JS via esbuild. Throws an Error whose message is a
 * Kazakh-language, teacher-friendly description if the JSX is invalid.
 */
export async function transpileGameJsx(jsx: string): Promise<string> {
  try {
    const result = await transform(jsx, {
      loader: "jsx",
      jsx: "transform",
      target: "es2017",
    });
    return result.code;
  } catch (e) {
    const detail =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "белгісіз қате";
    throw new Error(`JSX кодында қате бар: ${detail}`);
  }
}

/**
 * Assemble a self-contained index.html from transpiled Game() component JS.
 * React/ReactDOM are inlined; a top-level error handler renders a visible
 * Kazakh error message instead of leaving a blank iframe on runtime failure.
 */
export function assembleReactGameHtml(componentJs: string): string {
  const { react, reactDom } = getReactSource();

  return `<!DOCTYPE html>
<html lang="kk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Интерактивті ойын</title>
<link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>${REACT_GAME_CSS}</style>
</head>
<body>
<div id="root"></div>
<script>${react}</script>
<script>${reactDom}</script>
<script>
window.onerror=function(msg){
  var r=document.getElementById('root');
  if(r){r.innerHTML='<div class="ustaz-error">Ойынды жүктеу кезінде қате шықты: '+msg+'</div>';}
  return false;
};
</script>
<script>
${componentJs}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Game));
</script>
</body>
</html>`;
}
