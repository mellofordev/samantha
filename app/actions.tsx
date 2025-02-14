"use server";
import { streamUI } from "ai/rsc";
import { CoreMessage, generateObject, generateText } from "ai";
import { createGoogleGenerativeAI} from "@ai-sdk/google";
import {z } from "zod";
import { JSDOM } from 'jsdom';

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

declare const chrome: any; // Quick fix
const perform_agent = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AGENT_API_KEY,
})
// Function to fetch video from YouTube API
async function fetchYouTubeVideo(query: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&type=video&maxResults=3`
  );
  const data = await response.json();
  const videos =
    data.items?.map((video: any) => ({
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.high.url,
      videoId: video.id.videoId,
    })) || [];
  return videos;
}
export async function getSearchResults(query: string) {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_TAVILY_API_KEY,
        query: query,
        include_images: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
    return {
      query: data.query,
      results: data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      })) as SearchResult[],
      images: data.images || [],
      responseTime: data.response_time,
    };
  } catch (error) {
    console.error("Error fetching search results:", error);
    throw error;
  }
}

// Helper functions for DOM cleaning
function removeScriptAndStyleTags(dom: string): string {
  return dom
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

function removeCommonAdsAndTracking(dom: string): string {
  const patternsToRemove = [
    /<div[^>]*(?:advertisement|analytics|gtm-|pixel-)[^>]*>.*?<\/div>/gi,
    /<iframe[^>]*(?:advertisement|tracking)[^>]*>.*?<\/iframe>/gi
  ];
  
  return patternsToRemove.reduce((result, pattern) => 
    result.replace(pattern, ''), dom);
}

function extractInteractiveElements(dom: string): string {
  const { window } = new JSDOM(dom);
  const doc = window.document;
  
  // Split into separate queries to avoid invalid selector syntax
  const selectorGroups = [
    // Basic interactive elements
    'a[href], button, input, form, select, textarea',
    
    // Elements with IDs and classes
    '[id], [class]',
    
    // ARIA elements
    '[role], [aria-label]',
    
    // React testing elements
    '[data-testid], [data-test], [data-cy]',
    
    // Structure elements
    'nav, header, main, footer, section',
    
    // Common containers
    '#root, #app',
    
    // Class patterns
    '[class*=container], [class*=wrapper]'
  ];

  const allElements = selectorGroups
    .flatMap(selector => Array.from(doc.querySelectorAll(selector)))
    .map(el => el.outerHTML)
    .join('\n');

  return allElements;
}

export async function extractUsefulDomElements(dom: string) {
  // First pass: Basic cleanup while preserving React structure
  let cleanedDom = dom;
  cleanedDom = removeScriptAndStyleTags(cleanedDom);
  cleanedDom = removeCommonAdsAndTracking(cleanedDom);
  
  // Extract important elements while keeping React structure
  const interactiveElements = extractInteractiveElements(cleanedDom);
  console.log(interactiveElements)
  // Second pass: Use AI to refine while preserving React functionality
  const response = await generateText({
    model: perform_agent('gemini-2.0-flash'),
    system: `
    You are an expert in React and DOM analysis. Your task is to analyze the pre-cleaned DOM and:
    1. Preserve all React-specific attributes and structures
    2. Maintain component hierarchy and event handlers
    3. Keep data-* attributes and React testing selectors
    4. Remove only clearly non-essential elements
    5. Preserve state management related attributes
    6. Keep class names used for styling and component identification
    `,
    prompt: `
    <pre_cleaned_dom>${interactiveElements}</pre_cleaned_dom>
    <objective>Refine the DOM while maintaining React application functionality</objective>
    `
  });

  return response.text;
}

export async function agent(user_task: string, screenshot?: string, dom?: string) {
  let messages: CoreMessage[] = [];
  let cleanedDom: string | undefined;

  // Clean DOM if provided
  if (dom) {
    cleanedDom = await extractUsefulDomElements(dom);
  }

  // Add initial user task
  messages.push({
    role: 'user',
    content: [{
      type: 'text',
      text:  `<task>${user_task}</task>`
    }],
  });

  if (screenshot) {
    messages.push({
      role: 'user', 
      content: [{
        type: 'image',
        image: screenshot
      }],
    });
  }
  
  if (cleanedDom) {
    messages.push({
      role: 'user',
      content: [{
        type: 'text',
        text: cleanedDom
      }],
    });
  }

  const response = await generateObject({
    messages: messages,
    model: perform_agent("gemini-2.0-flash"),
    schemaName: "browser_automation",
    system: `
    You are an expert browser automation agent. Your role is to break down user tasks into sequential browser operations and generate precise JavaScript code for each step.

    Task Execution Flow:
    1. Every automation sequence MUST start with GO_TO_URL to establish the working tab
    2. Analyze the target website's DOM structure when available
    3. Break complex user tasks into atomic operations
    4. Generate precise JavaScript code for each operation

    Available Operations (task_enum):
    - GO_TO_URL: Opens a new tab with specified URL (Required first step)
    - EXTRACT: Extracts data, text, or elements from the page
    - CLICK: Clicks on any interactive element (buttons, links, dropdowns)
    - TYPE: Enters text into input fields
    - SCROLL: Controls page scrolling (up, down, to element)
    - WAIT: Waits for elements or content to load
    - ACT: Performs complex actions (drag-drop, hover, file upload)

    Your JavaScript code must:
    - Use robust selectors (ID, class, XPath, or CSS combinations)
    - Include error handling and retries
    - Handle dynamic content loading
    - Scroll elements into view before interaction
    - Return operation success/failure status

    Return format must include:
    - Current step's task_enum
    - Clear description of current action
    - Progress status
    - Context details (URL, search terms, etc.)
    - Executable JavaScript code for the current step
    `,
    schema: z.object({
      task_enum: z.enum(["GO_TO_URL", "EXTRACT", "CLICK", "TYPE", "SCROLL", "WAIT", "ACT"]),
      current_step: z.string().describe("Description of the current atomic operation being performed"),
      is_full_user_task_finished: z.boolean().describe("Indicates whether the complete user task has been accomplished"),
      next_step: z.string().describe("Description of the next atomic operation to be performed , if the previous step failed or not successful then the next step should be the same step again"),
      context: z.object({
        url: z.string().describe("Full HTTPS URL for GO_TO_URL steps, or current page URL for context"),
        searchTerms: z.string().describe("Search terms or input data needed for the current step"),
      }),
      selector: z.string().describe("The selector for the current step that handles the specified task_enum operation, this selector should be a valid selector for the current step and should be from the dom of the website. Output only one selector for the current step. this selector will be used to click on the element or input the text or scroll to the element or wait for the element to load or perform any other action."),
      extract_selectors: z.array(z.string()).describe("These are the selectors that will be used to extract the data from the page, this is an array of selectors"),
    }),
  });

  return response.object;
}
export async function generateUI(prompt: string) {
  const result = await streamUI({
    model: perform_agent("gemini-2.0-flash"),
    prompt: `<query_analysis>
  <user_input>${prompt}</user_input>
  <objective>Process query for knowledge graph generation</objective>
</query_analysis>`,

    system: `
<assistant_role>
You are an AI assistant specialized in providing informational responses through knowledge graphs.
</assistant_role>

<primary_functions>
1. Knowledge Graph Queries:
   - Handle informational and educational queries
   - Provide facts and explanations about topics
   - Show relationships between concepts
   - Display multimedia content and search results

2. Query Analysis:
   - Process query to extract key concepts and relationships
   - Identify relevant facts and information to include
   - Structure information in an educational and engaging way
</primary_functions>

<response_instruction>
For information queries like "tell me about Einstein" or "latest news on AI", generate a comprehensive knowledge graph with relevant facts, relationships and multimedia content.
</response_instruction>`,

    text: ({ content }) => <p>{content}</p>,
    maxRetries: 3,
    tools: {
      generateKnowledgeGraph: {
        description:
          "Creates a rich, interactive knowledge visualization with multimedia elements and structured information about the search query.",
        parameters: z.object({
          title: z.string().describe("The main search query or topic title"),
          description: z
            .string()
            .describe(
              "A comprehensive overview of the topic with key points and context (2-3 sentences)"
            ),
          relatedTopics: z
            .array(
              z.object({
                title: z
                  .string()
                  .describe("Name of the related concept or subtopic"),
                description: z
                  .string()
                  .describe(
                    "Explanation of how this topic connects to the main subject and its significance"
                  ),
              })
            )
            .describe(
              "Connected concepts and subtopics that provide broader context"
            ),
          facts: z
            .array(
              z.object({
                title: z.string().describe("Concise fact title or category"),
                content: z
                  .string()
                  .describe(
                    "Detailed explanation of the fact with supporting information"
                  ),
              })
            )
            .describe(
              "Key facts, statistics, and important details about the topic"
            ),
        }),
        generate: async function* (data) {
          yield (
            <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url('/cloud_bg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("/noise.png")`,
              }}
            />
            <div className="text-center relative z-10 mb-12">
              <h1 className={`text-4xl font-instrument-serif mb-2 text-gray-800`}>
                Generating UI
              </h1>
            </div>
          </div>
          );
          const searchResults = await getSearchResults(data.title);
          const videoResult = await fetchYouTubeVideo(data.title);
          try {
            const knowledgeGraphData = {
              title: data.title,
              description: data.description,
              imageUrl: searchResults.images[0] || "/placeholder.svg",
              relatedTopics: data.relatedTopics.map((topic, index) => ({
                ...topic,
                imageUrl: searchResults.images[index + 1] || "/placeholder.svg",
              })),
              videoResult: videoResult,
              imageGallery: searchResults.images || ["/placeholder.svg"],
              facts: data.facts,
            };

            return <div></div>;
          } catch (error) {
            console.error("Error generating knowledge graph:", error);
            throw error;
          }
        },
      },
    },
  });
  return result.value;
}
export async function generateKnowledgeGraph(prompt: string) {
    const searchResults = await getSearchResults(prompt);
    const response = await generateObject({
      model: perform_agent("gemini-2.0-flash"),
      prompt: `<query_analysis>
      <user_input>${prompt}</user_input>
      <objective>Process query for knowledge graph generation</objective>
    </query_analysis>
      <search_results>
        ${searchResults.results.map((result) => `<title>${result.title}</title> <content>${result.content}</content>`).join(", ")}
      </search_results>
    `,

      system: `
      <assistant_role>
      You are an AI assistant specialized in providing informational responses through knowledge graphs.
      </assistant_role>

      <primary_functions>
      1. Knowledge Graph Queries:
        - Handle informational and educational queries
        - Provide facts and explanations about topics
        - Show relationships between concepts
        - Display multimedia content and search results

      2. Query Analysis:
        - Process query to extract key concepts and relationships
        - Identify relevant facts and information to include
        - Structure information in an educational and engaging way
      </primary_functions>

      <response_instruction>
      For information queries like "tell me about Einstein" or "latest news on AI", generate a comprehensive knowledge graph with relevant facts, relationships and multimedia content.
      </response_instruction>`,

      maxRetries: 3,
      schemaName: "knowledge_graph",
      schema: z.object({
        title: z.string().describe("The main search query or topic title"),
        description: z
          .string()
          .describe(
            "A comprehensive overview of the topic with key points and context (2-3 sentences)"
          ),
        relatedTopics: z
          .array(
            z.object({
              title: z
                .string()
                .describe("Name of the related concept or subtopic"),
              description: z
                .string()
                .describe(
                  "Explanation of how this topic connects to the main subject and its significance"
                ),
            })
          )
          .describe(
            "Connected concepts and subtopics that provide broader context"
          ),
        quick_insights: z
          .array(
            z.object({
              title: z.string().describe("Insights title"),
              emoji: z.string().describe("An emoji that represents the fact"),
              content: z
                .string()
                .describe(
                  "Detailed explanation of the insights with supporting information"
                ),
            })
          )
          .describe(
            "Key insights, statistics, and important details about the topic"
          ),
        })
    });
    const videoResult = await fetchYouTubeVideo(response.object.title);
    try {
      const knowledgeGraphData = {
        title: response.object.title,
        description: response.object.description,
        imageUrl: searchResults.images[0] || "/placeholder.svg",
        relatedTopics: response.object.relatedTopics.map((topic, index) => ({
          ...topic,
          imageUrl: searchResults.images[index + 1] || "/placeholder.svg",
        })),
        videoResult: videoResult,
        imageGallery: searchResults.images || ["/placeholder.svg"],
        quick_insights: response.object.quick_insights,
        search_results: searchResults.results,
      };

      return knowledgeGraphData;
    } catch (error) {
      console.error("Error generating knowledge graph:", error);
      
      return {
        title: "",
        description: "",
        imageUrl: "",
        relatedTopics: [],
        videoResult: [],
      }
    }
    
}
