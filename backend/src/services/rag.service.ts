import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "@/config";
import { logger } from "@/utils/logger";

/**
 * Simple RAG Service using in-memory vector store
 * Keep it simple - no external database needed!
 */
class RAGService {
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private isInitialized = false;

  constructor() {
    // Initialize Google Gemini embeddings
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.GOOGLE_AI_API_KEY,
      modelName: "text-embedding-004", // Gemini embedding model
    });
  }

  /**
   * Initialize the vector store with knowledge base
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info("RAG service already initialized");
      return;
    }

    try {
      logger.info("Initializing RAG service...");

      // Load knowledge base document
      const knowledgeBasePath = join(
        process.cwd(),
        "knowledge-base",
        "mindx-info.txt"
      );
      const content = readFileSync(knowledgeBasePath, "utf-8");

      // Split into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500, // Keep chunks small for better relevance
        chunkOverlap: 50,
      });

      const chunks = await textSplitter.splitText(content);

      // Create documents
      const documents = chunks.map(
        (chunk, i) =>
          new Document({
            pageContent: chunk,
            metadata: { source: "mindx-info.txt", chunkIndex: i },
          })
      );

      logger.info(`Created ${documents.length} document chunks`);

      // Create in-memory vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );

      this.isInitialized = true;
      logger.info("RAG service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize RAG service", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      throw error;
    }
  }

  /**
   * Search for relevant knowledge based on query
   */
  async searchKnowledge(query: string, topK: number = 3): Promise<string[]> {
    if (!this.isInitialized || !this.vectorStore) {
      // Auto-initialize if not done yet
      await this.initialize();
    }

    try {
      // Search for relevant documents
      const results = await this.vectorStore!.similaritySearch(query, topK);

      // Extract content from results
      const relevantContent = results.map((doc) => doc.pageContent);

      logger.info("Knowledge search completed", {
        query: query.substring(0, 50),
        resultsFound: results.length,
      });

      return relevantContent;
    } catch (error) {
      logger.error("Knowledge search failed", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      return []; // Return empty array on error, don't break chat
    }
  }

  /**
   * Get knowledge context for AI chat
   */
  async getContextForChat(userMessage: string): Promise<string> {
    const relevantChunks = await this.searchKnowledge(userMessage, 3);

    if (relevantChunks.length === 0) {
      return "";
    }

    // Format as context for AI
    const context = `
Relevant knowledge from MindX knowledge base:

${relevantChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n")}

Use the above information to answer the user's question accurately. If the information is not relevant, you can answer based on your general knowledge.
`.trim();

    return context;
  }
}

// Export singleton instance
const ragServiceInstance = new RAGService();
export { ragServiceInstance as ragService };
