import { prisma } from "../config/prisma-client";
import { logger } from "../utils";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Tool Execution Result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCP Tool Service
 * Simple implementation of Model Context Protocol tools
 */
class MCPToolService {
  /**
   * Get all available tools
   */
  getAvailableTools(): MCPTool[] {
    return [
      {
        name: "query_users",
        description:
          "Query user data from the database. Returns user information like email, name, and account status.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of users to return (default: 10)",
            },
          },
          required: [],
        },
      },
      {
        name: "read_file",
        description:
          "Read content from a file in the knowledge base directory. Use this to access documentation or text files.",
        parameters: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to read (e.g., 'mindx-info.txt')",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "get_weather",
        description:
          "Get current weather information for a location using external weather API.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description:
                "City name or location (e.g., 'Hanoi', 'Ho Chi Minh')",
            },
          },
          required: ["location"],
        },
      },
    ];
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    logger.info("Executing MCP tool", { toolName, parameters });

    try {
      switch (toolName) {
        case "query_users":
          return await this.queryUsers(parameters as { limit?: number });
        case "read_file":
          return await this.readFile(parameters as { filename: string });
        case "get_weather":
          return await this.getWeather(parameters as { location: string });
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error) {
      logger.error("Tool execution error", {
        toolName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      };
    }
  }

  /**
   * Tool 1: Query users from database
   */
  private async queryUsers(params: { limit?: number }): Promise<ToolResult> {
    try {
      const limit = params.limit || 10;

      logger.info("Querying users from database", { limit });

      const users = await prisma.user.findMany({
        take: Math.min(limit, 50), // Max 50 users
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      logger.info("Users query successful", { count: users.length });

      return {
        success: true,
        data: {
          count: users.length,
          users: users,
        },
      };
    } catch (error) {
      logger.error("Database query failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error:
          error instanceof Error
            ? `Database error: ${error.message}`
            : "Failed to query users from database",
      };
    }
  }

  /**
   * Tool 2: Read file from knowledge base
   */
  private async readFile(params: { filename: string }): Promise<ToolResult> {
    try {
      const { filename } = params;

      // Security: Only allow reading from knowledge-base directory
      const knowledgeBasePath = path.join(process.cwd(), "knowledge-base");
      const filePath = path.join(knowledgeBasePath, filename);

      // Prevent directory traversal attacks
      const resolvedPath = path.resolve(filePath);
      const resolvedBasePath = path.resolve(knowledgeBasePath);
      if (!resolvedPath.startsWith(resolvedBasePath)) {
        return {
          success: false,
          error: "Access denied: File must be in knowledge-base directory",
        };
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          success: false,
          error: `File not found: ${filename}`,
        };
      }

      // Read file content
      const content = await fs.readFile(filePath, "utf-8");

      return {
        success: true,
        data: {
          filename,
          content: content.slice(0, 2000), // Limit to 2000 chars
          size: content.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to read file",
      };
    }
  }

  /**
   * Tool 3: Get weather from external API
   */
  private async getWeather(params: { location: string }): Promise<ToolResult> {
    try {
      const { location } = params;

      // Simple mock weather data (in real app, call weather API)
      // You can replace this with actual API call to OpenWeatherMap, etc.
      const mockWeatherData = {
        Hanoi: {
          temperature: 28,
          condition: "Sunny",
          humidity: 65,
        },
        "Ho Chi Minh": {
          temperature: 32,
          condition: "Partly Cloudy",
          humidity: 75,
        },
      };

      const weatherInfo =
        mockWeatherData[location as keyof typeof mockWeatherData];

      if (!weatherInfo) {
        return {
          success: true,
          data: {
            location,
            message: `Weather data not available for ${location}. Try 'Hanoi' or 'Ho Chi Minh'.`,
          },
        };
      }

      return {
        success: true,
        data: {
          location,
          ...weatherInfo,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to get weather information",
      };
    }
  }
}

// Export singleton instance
export const mcpToolService = new MCPToolService();
