'use client'
import { Card } from "@/components/ui/card";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useEffect, useState } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {  knowledge_graph } from "@/lib/schema/function-call";
import { generateUI } from "../../actions";
import Welcome from "@/components/welcome";
export default function Home() {
  const {client} = useLiveAPIContext();
  const [component, setComponent] = useState<React.ReactNode>();
  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      
      // send data for the response of your tool call
      // in this case Im just saying it was successful
      if (toolCall.functionCalls.length) {
        toolCall.functionCalls.forEach(async (fc:any) => {
          if (fc.name === knowledge_graph.name) {
            console.log(fc.args.knowledge_graph);
            // await getVisualResponse(fc.args.visual_response)
            setComponent(await generateUI(fc.args.knowledge_graph))
          }
        });
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { sucess: true } },
                id: fc.id,
              })),
            }),
          200
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);
  return (
    <div className="bg-[#18181B] w-full h-screen fixed inset-0">
        <main className="flex flex-col h-full w-full border-4 border-[#18181B] p-2">
            <div className="min-h-full ml-64 rounded-2xl bg-white overflow-auto"> {/* Added ml-64 for margin-left */}
                {
                  component!=null ? component : <Welcome />
                }
            </div>
        </main>
    </div>
  );
}

