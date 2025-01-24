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
  videoResult: z.object({
    title: z.string().describe('Title of the relevant video'),
    thumbnailUrl: z.string().describe('Video thumbnail URL')
  }).describe('Featured video about the topic'),
  imageGallery: z.array(z.string()).describe('Array of image URLs for the gallery'),
  facts: z.array(z.object({
    title: z.string().describe('Title of the fact'),
    content: z.string().describe('Content of the fact')
  })).describe('Array of key facts about the topic')
});

export type KnowledgeGraphData = z.infer<typeof knowledgeGraphSchema>; 