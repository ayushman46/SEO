import { buildLlmsTxt } from "@/lib/seo/llms";

// Static: no request-time data, so it is prerendered at build time (Cache Components model).
export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
