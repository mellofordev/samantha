"use client";

import { Globe,Monitor,Video,Mic, Send, X, Search, Maximize2, Minimize2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { AudioRecorder } from "@/lib/audio-recorder";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-mux";
import { Button } from "./button";
import { getConversationHistory, saveConversationHistory } from "@/app/actions/backend";
import { TooltipContent, TooltipTrigger } from "./tooltip";
import { Tooltip } from "./tooltip";
import { TooltipProvider } from "./tooltip";

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  input?: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "ask samantha anything...",
  minHeight = 48,
  maxHeight = 164,
  onSubmit,
  input = "",
  handleInputChange,
  className
}: AIInputWithSearchProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [showScreenshare, setShowScreenshare] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showOpenText, setShowOpenText] = useState(false);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  // Live API context for audio connect/disconnect
  const { client ,connected, connect, disconnect } = useLiveAPIContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeVideoStream, setActiveVideoStream] = useState<MediaStream | null>(null);
  const [videoStreams, setVideoStreams] = useState<UseMediaStreamResult[]>([]);
  const [videoExpanded, setVideoExpanded] = useState(false);

  // Handler for audio button (acts as connect/disconnect)
  const handleAudioClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      await connect();
      // const conversationHistory = await getConversationHistory();
      // client.send([
      //   {
      //     text: `with calm and soothing voice start the conversation with the user , btw here is the previous messages you have send ${conversationHistory?.map(message => `${message.role}: ${message.message}`).join("\n")}`,
      //   },
      // ]);
    }
  };
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);
  useEffect(() => {
    const onData = async (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    

    };
    if (connected && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, audioRecorder]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  // Helper to notify parent or handle video stream change (stub for now)
  const onVideoStreamChange = useCallback((stream: MediaStream | null) => {
    // You can add a prop callback or handle side effects here if needed
  }, []);

  // Screen share logic
  const handleScreenShare = async () => {
    if (!connected) {
      await connect();
    }
    if (!showScreenshare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setActiveVideoStream(stream);
        onVideoStreamChange(stream);
        setVideoStreams((prev) => [
          ...prev,
          {
            type: "screen",
            start: async () => stream,
            stop: () => stream.getTracks().forEach(t => t.stop()),
            isStreaming: true,
            stream: stream
          }
        ]);
      } catch (err) {
        setShowScreenshare(false);
      }
    } else {
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach((track) => track.stop());
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }
    }
    setShowScreenshare((prev) => !prev);
  };

  // Camera share logic
  const handleCameraShare = async () => {
    if (!connected) {
      await connect();
    }
    if (!showCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setActiveVideoStream(stream);
        onVideoStreamChange(stream);
        setVideoStreams((prev) => [
          ...prev,
          {
            type: "webcam",
            start: async () => stream,
            stop: () => stream.getTracks().forEach(t => t.stop()),
            isStreaming: true,
            stream: stream
          }
        ]);
      } catch (err) {
        setShowCamera(false);
      }
    } else {
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach((track) => track.stop());
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }
    }
    setShowCamera((prev) => !prev);
  };

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };
  return (
    <div className={cn(
      "w-full",
      className
    )}>
      <div className="relative max-w-xl w-full mx-auto">
        {/* Video preview for camera/screen share - moved to top, left-aligned */}
        {(showCamera || showScreenshare) && (
            <motion.div
              layout
              initial={false}
              animate={{
                height: videoExpanded ? 256 : 96, // 64 * 4 = 256px, 24 * 4 = 96px
                scale: videoExpanded ? 1.04 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22
              }}
              className="relative"
              style={{ width: 'fit-content', minWidth: 160 }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "rounded-lg transition-all",
                  videoExpanded ? "max-h-full" : "max-h-24"
                )}
                style={{ background: '#000', width: 'auto', maxWidth: '90%' }}
              />
              <Button
                className="absolute top-1  z-10 text-white"
                variant="ghost"
                onClick={() => setVideoExpanded((prev) => !prev)}
                aria-label={videoExpanded ? "Minimize video" : "Expand video"}
              >
                {videoExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <canvas ref={renderCanvasRef} style={{ display: 'none' }} />
            </motion.div>
        )}
        {!minimized ? (
          <motion.div 
            className="relative flex flex-col shadow-xl rounded-xl backdrop-blur-xl bg-white/5 border border-white/20 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { 
                type: "spring", 
                damping: 25, 
                stiffness: 300 
              }
            }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <div className="absolute top-2 right-2 z-10">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                className="rounded-full w-5 h-5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-black/60 dark:text-white/60" />
              </button>
            </div>
            <div
              className="overflow-y-auto"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              <Textarea
                id={id}
                value={input}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-transparent border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2] rounded-none"
                ref={textareaRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const formEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                    onSubmit?.(formEvent);
                  }
                }}
                onChange={(e) => {
                  handleInputChange?.(e);
                  adjustHeight();
                }}
              />
            </div>

            <div className="h-12 border-t border-white/10 bg-transparent">
              <div className="absolute left-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScreenShare}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 border-white/10",
                    showScreenshare
                      ? "bg-emerald-500/15 border-emerald-400 text-emerald-500"
                      : "bg-white/5 border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      initial={{ y: 0, scale: 1 }}
                      animate={{ 
                        y: showScreenshare ? [0, -2, 0] : 0,
                        scale: showScreenshare ? [1, 1.1, 1.1] : 1,
                        transition: {
                          y: { times: [0, 0.4, 1], duration: 0.5 },
                          scale: { times: [0, 0.4, 1], duration: 0.5 }
                        }
                      }}
                      whileHover={{
                        y: -2,
                        scale: 1.1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        },
                      }}
                    >
                            <Monitor
                              className={cn(
                                "w-4 h-4",
                          showScreenshare
                            ? "text-emerald-500"
                            : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showScreenshare && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm overflow-hidden whitespace-nowrap text-emerald-500 flex-shrink-0"
                      >
                        Screen
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  type="button"
                  onClick={handleCameraShare}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 border-white/10",
                    showCamera
                      ? "bg-purple-500/15 border-purple-400 text-purple-500"
                      : "bg-white/5 border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      initial={{ y: 0, scale: 1 }}
                      animate={{ 
                        y: showCamera ? [0, -2, 0] : 0,
                        scale: showCamera ? [1, 1.1, 1.1] : 1,
                        transition: {
                          y: { times: [0, 0.4, 1], duration: 0.5 },
                          scale: { times: [0, 0.4, 1], duration: 0.5 }
                        }
                      }}
                      whileHover={{
                        y: -2,
                        scale: 1.1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        },
                      }}
                    >
                      <Video
                        className={cn(
                          "w-4 h-4",
                          showCamera
                            ? "text-purple-500"
                            : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showCamera && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm overflow-hidden whitespace-nowrap text-purple-500 flex-shrink-0"
                      >
                        Camera
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  type="button"
                  onClick={handleAudioClick}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 border-white/10",
                    connected
                      ? "bg-amber-500/15 border-amber-400 text-amber-500"
                      : "bg-white/5 border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      initial={{ y: 0, scale: 1 }}
                      animate={{ 
                        y: connected ? [0, -2, 0] : 0,
                        scale: connected ? [1, 1.1, 1.1] : 1,
                        transition: {
                          y: { times: [0, 0.4, 1], duration: 0.5 },
                          scale: { times: [0, 0.4, 1], duration: 0.5 }
                        }
                      }}
                      whileHover={{
                        y: -2,
                        scale: 1.1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 10,
                        },
                      }}
                    >
                      <Mic
                        className={cn(
                          "w-4 h-4",
                          connected
                            ? "text-amber-500"
                            : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {connected && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm overflow-hidden whitespace-nowrap text-amber-500 flex-shrink-0"
                      >
                        Connected
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              <div className="absolute right-3 bottom-3">
                <button
                  type="button"
                  onClick={async () => {
                    const formEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                    onSubmit?.(formEvent);
                    await saveConversationHistory(input, "user");
                  }}
                  className={cn(
                    "rounded-lg p-2 transition-colors border border-white/10",
                    input
                      ? "bg-sky-500/15 text-sky-500"
                      : "bg-white/5 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-white/10"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex justify-center">
            <motion.button
              onClick={() => setMinimized(false)}
              className={cn(
                "rounded-full bg-white/5 backdrop-blur-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border border-white/20 text-black/60 dark:text-white/60",
                showOpenText ? "pl-2 pr-3" : "h-8 w-8"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300 
                }
              }}
              whileHover={{ scale: 1.05 }}
              exit={{ 
                scale: 0,
                opacity: 0
              }}
              onMouseEnter={() => setShowOpenText(true)}
              onMouseLeave={() => setShowOpenText(false)}
            >
              <Search className="w-4 h-4" />
              <AnimatePresence>
                {showOpenText && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ 
                      width: "auto", 
                      opacity: 1, 
                      marginLeft: 4,
                      transition: { 
                        duration: 0.2, 
                        ease: "easeOut" 
                      }
                    }}
                    exit={{ 
                      width: 0, 
                      opacity: 0, 
                      marginLeft: 0,
                      transition: { 
                        duration: 0.1 
                      }
                    }}
                    className="text-sm font-medium overflow-hidden whitespace-nowrap"
                  >
                    open
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}