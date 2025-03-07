'use server'

import { createGroq } from "@ai-sdk/groq";
import { generateObject, LanguageModelV1 } from "ai";
import { z } from "zod";
import { getSearchHistory, getUserLocation, saveUserPreference } from "./backend";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function generateUserPreference(location: string) {
  try {
    const searchHistory = await getSearchHistory() || []
    
    // Format search history safely
    const searchHistoryText = searchHistory.length > 0 
      ? searchHistory.map(h => h.query || "").filter(Boolean).join(", ")
      : "No previous searches";
    
    const context = await generateObject({
      model: groq("llama-3.1-8b-instant") as LanguageModelV1,
      prompt: `This is the location of the user: ${location || "Unknown"}. 
Previous search history: ${searchHistoryText}.`,
      system: `You are an AI agent that helps manage user preferences and search history. Generate a brief context about the user based on their location and search history.`,
      schema: z.object({
        preferences: z.string().describe("A brief context about the user based on their location and search history")
      }),
      temperature: 0.3, // Lower temperature for more predictable output
      maxTokens: 200
    });
    
    if (context?.object?.preferences) {
      await saveUserPreference(context.object.preferences);
      return context.object.preferences;
    }
    return "";
  } catch (error) {
    console.error("Error generating user preference:", error);
    return "";
  }
}

export async function modifySearchPrompt(prompt: string) {
  try {
    // Get user preferences and location
    const preferences = await generateUserPreference(prompt) || "";
    const userLocation = await getUserLocation() || { location: "Unknown" };
    const location = typeof userLocation === 'object' && userLocation.location ? userLocation.location : "Unknown";
    
    // If prompt is empty or too short, return it as is
    if (!prompt || prompt.length < 3) return prompt;
    
    const context = await generateObject({
      model: groq("llama-3.1-8b-instant") as LanguageModelV1,
      prompt: `Original search: "${prompt}"`,
      system: `You are an AI assistant that enhances search queries.
User preferences: ${preferences}
User location: ${location}

Your task is to modify the original search query to make it more specific and relevant.
If the search is location-related, include the user's location.
Keep the modified search concise and focused.
ONLY return the modified search query with no additional text or explanation.`,
      schema: z.object({
        searchPrompt: z.string().describe("The enhanced search query")
      }),
      temperature: 0.2, // Lower temperature for more predictable output
      maxTokens: 100
    });
    
    return context?.object?.searchPrompt || prompt;
  } catch (error) {
    console.error("Error modifying search prompt:", error);
    return prompt; // Return original prompt if there's an error
  }
}

