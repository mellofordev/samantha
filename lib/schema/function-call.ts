import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { web_search_description } from "../prompt_helpers/web-search";

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

export const web_search: FunctionDeclaration = {
  name: "web_search",
  description: "Perform a web search and display the results in a knowledge graph format",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      web_search: {
        type: SchemaType.STRING,
        description: web_search_description,
      },
    },
    required: ["web_search"],
  },
};

export const chat_history: FunctionDeclaration = {
  name: "chat_history", 
  description: "The chat history of the user with the Assistant",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      chat_history: {
        type: SchemaType.ARRAY,
        description: "The chat history of the user with the Assistant",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            message: {
              type: SchemaType.STRING,
              description: "The message text"
            },
            role: {
              type: SchemaType.STRING,
              description: "The role of who sent the message",
              enum: ["user", "assistant"]
            }
          },
          required: ["message", "role"]
        }
      },
    },
    required: ["chat_history"],
  },
};

export const operator: FunctionDeclaration = {
  name: "operator",
  description:
    `<tool_description>
    The operator tool enables web browser automation to complete complex user tasks. It should be called when a user requests actions that require browser interaction.
    </tool_description>
    <example_tasks>
    - 'Order a large pepperoni pizza from Domino's for delivery to my address'
    - 'Find and compare prices for iPhone 14 Pro across major retailers'
    - 'Book a one-way flight from New York to London for next Friday'
    - 'Fill out and submit the contact form on company X's website'
    - 'Add a MacBook Pro 16\" to my Amazon cart and proceed to checkout'
    </example_tasks>
    <capabilities>
    When invoked, it activates a Chrome extension that can programmatically navigate websites, fill forms, click buttons and perform other browser actions.
    </capabilities>
    The tool will be called and the agent does the task step by step.
    Each step or the task completion is sent back to the model in toolResponse form 
    `,
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      user_task:{
        type: SchemaType.STRING,
        description: "The task that the user wants to perform",
      },
      agent_progress:{
        type: SchemaType.STRING,
        description: "The progress of the agent in the task",
      },
      next_step:{
        type: SchemaType.STRING,
        description: "The next step of the agent in the task , if the previous step failed or not successful then the next step should be the same step again, each step or task completion is sent back to the model in toolResponse form",
      },
    },
    required: ["user_task","agent_progress","next_step"],
  },
};

export const operator_completed: FunctionDeclaration = {
  name: "operator_completed",
  description: "The operator tool is completed",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      is_task_finished: {
        type: SchemaType.BOOLEAN,
        description: "Whether the entire user task is finished",
      },
    },
    required: ["is_task_finished"],
  },
};

export const conversation: FunctionDeclaration = {
  name: "conversation",
  description: "transcribtion of what the user or the assistant said",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      messages: {
        type: SchemaType.ARRAY,
        description: "The chat history of the user with the Assistant",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            role: {
              type: SchemaType.STRING,
              description: "The role of who sent the message , ai or user",
            },
            message: {
              type: SchemaType.STRING,
              description: "The message text",
            },
          },
          required: ["role", "message"],
        },
      },
    },
  },
};

export const add_folder: FunctionDeclaration = {
  name: "add_folder",
  description: "Create a folder to save search results and URLs for future reference",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      folder_name: {
        type: SchemaType.STRING,
        description: "Name of the folder to create",
      },
      file_content:{
        type:SchemaType.ARRAY,
        description: "The content of the folder",
        items:{
          type:SchemaType.OBJECT,
          properties:{
            title:{
              type:SchemaType.STRING,
              description: "The title of the content",
            },
            url:{
              type:SchemaType.STRING,
              description: "The url of the content",
            },
            content:{
              type:SchemaType.STRING,
              description: "The content of the content",
            }
          }
        }
      },
      description: {
        type: SchemaType.STRING,
        description: "Brief description of what this folder contains",
      }
    },
    required: ["folder_name"],
  },
};