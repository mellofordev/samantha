'use client'
import { Card } from "@/components/ui/card";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useEffect, useState } from "react";
import { ToolCall } from "@/multimodal-live-types";
import {  visual_response } from "@/lib/schema/function-call";
import { generateUI, getVisualResponse } from "../../actions";
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
          if (fc.name === visual_response.name) {
            console.log(fc.args.visual_response);
            // await getVisualResponse(fc.args.visual_response)
            setComponent(await generateUI(fc.args.visual_response))
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
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 w-full p-4">
        <main className="flex flex-col">
            {/* Chat Section */}
            <Card className="bg-white/80 border-gray-200 shadow-lg">
                <div className="p-4">
                    {component}
                   {/* <GenUI /> */}
                </div>
            </Card>
        </main>
    </div>
  );
}

