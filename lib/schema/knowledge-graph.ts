import { z } from 'zod';

export const knowledgeGraphSchema = z.object({
  title: z.string().describe('The title of the main topic'),
  description: z.string().describe('A detailed description explaining the main topic (2-3 sentences)'),
  imageUrl: z.string().describe('The URL of the main image for the main topic'),
  relatedTopics: z.array(z.object({
    title: z.string().describe('Title of the related topic'),
    description: z.string().describe('Description of how this topic relates'),
    imageUrl: z.string().describe('Image URL for the related topic')
  })).describe('Array of related topics'),
  videoResult: z.array(z.object({
    title: z.string().describe('Title of the relevant video'),
    thumbnailUrl: z.string().describe('Thumbnail URL of the relevant video, provide emtpy string now, the url will be fetched from external api'),
    videoId: z.string().describe('Video ID of the relevant video, provide emtpy string now, the url will be fetched from external api'),
  })).describe('Featured videos about the topic'),
  imageGallery: z.array(z.string()).describe('Array of image URLs for the gallery'),
  facts: z.array(z.object({
    title: z.string().describe('Title of the fact'),
    emoji: z.string().describe('An emoji that represents the fact'),
    content: z.string().describe('Content of the fact')
  })).describe('Array of key facts about the topic'),
  search_results: z.array(z.object({
    title: z.string().describe("The title of the search result"),
    url: z.string().describe("The url of the search result"),
    content: z.string().describe("The content of the search result"),
  })).describe('Array of search results')
});

export type KnowledgeGraphData = z.infer<typeof knowledgeGraphSchema>; 