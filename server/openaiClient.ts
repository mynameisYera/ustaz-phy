import { getEnv } from "./env.js";
import OpenAI from "openai";
import { getOpenAiApiKey, isOpenAiKeyFormatValid } from "./openai.js";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY көрсетілмеген");
  }
  if (!isOpenAiKeyFormatValid(apiKey)) {
    throw new Error("OPENAI_API_KEY форматы дұрыс емес");
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: getEnv("OPENAI_BASE_URL"),
    });
  }

  return client;
}
