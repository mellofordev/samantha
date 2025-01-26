"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useRef, useState, useEffect } from "react";
import ControlTray from "@/components/ControlTray";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { prompt } from "@/lib/prompt_helpers/prompt";
import {  knowledge_graph } from "@/lib/schema/function-call";
import { UserButton } from "@clerk/nextjs";
import { Instrument_Serif } from 'next/font/google';

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ['latin'],
});

export function AppSidebar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const { setConfig} = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch:{} },
        { functionDeclarations: [knowledge_graph] },
      ],
    });
  }, [setConfig]);
  return (
    <Sidebar className="dark text-white border-r border-white/10 border-dashed">
      <SidebarHeader className="flex flex-row justify-between items-center p-4 m-2">
        <div className="flex items-center gap-2">
          <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent ${instrumentSerif.className}`}>
            Samantha
          </h1>
        </div>
        <UserButton  />
      </SidebarHeader>
      <hr className="border-white/10 border-dashed" />
      <SidebarContent>
        {videoStream && (
          <div className="space-y-4 p-4">
            <div className="aspect-video relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="pb-2">
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
