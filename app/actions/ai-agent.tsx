"use server";
import { streamUI } from "ai/rsc";
import { CoreMessage, generateObject, generateText, LanguageModelV1 } from "ai";
import { createGoogleGenerativeAI} from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
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
const perform_extractor = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_EXTRACTOR_API_KEY,
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
const generateChunks = (html: string, maxChunkElements: number = 4): string[] => {
  const chunks: string[] = [];
  
  // Parse the input HTML string
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Get root level elements to preserve DOM structure
  const rootElements = Array.from(document.body.children);
  
  let currentChunk: Element[] = [];
  let currentChunkText = '';
  const maxChunkLength = 4096; // Context window size
  
  const processElement = (element: Element) => {
    const elementHtml = element.outerHTML;
    
    // Check if adding this element would exceed max chunk length
    if (currentChunkText.length + elementHtml.length > maxChunkLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunkText);
        if (chunks.length >= 5) {
          return; // Stop if we hit max chunks
        }
        currentChunk = [];
        currentChunkText = '';
      }
    }
    
    // Handle elements that are larger than max chunk size
    if (elementHtml.length > maxChunkLength) {
      // Split while preserving tags
      const openTag = elementHtml.match(/<[^>]*>/)?.[0] || '';
      const closeTag = elementHtml.match(/<\/[^>]*>$/)?.[0] || '';
      const inner = elementHtml.slice(openTag.length, -closeTag.length);
      
      let pos = 0;
      while (pos < inner.length && chunks.length < 5) {
        const chunk = openTag + 
          inner.slice(pos, pos + maxChunkLength - openTag.length - closeTag.length) +
          closeTag;
        chunks.push(chunk);
        pos += maxChunkLength - openTag.length - closeTag.length;
      }
      return;
    }
    
    currentChunk.push(element);
    currentChunkText += elementHtml;
  };

  // Process each root element
  for (const element of rootElements) {
    if (chunks.length >= 5) break;
    processElement(element);
  }

  // Add final chunk if needed
  if (currentChunkText && chunks.length < 5) {
    chunks.push(currentChunkText);
  }

  return chunks;
};
export async function parrallelCall(chunks: string[], task: string) {
  const responses = await Promise.all(chunks.map(chunk => generateObject({
    system:'You are DOM extractor and your are given with portions of dom elements of the website as chunk, your duty is to undertstand the dom and take out the selector that matches with the current task or step',
    model: perform_extractor('gemini-2.0-flash'),
    prompt: `This is the dom chunk: ${chunk} \n This is the task: ${task}`,
    schema: z.object({
      selector: z.string().describe("The selector for the current step that handles the specified task_enum operation, this selector should be a valid selector for the current step and should be from the dom of the website. Output only one selector for the current step. this selector will be used to click on the element or input the text or scroll to the element or wait for the element to load or perform any other action."),
      selector_array: z.array(z.string()).describe("The array of selectors which should be only be activated in the case like extract, in all other cases it should be an empty array"),
    })
  })));
  return responses;
}
export async function extractUsefulDomElements(dom: string,task: string) {
  // First pass: Basic cleanup while preserving React structure
  let cleanedDom = dom;
  cleanedDom = removeScriptAndStyleTags(cleanedDom);
  cleanedDom = removeCommonAdsAndTracking(cleanedDom);
  
  // Extract important elements while keeping React structure
  const interactiveElements = extractInteractiveElements(cleanedDom);
  // console.log(interactiveElements)
  const chunks = generateChunks(interactiveElements);

  const responses = await parrallelCall(chunks, task);

  // Second pass: Use AI to refine while preserving React functionality
  const response = await generateObject({
    model: perform_agent('gemini-2.0-flash'),
    system: `
    You are an expert in React and DOM analysis. Your task is to analyze the  DOM selectors and choose a selector based on the task and the dom:
    1. Preserve all React-specific attributes and structures
    2. Maintain component hierarchy and event handlers
    3. Keep data-* attributes and React testing selectors
    4. Remove only clearly non-essential elements
    5. Preserve state management related attributes
    6. Keep class names used for styling and component identification
    `,
    schema: z.object({
      selector: z.string().describe("The selector for the current step that handles the specified task_enum operation, this selector should be a valid selector for the current step and should be from the dom of the website. Output only one selector for the current step. this selector will be used to click on the element or input the text or scroll to the element or wait for the element to load or perform any other action."),
    }),
    prompt: `
    <dom_objects>
    ${responses.map(response => response.object.selector).join("\n")}
    </dom_objects>
    <objective>Refine the DOM while maintaining React application functionality</objective>
    `
  });

  return response.object;
}

