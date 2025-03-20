'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "@/lib/multimodal-live-client";
import { LiveConfig, ServerContent, isModelTurn } from "@/multimodal-live-types";
import { AudioStreamer } from "@/lib/audio-streamer";
import { audioContext } from "@/lib/utils";
import VolMeterWorket from "@/lib/worklets/vol-meter";
import { openaiPlayAudio } from '@/app/actions/play-audio';

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI({
  url,
  apiKey,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey }),
    [url, apiKey],
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.0-flash-exp",
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();
    
    // Add text buffer to accumulate chunks of text
    let textBuffer = '';
    let bufferTimer: NodeJS.Timeout | null = null;
    let isCurrentlySpeaking = false; // Track if audio is currently being played
    
    const processBuffer = async () => {
      if (textBuffer.trim() && !isCurrentlySpeaking) {
        isCurrentlySpeaking = true;
        const textToSpeak = textBuffer;
        textBuffer = ''; // Clear buffer before playing to avoid duplicating text
        
        try {
          // Call the server action for text-to-speech, which returns a data URL
          const audioDataUrl = await openaiPlayAudio(textToSpeak);
          
          // Play the audio data URL in the browser
          const audio = new Audio(audioDataUrl);
          
          // Create a promise that resolves when audio finishes playing
          await new Promise((resolve) => {
            audio.onended = resolve;
            audio.onerror = (e) => {
              console.error("Audio playback error:", e);
              resolve(null);
            };
            audio.play().catch(error => {
              console.error("Error playing audio:", error);
              resolve(null);
            });
          });
        } catch (error) {
          console.error("Error playing audio:", error);
        } finally {
          isCurrentlySpeaking = false;
          
          // If more text accumulated during speech, process it after a short delay
          if (textBuffer.trim()) {
            setTimeout(processBuffer, 100);
          }
        }
      }
    };

    const onText = async (data: any) => {

      
      // Get the new text chunk
      const newText = data.modelTurn.parts[0]?.text || '';
      
      // Add to buffer
      textBuffer += newText;
      
      // Clear any existing timer
      if (bufferTimer) {
        clearTimeout(bufferTimer);
      }
      
      // Process immediately if we have a sentence-ending punctuation or buffer gets too large
      const shouldProcessNow = !isCurrentlySpeaking && (
        textBuffer.length > 40 || 
        /[.!?]\s*$/.test(textBuffer) ||
        textBuffer.includes('\n')
      );
      
      if (shouldProcessNow) {
        await processBuffer();
      } else if (!isCurrentlySpeaking) {
        // Set a timer to process the buffer after a short pause in streaming
        bufferTimer = setTimeout(processBuffer, 800);
      }
      // If currently speaking, just accumulate text in buffer until speech finishes
    }
    
    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("content", onText);

    return () => {
      // Process any remaining text in the buffer
      if (textBuffer.trim() && bufferTimer) {
        clearTimeout(bufferTimer);
        processBuffer();
      }
      
      client
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("content", onText);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    await client.connect(config);
    setConnected(true);
  }, [client, setConnected, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
  };
}
