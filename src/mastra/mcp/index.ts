import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest", "--headless"],
    },
  },
});