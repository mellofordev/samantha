'use server'
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";
import { z } from "zod";

export async function functionRouter(user_input: string,type:"user_input" | "tool_response") {
  let messages:CoreMessage[] = [];
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    system:`You are an assistant that checks the user's task and decides which tool to use based on the user's task.
    
    Available tools:
    - web_search: Use this tool to perform web searches and retrieve information.
    - operator: A browser automation tool that enables complex web tasks. It works step by step, with each step reported back as a tool response. Use this for tasks like filling forms, navigating websites, or completing online transactions.
    - operator_completed: Used to indicate when an operator task has been fully completed.
    - add_folder: Use this tool to create folders for organizing and saving search results and URLs.`,
    messages:[{
      role:"user",
      content:[{
        type:"text",
        text:`${type === "user_input" ? `<user_input>${user_input}</user_input>` : `<tool_response>${user_input}</tool_response>`}`
      }]
    }],
    tools: {
      web_search: {
        parameters: z.object({
          web_search: z
            .string()
            .describe("The search query to perform a web search"),
        }),
      },
      operator: {
        parameters: z.object({
          user_task: z.string().describe("The task that the user wants to perform"),
          agent_progress: z.string().describe("The progress of the agent in the task"),
          next_step: z.string().describe("The next step of the agent in the task, if the previous step failed or not successful then the next step should be the same step again, each step or task completion is sent back to the model in toolResponse form"),
        }),
      },
      operator_completed: {
        parameters: z.object({
          is_task_finished: z.boolean().describe("Whether the entire user task is finished"),
        }),
      },
      add_folder: {
        parameters: z.object({
          folder_name: z.string().describe("Name of the folder to create"),
          file_content: z
            .array(
              z.object({
                title: z.string().describe("The title of the content"),
                url: z.string().describe("The url of the content"),
                content: z.string().describe("The content of the content"),
              })
            )
            .describe("The content of the folder"),
          description: z
            .string()
            .describe("Brief description of what this folder contains"),
        }),
      },
    },
    toolChoice: "required",
  });
  return response;
}
