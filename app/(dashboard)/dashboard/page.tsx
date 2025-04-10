declare const chrome: any;

"use client";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useEffect, useState, useRef } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {
  web_search,
  add_folder,
  conversation
} from "@/lib/schema/function-call";
import {
  generateWebSearch
} from "@/app/actions/ai-agent";
import Welcome from "@/components/welcome";
import { automationStore } from "@/lib/store/automation-store";
import { KnowledgeGraphBento } from "@/components/knowledge-graph";
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph";
import { SpotlightSearch } from "@/components/spotlight-search";
import { Progress } from "@/components/ui/progress";
import { saveSearchHistory, createFolder } from "@/app/actions/backend";
import { functionRouter } from "@/app/actions/function-router";
import ControlTray from "@/components/ControlTray";


const EXTENSION_ID = "kedicgkkepbajabaahchaahppidgjica";
export const maxDuration = 30;
export default function Home() {
  const { client } = useLiveAPIContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
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
          // the agent operator is removed from the main branch 
          // available in the dev branch
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
      <main className="flex flex-col h-full w-full md:border-4 md:border-[#18181B] md:p-2 p-0">
        <div className="min-h-full md:ml-64 md:rounded-3xl overflow-auto relative z-10 bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] md:border border-[rgba(255,255,255,0.32)] border-solid md:pb-0">
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
      
      {/* Floating Mobile Control Tray */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-20">
        {videoStream && (
          <div className="mb-3">
            <div className="aspect-video relative overflow-hidden rounded-xl bg-black/20 backdrop-blur-[24px] border border-[rgba(179,177,177,0.32)] border-solid">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
        />
      </div>
    </div>
  );
}
