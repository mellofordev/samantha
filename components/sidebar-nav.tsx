'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
  } from "@/components/ui/sidebar"
import { useRef } from "react";
import { useState } from "react";
import ControlTray from "@/components/ControlTray";
  
  export function AppSidebar() {
    const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

    return (
      <Sidebar className="dark text-white">
        <SidebarHeader>
          <h1 className="text-lg font-semibold px-4">Cynthia</h1>
        </SidebarHeader>
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
    )
  }
  