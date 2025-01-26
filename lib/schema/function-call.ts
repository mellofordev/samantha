import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { knowledge_graph_description } from "../prompt_helpers/knowledge-graph";
export const declaration: FunctionDeclaration = {
  name: "model_response",
  description: "The response of the model in text format",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      response: {
        type: SchemaType.STRING,
        description: "The response of the model in text format",
      },
    },
    required: ["response"],
  },
};
export const knowledge_graph: FunctionDeclaration = {
  name: "knowledge_graph",
  description:
    "Generate a knowledge graph for the user's query which consist of the title , description , image , related topics , video , image gallery , facts",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      knowledge_graph: {
        type: SchemaType.STRING,
        description: knowledge_graph_description,
      },
    },
    required: ["knowledge_graph"],
  },
};
export const call_background_music: FunctionDeclaration = {
  name: "call_background_music",
  description: "Call this function when you want to play background music, the background music length is 6 minutes 57 seconds",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      timing: {
        type: SchemaType.STRING,
        description: "The timing of the background music to play from , if the function call is for intro then the timing should start from 00:00:00 , otherwise you can choose a timing from 00:00:00 to 06:57:00",
      },
      type: {
        type: SchemaType.STRING,
        description: "The type of the background music to play , it can be welcome, learning, math, science, creative, review, achievement, break, focus",
      },
    },
    required: ["timing", "type"],
  },
};

export const google_search: FunctionDeclaration = {
  name: "google_search",
  description: "Search the internet for the user's query",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      search_query: { type: SchemaType.STRING, description: "The user's query" },
    },
    required: ["search_query"],
  },
};