export async function agent(user_task: string, screenshot?: string, dom?: string) {
  let messages: CoreMessage[] = [];
  let selector: string | undefined;

  // Clean DOM if provided
  if (dom) {
    const extractedData = await extractUsefulDomElements(dom, user_task);
    selector = extractedData.selector;
    console.log(selector)
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
  
  if (selector) {
    messages.push({
      role: 'user',
      content: [{
        type: 'text',
        text: `useful selector for the current step: ${selector}`
      }],
    });
  }

  const response = await generateObject({
    messages: messages,
    model: perform_agent("gemini-2.0-flash"),
    schemaName: "browser_automation",
    system: `
    You are an expert browser automation agent. Your role is to break down user tasks into sequential browser operations and generate the selectors for the current step so that the chrome extension can perform the task by using the selector with the appropriate task_enum.
    You are also provided with screenshot of the current page , understand the UI of the webpage and find useful items that you can use to perform the task 
    Some website dont have enter button , but in the task given there will be something like click on the search button , in such cases you need to find the way to do the task by understanding the UI of the webpage  and use the appropriate selector for the current step
    Task Execution Flow:
    1. Every automation sequence MUST start with GO_TO_URL to establish the working tab
    2. Analyze the target website's DOM structure when available
    3. Break complex user tasks into atomic operations
    4. From the Dom of the website , take appropriate selector for the current step to pass to the extension


    Available Operations (task_enum):
    - GO_TO_URL: Opens a new tab with specified URL (Required first step)
    - EXTRACT: Extracts data, text, or elements from the page
    - CLICK: Clicks on any interactive element (buttons, links, dropdowns)
    - TYPE: Enters text into input fields
  

    

    Return format must include:
    - Current step's task_enum
    - Clear description of current action
    - Progress status
    - Context details (URL, search terms, etc.)
    - Selector from the dom to handle the current step , this selector is passed to the extension for doing task like click , type etc
    If already a tab is opened then use the tab_id to perform the task on the same tab 
    If a task is on the progress do not generate GO_TO_URL again 
    If GO_TO_URL is given for initial step then do not generate it again as the tab will be already opened 
    `,
    schema: z.object({
      task_enum: z.enum(["GO_TO_URL", "EXTRACT", "CLICK", "TYPE"]),
      current_step: z.string().describe("Description of the current atomic operation being performed"),
      is_full_user_task_finished: z.boolean().describe("Indicates whether the complete user task has been accomplished"),
      next_step: z.string().describe("Description of the next atomic operation to be performed , if the previous step failed or not successful then the next step should be the same step again"),
      context: z.object({
        url: z.string().describe("Full HTTPS URL for GO_TO_URL steps, or current page URL for context"),
        searchTerms: z.string().describe("Search terms or input data needed for the current step"),
      }),
      selector: z.string().describe("The selector for the current step that handles the specified task_enum operation, this selector should be a valid selector for the current step and should be from the dom of the website. Output only one selector for the current step. this selector will be used to click on the element or input the text or scroll to the element or wait for the element to load or perform any other action."),
      extract_selectors: z.array(z.string()).describe("These are the selectors that will be used to extract the data from the page, this is an array of selectors"),
      visual_discription_ui: z.string().describe("A visual discription of the webpage UI with what all are you seeing including the placeholders on input , buttons , links , dropdowns , images , paragraphs , headings , etc"),
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
