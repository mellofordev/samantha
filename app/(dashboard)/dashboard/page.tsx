"use client";

import { useEffect, useRef, useState } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {
  generateWebSearch
} from "@/app/actions/ai-agent";
import Welcome from "@/components/welcome";
import { KnowledgeGraphBento } from "@/components/knowledge-graph";
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph";
import { SpotlightSearch } from "@/components/spotlight-search";
import { Progress } from "@/components/ui/progress";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import {useChat} from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { humePlayAudio } from "@/app/actions/play-audio";
import { useWeatherStore } from "@/contexts/weather-store";
import { saveConversationHistory } from "@/app/actions/backend";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
export const maxDuration = 30;
export default function Home() {
  const [generatedObject, setGeneratedObject] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUser();
  const { weather, location } = useWeatherStore();
  const { client } = useLiveAPIContext();
  const { messages, input, handleInputChange, handleSubmit, addToolResult } = useChat({
    api: "/api/chat",
    body: {
      username: user?.firstName || "User",
      context: {
        weather: weather ? {
          temperature: Math.round(weather.current.temperature_2m),
          humidity: Math.round(weather.current.relative_humidity_2m),
          windSpeed: Math.round(weather.current.wind_speed_10m),
          location: location,
        } : undefined,
        toolInstructions: "Use web search for latest information",
        userPreference: "Prefers concise responses with actionable insights"
      }
    },
    onToolCall({ toolCall }:{toolCall:any}) {
      console.log(toolCall);
      if(toolCall.toolName == "webSearch") {
        handleToolCall(toolCall.toolCallId,toolCall?.args.query,"text-mode");
      }
    },
    onFinish: async (response) => {
      console.log(response);
      try {
        const audio = await humePlayAudio(response.content);
        console.log(audio);
        const audioDataUrl = new Audio(`data:audio/mp3;base64,${audio}`);
        audioDataUrl.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
      // await saveConversationHistory(response.content,response.role);
    }
  });
  const handleToolCall = async (toolCallId: string, query: string, mode: string) => {
    try{
      setIsLoading(true);
      const response = await generateWebSearch(query);
      console.log(response);
      setGeneratedObject(response);
      if(mode!="live-mode"){
        addToolResult({
          toolCallId: toolCallId,
          result: JSON.stringify(response)
        });
      }
    } catch (error) {
      console.error("Error generating web search:", error);
    }finally{
      setIsLoading(false);
    }
  }
  useEffect(() => {
    const toolCallHandler = async () => {
      client.on("toolcall", (toolCall:ToolCall) => {
        if(toolCall.functionCalls.length > 0) {
          toolCall.functionCalls.forEach((functionCall : any) => {
            console.log(functionCall);
            if(functionCall.name == "web_search") {
              handleToolCall(functionCall.id,functionCall?.args?.web_search,"live-mode");
              client.sendToolResponse({
                functionResponses: [
                  {
                    response: {
                      output: {
                        success: true,
                        search_results_from_web: `Here are the search results for ${functionCall?.args?.web_search}: ${generatedObject?.description} \n Insights: ${generatedObject?.quick_insights?.map((insight:any) => insight.content).join("\n") || 'No insights available'}`,
                      },
                    },
                    id: functionCall.id,
                  },
                ],
              });
            }
          });
        }
      });
    }
    client.on("toolcall", toolCallHandler)
    return () => {
      client.off("toolcall",toolCallHandler);
    };
  }, [client]);
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
          {generatedObject != null ? <KnowledgeGraphBento {...generatedObject}/> : <Welcome messages={messages}/>}
        </div>
        
        {/* Fixed AIInputWithSearch at the bottom */}
        <div className="fixed bottom-8 z-20" style={{ left: "calc(50% + 8rem)", transform: "translateX(-50%)", width: "720px" }}>
            <AIInputWithSearch 
                onSubmit={handleSubmit}
                input={input}
                handleInputChange={handleInputChange}
            />
        </div>
      </main>
    </div>
  );
}
