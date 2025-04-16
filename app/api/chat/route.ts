import { prompt } from '@/lib/prompt_helpers/prompt';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';        

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages,username,context } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-exp'),
    system: prompt(username,context),
    messages,
    toolCallStreaming: true,
    tools: {
      webSearch: {
        description: "Search the web for current information",
        parameters: z.object({
          query: z.string().describe("The search query to look up on the web")
        })
      }
    },
  });

  return result.toDataStreamResponse();
}