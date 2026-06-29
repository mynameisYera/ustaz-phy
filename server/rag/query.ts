export {
  answerFromBooks as querySchoolBooks,
  getVectorStoreIdForRag,
  searchBookChunks,
  fetchBookContextForTopic,
  getIndexingDiagnostics,
  getFileChunkSample,
} from "./search.js";

export type { BookSearchHit } from "./search.js";
