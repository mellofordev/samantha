'use client'
import { useRef, useState } from "react";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";
import { Altair } from "@/components/Altair";
import ControlTray from "@/components/ControlTray";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppSidebar } from "@/components/sidebar-nav";

const API_KEY = process.env.NEXT_PUBLIC_GENAI_API_KEY as string;
const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>  
        <AppSidebar />
        <main className="container mx-auto p-4 pt-6 relative min-h-screen pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Section */}
            <Card className="bg-white/80 border-gray-200 shadow-lg">
              <ScrollArea className="h-[80vh]">
                <div className="p-4">
                  <Altair />
                </div>
              </ScrollArea>
            </Card>
          </div>
        </main>
      </LiveAPIProvider>
    </div>
  );
}

