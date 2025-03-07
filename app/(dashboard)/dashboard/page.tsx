declare const chrome: any;

"use client";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useEffect, useState } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {
  web_search,
  operator,
  operator_completed,
  add_folder
} from "@/lib/schema/function-call";
import {
  agent,
  generateWebSearch
} from "@/app/actions/ai-agent";
import Welcome from "@/components/welcome";
import { automationStore } from "@/lib/store/automation-store";
import { KnowledgeGraphBento } from "@/components/knowledge-graph";
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph";
import { SpotlightSearch } from "@/components/spotlight-search";
import { Progress } from "@/components/ui/progress";
import { saveSearchHistory, createFolder } from "@/app/actions/backend";


const EXTENSION_ID = "kedicgkkepbajabaahchaahppidgjica";
export const maxDuration = 30;
export default function Home() {
  const { client } = useLiveAPIContext();
  const [generatedObject, setGeneratedObject] = useState<KnowledgeGraphData | null>(null);
  const [lastSearchResults, setLastSearchResults] = useState<KnowledgeGraphData | null>(null);
  const [isFirstTask, setIsFirstTask] = useState(true);
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Add event listener for renderKnowledgeGraph event
  useEffect(() => {
    const handleRenderKnowledgeGraph = (event: any) => {
      const { data } = event.detail;
      if (data) {
        console.log("Rendering knowledge graph from event:", data);
        setGeneratedObject(data as KnowledgeGraphData);
        setLastSearchResults(data as KnowledgeGraphData);
      }
    };

    // Add event listener
    window.addEventListener('renderKnowledgeGraph', handleRenderKnowledgeGraph);

    // Clean up
    return () => {
      window.removeEventListener('renderKnowledgeGraph', handleRenderKnowledgeGraph);
    };
  }, []);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);

      if (toolCall.functionCalls.length) {
        toolCall.functionCalls.forEach(async (fc: any) => {
          if (fc.name === web_search.name) {
            console.log("Web Search Call:", fc.args.web_search);
            setIsLoading(true);
            try {
              const response = await generateWebSearch(fc.args.web_search);
              console.log("Web Search Response:", response);
              setGeneratedObject(response as KnowledgeGraphData);
              setLastSearchResults(response as KnowledgeGraphData);
              client.sendToolResponse({
                functionResponses: [
                  {
                    response: {
                      output: {
                        success: true,
                        ui_generated: true,
                        tell_user: response.description,
                      },
                    },
                    id: fc.id,
                  },
                ],
              });
              saveSearchHistory(fc.args.web_search, JSON.stringify(response));
            } finally {
              // Immediately set isLoading to false when data is received
              setIsLoading(false);
            }
          }
          if (fc.name === add_folder.name) {
            console.log("Add Folder Call:", fc.args);
            setIsLoading(true);
            try {
              // Use either the current generatedObject or the lastSearchResults
              const searchData = generatedObject || lastSearchResults;
              
              // Log the current state to debug
              console.log("Current generatedObject:", generatedObject ? "Available" : "Null");
              console.log("Last search results:", lastSearchResults ? "Available" : "Null");
              console.log("Using search data:", searchData ? "Available" : "Null");
              
              if (searchData) {
                console.log("Search data details:", {
                  title: searchData.title,
                  hasSearchResults: searchData.search_results && searchData.search_results.length > 0,
                  searchResultsCount: searchData.search_results ? searchData.search_results.length : 0
                });
              }
              
              // Determine content type and prepare content
              let content = null;
              let contentType: 'urls' | 'knowledge_graph' = 'urls';
              
              // If we have search results from either current or last search, use them
              if (searchData?.search_results && Array.isArray(searchData.search_results) && searchData.search_results.length > 0) {
                content = searchData.search_results;
                contentType = 'urls';
                
                console.log(`Creating folder with ${searchData.search_results.length} search results`);
              } 
              // If we have a knowledge graph but no search results, save the entire knowledge graph
              else if (searchData) {
                // Create a copy of the searchData to avoid reference issues
                content = JSON.parse(JSON.stringify(searchData));
                contentType = 'knowledge_graph';
                
                // If there are no search results but we have a knowledge graph, create some placeholder search results
                if (!content.search_results || !Array.isArray(content.search_results) || content.search_results.length === 0) {
                  content.search_results = [
                    {
                      title: content.title || fc.args.folder_name,
                      url: "",
                      content: content.description || `Information about ${fc.args.folder_name}`
                    }
                  ];
                }
                
                console.log(`Creating folder with knowledge graph data: ${content.title}`);
              }
              // If we don't have any content yet, create a placeholder file with the folder name
              else {
                // Create a default knowledge graph structure
                content = {
                  title: fc.args.folder_name,
                  description: "Folder created by user request",
                  imageUrl: "/placeholder.svg",
                  relatedTopics: [],
                  videoResult: [],
                  imageGallery: [],
                  quick_insights: [
                    {
                      title: "Created Folder",
                      emoji: "📁",
                      content: `This folder was created to store information about ${fc.args.folder_name}`
                    }
                  ],
                  search_results: [
                    {
                      title: fc.args.folder_name,
                      url: "",
                      content: `Information about ${fc.args.folder_name}`
                    }
                  ]
                };
                contentType = 'knowledge_graph';
                
                console.log(`Creating folder with placeholder content`);
              }
              
              // Create the folder with the appropriate content
              const folder = await createFolder(
                fc.args.folder_name,
                content,
                contentType
              );
              
              // Dispatch event to notify sidebar to refresh folders
              if (folder) {
                window.dispatchEvent(new Event('folderCreated'));
              }
              
              // Send response back to the model
              client.sendToolResponse({
                functionResponses: [
                  {
                    response: {
                      output: {
                        success: !!folder,
                        folder_created: !!folder,
                        folder_name: fc.args.folder_name,
                        content_type: contentType,
                        message: folder 
                          ? `Folder "${fc.args.folder_name}" created successfully with ${contentType === 'urls' && Array.isArray(content) ? `${content.length} URLs` : 'knowledge graph data'}`
                          : "Failed to create folder"
                      },
                    },
                    id: fc.id,
                  },
                ],
              });
            } catch (error) {
              console.error("Error creating folder:", error);
              client.sendToolResponse({
                functionResponses: [
                  {
                    response: {
                      output: {
                        success: false,
                        folder_created: false,
                        error: error instanceof Error ? error.message : "Unknown error"
                      },
                    },
                    id: fc.id,
                  },
                ],
              });
            } finally {
              setIsLoading(false);
            }
          }
          if (fc.name === operator.name) {
            const storedState = automationStore.getState();


            // For first task, use user_task, otherwise use the current progress
            const taskInput = isFirstTask ? fc.args.user_task : fc.args.agent_progress;
            console.log("Current task input:", taskInput);
            console.log("passed screenshot ", storedState.screenshot);
            setScreenshot(storedState.screenshot || undefined);
            const task = await agent(
              taskInput,
              storedState.screenshot,
              storedState.domElements
            );
            console.log("Agent response:", task);

            if (isFirstTask) {
              setIsFirstTask(false);
            }

            // Update store with new progress immediately
            automationStore.setState({
              agent_progress: task.next_step,
            });

            switch (task.task_enum) {
              case "GO_TO_URL": {
                chrome.runtime.sendMessage(
                  EXTENSION_ID,
                  {
                    action: "GOTO",
                    payload: { url: task.context.url },
                  },
                  async function (response: any) {
                    if (response?.success) {
                      automationStore.setState({
                        currentUrl: task.context.url,
                        domElements: response.dom,
                        screenshot: response.screenshot,
                        tabID: response.tabId,
                      });

                      // Send response with updated progress
                      client.sendToolResponse({
                        functionResponses: [
                          {
                            response: {
                              output: {
                                is_task_finished:
                                  task.is_full_user_task_finished,
                                next_step: task.next_step,
                                tab_id: storedState.tabID,
                                visual_discription_ui: `visual discription of the webpage UI: ${task.visual_discription_ui} \n\n Use this information to find the ways to perform the task for the user`,
                                tab_opened: true,
                                success: true,
                              },
                            },
                            id: fc.id,
                          },
                        ],
                      });
                      console.log(
                        "Tool response sent:",
                        task.next_step,
                        task.is_full_user_task_finished
                      );
                    } else {
                      handleError(
                        client,
                        fc.id,
                        task.next_step,
                        response?.error
                      );
                    }
                  }
                );
                break;
              }

              case "CLICK": {
                console.log("storedState", storedState.tabID);
                chrome.runtime.sendMessage(
                  EXTENSION_ID,
                  {
                    action: "CLICK",
                    payload: {
                      script: task.selector,
                      tabId: storedState.tabID,
                    },
                  },
                  async function (response: any) {
                    if (response?.success) {
                      automationStore.setState({
                        domElements: response.dom,
                        screenshot: response.screenshot,
                      });

                      client.sendToolResponse({
                        functionResponses: [
                          {
                            response: {
                              output: {
                                is_task_finished:
                                  task.is_full_user_task_finished,
                                next_step: task.next_step,
                                success: true,
                              },
                            },
                            id: fc.id,
                          },
                        ],
                      });
                    } else {
                      handleError(
                        client,
                        fc.id,
                        task.next_step,
                        response?.error
                      );
                    }
                  }
                );
                break;
              }
              case "TYPE": {
                console.log("storedState", storedState.tabID);
                chrome.runtime.sendMessage(
                  EXTENSION_ID,
                  {
                    action: "TYPE",
                    payload: {
                      text: task.context.searchTerms,
                      script: task.selector,
                      tabId: storedState.tabID,
                    },
                  },
                  async function (response: any) {
                    if (response?.success) {
                      automationStore.setState({
                        domElements: response.dom,
                        screenshot: response.screenshot,
                      });

                      client.sendToolResponse({
                        functionResponses: [
                          {
                            response: {
                              output: {
                                is_task_finished:
                                  task.is_full_user_task_finished,
                                next_step: task.next_step,
                                success: true,
                              },
                            },
                            id: fc.id,
                          },
                        ],
                      });
                    } else {
                      handleError(
                        client,
                        fc.id,
                        task.next_step,
                        response?.error
                      );
                    }
                  }
                );
                break;
              }
              case "EXTRACT": {
                console.log("storedState", storedState.tabID);
                chrome.runtime.sendMessage(
                  EXTENSION_ID,
                  {
                    action: "EXTRACT",
                    payload: {
                      script: task.extract_selectors,
                      tabId: storedState.tabID,
                    },
                  },
                  async function (response: any) {
                    if (response?.success) {
                      automationStore.setState({
                        domElements: response.extracteData,
                        screenshot: response.screenshot,
                      });

                      client.sendToolResponse({
                        functionResponses: [
                          {
                            response: {
                              output: {
                                is_task_finished:
                                  task.is_full_user_task_finished,
                                next_step: task.next_step,
                                extracted_data: response.extractedData,
                                success: true,
                              },
                            },
                            id: fc.id,
                          },
                        ],
                      });
                    } else {
                      handleError(
                        client,
                        fc.id,
                        task.next_step,
                        response?.error
                      );
                    }
                  }
                );
                break;
              }
              
              

              default: {
                console.error("Unsupported task enum:", task.task_enum);
                handleError(
                  client,
                  fc.id,
                  task.next_step,
                  "Unsupported task type"
                );
                break;
              }
            }
          }
          if (fc.name === operator_completed.name) {
            console.log("Operator Completed Call:", fc.args.is_task_finished);
            setIsFirstTask(true);
            automationStore.clear(); // Clear store when task is complete
            client.sendToolResponse({
              functionResponses: [
                {
                  response: {
                    output: {
                      success: true,
                    },
                  },
                  id: fc.id,
                },
              ],
            });
          }
        });
      }
    };

    // Helper function for error handling
    const handleError = (
      client: any,
      fcId: string,
      progress: string,
      error: string
    ) => {
      console.error("Action failed:", error);
      client.sendToolResponse({
        functionResponses: [
          {
            response: {
              output: {
                success: false,
                agent_progress: progress,
                error: error,
              },
            },
            id: fcId,
          },
        ],
      });
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, isFirstTask]);

  return (
    <div className="bg-[#18181B] w-full h-screen fixed inset-0">
      <SpotlightSearch />
      <main className="flex flex-col h-full w-full border-4 border-[#18181B] p-2">
        <div className="min-h-full ml-64 rounded-3xl overflow-auto relative z-10 bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.32)] border-solid">
          {isLoading && (
            <Progress 
              value={100} 
              isLoading={true}
              className="relative overflow-hidden"
            />
          )}
          {/* {screenshot && <img src={screenshot} alt="screenshot" className="w-full h-full object-cover" />} */}
          {generatedObject != null ? <KnowledgeGraphBento {...generatedObject}/> : <Welcome />}
        </div>
      </main>
    </div>
  );
}
