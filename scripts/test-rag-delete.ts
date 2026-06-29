import "../server/env.js";
import { getOpenAiClient } from "../server/openaiClient.js";
import { loadRagConfig } from "../server/rag/config.js";

async function main() {
  const config = loadRagConfig();
  if (!config) throw new Error("no config");
  const client = getOpenAiClient();
  const id = "file-5dHpAsUVXy5r1HMunXGbKf";

  try {
    await client.files.retrieve(id);
    console.log("underlying file: exists");
  } catch (e) {
    console.log("underlying file: gone", e instanceof Error ? e.message : e);
  }

  try {
    const vsFile = await client.vectorStores.files.retrieve(config.vectorStoreId, id);
    console.log("vs file status:", vsFile.status);
  } catch (e) {
    console.log("vs file: gone", e instanceof Error ? e.message : e);
  }

  const page = await client.vectorStores.search(config.vectorStoreId, {
    query: "Закон Ома",
    max_num_results: 5,
  });
  console.log(
    "search hits:",
    page.data.map((h) => ({ file: h.filename, score: h.score }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
