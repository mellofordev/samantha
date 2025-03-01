declare const chrome: any;

"use client";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useEffect, useState } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {
  knowledge_graph,
  operator,
  operator_completed,
} from "@/lib/schema/function-call";
import { generateUI, agent, generateKnowledgeGraph } from "@/app/actions/ai-agent";
import Welcome from "@/components/welcome";
import { automationStore } from "@/lib/store/automation-store";
import { KnowledgeGraphBento } from "@/components/knowledge-graph";
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph";
import { SpotlightSearch } from "@/components/spotlight-search";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const EXTENSION_ID = "kedicgkkepbajabaahchaahppidgjica";
export const maxDuration = 30;
export default function Home() {
  const { client } = useLiveAPIContext();
  const [generatedObject, setGeneratedObject] = useState<KnowledgeGraphData | null>(null);
  const [isFirstTask, setIsFirstTask] = useState(true);
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Add loading progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      // Reset progress when loading starts
      setLoadingProgress(0);
      
      // Simulate progress increasing to 90% during loading
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + (90 - prev) * 0.1;
        });
      }, 300);
    } else {
      // Complete the progress when loading finishes
      setLoadingProgress(100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);

      if (toolCall.functionCalls.length) {
        toolCall.functionCalls.forEach(async (fc: any) => {
          if (fc.name === knowledge_graph.name) {
            console.log("Knowledge Graph Call:", fc.args.knowledge_graph);
            setIsLoading(true);
            try {
              const response = await generateKnowledgeGraph(fc.args.knowledge_graph);
              setGeneratedObject(response as KnowledgeGraphData);
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
            } finally {
              // Delay setting isLoading to false to allow progress animation to complete
              setTimeout(() => setIsLoading(false), 100);
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
          {(loadingProgress > 0 && isLoading) && (
            <Progress 
              value={loadingProgress} 
              className="relative overflow-hidden before:absolute before:inset-0 before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
            />
          )}
          {screenshot && <img src={screenshot} alt="screenshot" className="w-full h-full object-cover" />}
          {generatedObject != null ? <KnowledgeGraphBento {...generatedObject}/> : <Welcome />}
        </div>
      </main>
    </div>
  );
}
