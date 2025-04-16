"use client";

import { useRef, useState } from "react";
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
import { openaiPlayAudio } from "@/app/actions/play-audio";
import { useWeatherStore } from "@/contexts/weather-store";
export const maxDuration = 30;
export default function Home() {
  const [generatedObject, setGeneratedObject] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUser();
  const { weather, location } = useWeatherStore();
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
        handleToolCall(toolCall.toolCallId,toolCall?.args.query);
      }
    },
    onFinish: async (response) => {
      console.log(response);
      // const audio = await openaiPlayAudio(response.content);
      // const audioDataUrl = new Audio(audio);
      // audioDataUrl.play();
    }
  });
  const handleToolCall = async (toolCallId: string, query: string) => {
    try{
      setIsLoading(true);
      const response = await generateWebSearch(query);
      console.log(response);
      setGeneratedObject(response);
      addToolResult({
        toolCallId: toolCallId,
        result: JSON.stringify(response)
      });
    } catch (error) {
      console.error("Error generating web search:", error);
    }finally{
      setIsLoading(false);
    }
  }
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
