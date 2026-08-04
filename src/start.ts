import { createStart, createMiddleware } from "@tanstack/react-router";

// No side effects, no custom middleware for now to achieve maximum stability
export const startInstance = createStart(() => ({
  // Minimal configuration
}));
