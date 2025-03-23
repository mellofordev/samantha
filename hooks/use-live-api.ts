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

    // Reference to the currently playing audio element
    let currentAudio: HTMLAudioElement | null = null;

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();
    
    // Queue implementation for handling text chunks
    type QueueItem = {
      text: string;
      priority: number; // Higher number = higher priority
    };
    
    // Queue state
    const audioQueue: QueueItem[] = [];
    let queueProcessing = false;
    let latestPriority = 0;
    let bufferTimer: NodeJS.Timeout | null = null;
    let isCurrentlySpeaking = false;
    
    // Function to stop all audio playback and clear the queue
    const stopAllAudio = () => {
      // Clear the queue
      audioQueue.length = 0;
      
      // Clear any pending buffer timer
      if (bufferTimer) {
        clearTimeout(bufferTimer);
        bufferTimer = null;
      }
      
      // Stop current audio playback if any
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }
      
      // Reset speaking state
      isCurrentlySpeaking = false;
      queueProcessing = false;
      
      // Stop audio streamer
      stopAudioStreamer();
    };
    
    // Function to process the queue
    const processQueue = async () => {
      if (audioQueue.length === 0 || isCurrentlySpeaking || !queueProcessing) {
        return;
      }
      
      // Sort by priority, so newest complete sentences are first
      audioQueue.sort((a, b) => b.priority - a.priority);
      
      // Get the next item from the queue
      const item = audioQueue.shift();
      if (!item || !item.text.trim()) {
        // If queue is now empty or item is empty, stop processing
        if (audioQueue.length === 0) {
          queueProcessing = false;
        } else {
          // Process next item
          setTimeout(processQueue, 10);
        }
        return;
      }
      
      try {
        isCurrentlySpeaking = true;
        
        // Call the server action for text-to-speech
        const audioDataUrl = await openaiPlayAudio(item.text);
        
        // If queue was cleared during API call, don't play audio
        if (!queueProcessing) {
          return;
        }
        
        // Play the audio data URL in the browser
        const audio = new Audio(audioDataUrl);
        currentAudio = audio;
        
        // Create a promise that resolves when audio finishes playing
        await new Promise((resolve) => {
          audio.onended = () => {
            currentAudio = null;
            resolve(null);
          };
          audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            currentAudio = null;
            resolve(null);
          };
          audio.play().catch(error => {
            console.error("Error playing audio:", error);
            currentAudio = null;
            resolve(null);
          });
        });
      } catch (error) {
        console.error("Error playing audio:", error);
        currentAudio = null;
      } finally {
        isCurrentlySpeaking = false;
        
        // Process the next item in the queue
        if (queueProcessing && audioQueue.length > 0) {
          // Use a small delay to avoid blocking the main thread
          setTimeout(processQueue, 10);
        } else {
          queueProcessing = false;
        }
      }
    };
    
    // Add text to the queue
    const addToQueue = (text: string, startProcessing = true) => {
      if (!text.trim()) return;
      
      latestPriority++;
      
      // Add to the queue
      audioQueue.push({
        text,
        priority: latestPriority
      });
      
      // Start processing if not already processing
      if (startProcessing && !queueProcessing) {
        queueProcessing = true;
        processQueue();
      }
    };
    
    // Smart chunking function to break text into natural speech units
    const textAccumulator = (() => {
      let buffer = '';
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Process accumulated text if it forms a complete thought
      const processIfComplete = (force = false) => {
        if (!buffer.trim()) return;
        
        // Process if there's a sentence ending, a newline, or buffer is getting large
        const shouldProcess = force || 
                             /[.!?]\s*$/.test(buffer) || 
                             buffer.includes('\n') || 
                             buffer.length > 80;
        
        if (shouldProcess) {
          addToQueue(buffer);
          buffer = '';
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        } else if (!timeoutId) {
          // Set a timer to process incomplete sentences after a delay
          timeoutId = setTimeout(() => {
            if (buffer.trim()) {
              addToQueue(buffer);
              buffer = '';
            }
            timeoutId = null;
          }, 300); // 300ms timeout for incomplete sentences
        }
      };
      
      return {
        add: (text: string) => {
          buffer += text;
          processIfComplete();
        },
        flush: () => {
          processIfComplete(true);
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        },
        clear: () => {
          buffer = '';
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        }
      };
    })();

    const onText = (data: any) => {
      // Get the new text chunk
      const newText = data.modelTurn.parts[0]?.text || '';
      if (!newText) return;
      
      // Add to accumulator, which will intelligently queue complete sentences
      textAccumulator.add(newText);
    };
    
    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
      
    const onInterrupted = () => {
      // Stop all audio and clear the queue
      stopAllAudio();
      
      // Clear the text accumulator
      textAccumulator.clear();
      
      console.log("Interrupted - audio stopped and queue cleared");
    };

    client
      .on("close", onClose)
      .on("interrupted", onInterrupted)
      .on("audio", onAudio)
      .on("content", onText);

    return () => {
      // Stop any active audio before unmounting
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      
      // Flush any remaining text and make sure queue is processed
      textAccumulator.flush();
      
      client
        .off("close", onClose)
        .off("interrupted", onInterrupted)
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
