'use server'
import {generateText} from 'ai'
import {streamUI} from 'ai/rsc'
import {google} from '@ai-sdk/google'
import { code_gen_prompt } from '@/lib/prompt_helpers/code-gen';
import { writeFileSync } from 'fs';
import { z } from 'zod';
import { KnowledgeGraphBento } from '@/components/knowledge-graph'

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

// Function to fetch video from YouTube API
async function fetchYouTubeVideo(query: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&type=video&maxResults=3`
  );
  const data = await response.json();
  const videos = data.items?.map((video: any) => ({
    title: video.snippet.title,
    thumbnailUrl: video.snippet.thumbnails.high.url,
    videoId: video.id.videoId
  })) || [];
  return videos;
}

export async function getVisualResponse(response: string) {
  writeFileSync('components/gen-ui.tsx', 'export default function GenUI() { return <div>Generating...</div> }')
  const result = await generateText({
    model:google('gemini-2.0-flash-exp'),
    prompt: `this is the visual requirements for generating the component : ${response}`,
    system:code_gen_prompt,
    maxSteps:5
  })
  writeFileSync('components/gen-ui.tsx', result.text)
  return {
    success:true
  }
}
export async function getSearchResults(query: string) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_TAVILY_API_KEY,
        query: query,
        include_images: true
      })
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data)
    return {
      query: data.query,
      results: data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      })) as SearchResult[],
      images: data.images || [],
      responseTime: data.response_time
    };
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw error;
  }
}
export async function generateUI(prompt: string) {
  const result = await streamUI({
    model: google('gemini-2.0-flash-exp'),
    prompt: `Create a knowledge graph about: ${prompt}. Include a main topic with description, related topics, a video, image gallery, and key facts.`,
    system: `You are a knowledge graph generator. Generate a comprehensive knowledge graph with a main topic, related subtopics, a relevant video, image gallery, and key facts. All content should be factual and informative.`,
    text: ({ content }) => <p>{content}</p>,
    maxRetries: 3,
    tools: {
      generateKnowledgeGraph: {
        description: 'Generate a Knowledge Graph based on the user prompt. Return a complete knowledge graph with all required components.',
        parameters: z.object({
          title: z.string().describe('The title of the main topic'),
          description: z.string().describe('A detailed description explaining the main topic (2-3 sentences)'),
          relatedTopics: z.array(z.object({
            title: z.string().describe('Title of the related topic'),
            description: z.string().describe('Description of how this topic relates'),
          })).describe('Array of related topics'),
          facts: z.array(z.object({
            title: z.string().describe('Title of the fact'),
            content: z.string().describe('Content of the fact')
          })).describe('Array of key facts')
        }),
        generate: async function* (data) {
          yield (
            <div className="space-y-6 animate-pulse">
              {/* Main topic skeleton */}
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
                <div className="h-20 bg-gray-200 rounded-lg" />
                <div className="h-48 bg-gray-200 rounded-lg" />
              </div>

              {/* Related topics skeleton */}
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-32 bg-gray-200 rounded-lg" />
                    <div className="h-6 bg-gray-200 rounded-lg w-2/3" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>

              {/* Facts skeleton */}
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 space-y-2 border border-gray-200 rounded-lg">
                    <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>

              <div className="text-center text-gray-500">
                Generating Knowledge Graph...
              </div>
            </div>
          )
          const searchResults = await getSearchResults(data.title)
          const videoResult = await fetchYouTubeVideo(data.title)
          try {
            const knowledgeGraphData = {
              title: data.title,
              description: data.description,
              imageUrl: searchResults.images[0] || '/placeholder.svg',
              relatedTopics: data.relatedTopics.map((topic, index) => ({
                ...topic,
                imageUrl: searchResults.images[index + 1] || '/placeholder.svg'
              })),
              videoResult: videoResult,
              imageGallery: searchResults.images || ['/placeholder.svg'],
              facts: data.facts
            };
            
            return <KnowledgeGraphBento {...knowledgeGraphData} />
          } catch (error) {
            console.error('Error generating knowledge graph:', error);
            throw error;
          }
        },
      },
    },
  })
  return result.value;
}
  