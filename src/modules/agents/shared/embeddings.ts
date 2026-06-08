import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. AI agent features are unavailable.");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

/**
 * Embeds a batch of text chunks in a single request. Powers the retrieval
 * step of the Hiring Agent's RAG pipeline — resume sections and job
 * requirement statements are embedded into the same vector space so they
 * can be compared by cosine similarity.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(t => t.slice(0, 8000)),
  });
  return response.data.map(d => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RetrievedMatch {
  sourceIndex: number;
  similarity: number;
}

/**
 * For each query embedding, ranks every candidate embedding by cosine
 * similarity and returns the top-K above a minimum relevance threshold.
 * This is the "retrieval" half of retrieval-augmented generation: it
 * grounds the Hiring Agent's verdict in the specific resume excerpts that
 * actually support (or fail to support) each job requirement, rather than
 * letting the model free-associate over the raw resume text.
 */
export function retrieveTopMatches(
  queryEmbedding: number[],
  candidateEmbeddings: number[][],
  options: { topK?: number; minSimilarity?: number } = {}
): RetrievedMatch[] {
  const topK = options.topK ?? 2;
  const minSimilarity = options.minSimilarity ?? 0.2;

  return candidateEmbeddings
    .map((embedding, sourceIndex) => ({ sourceIndex, similarity: cosineSimilarity(queryEmbedding, embedding) }))
    .filter(match => match.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
