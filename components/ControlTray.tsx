'use client'
import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-mux";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { useWebcam } from "@/hooks/use-webcam";
import { AudioRecorder } from "@/lib/audio-recorder";
import AudioPulse from "@/components/AudioPulse";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Monitor,
  MonitorOff,
  Play,
  Pause
} from "lucide-react";
import { Button } from "./ui/button";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) => {
    const IconComponent = isStreaming ? 
      (onIcon === 'videocam_off' ? VideoOff : MonitorOff) :
      (offIcon === 'videocam' ? Video : Monitor);

    return (
      <Button 
        variant={'default'}
        className="p-2.5 rounded-lg"
        onClick={isStreaming ? stop : start}
      >
        <IconComponent className="w-4 h-4" />
      </Button>
    );
  }
);

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect, volume } =
    useLiveAPIContext();
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

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
        console.log("video data", data);
      }
      if (connected) {
        console.log("sending video frame");
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
    <div className="px-4 pb-4">
      <section className="relative flex items-center justify-between p-2 bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] border-t border-[rgba(255,255,255,0.32)] border-solid rounded-2xl gap-2">
        <nav className={`flex items-center gap-1.5 ${!connected ? 'opacity-50 pointer-events-none' : ''}`}>
          <Button
            variant={'default'}
            className="p-2.5 rounded-lg"
            onClick={() => setMuted(!muted)}
          >
            {!muted ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </Button>

          <div className="p-1.5 rounded-lg bg-[rgba(150,150,150,0.2)] backdrop-blur-[24px] border-t border-[rgba(255,255,255,0.32)] border-solid">
            <AudioPulse volume={volume} active={connected} hover={false} />
          </div>
          <canvas style={{ display: "none" }} ref={renderCanvasRef} />
          {supportsVideo && (
            <>
              <MediaStreamButton
                isStreaming={screenCapture.isStreaming}
                start={changeStreams(screenCapture)}
                stop={changeStreams()}
                onIcon="cancel_presentation"
                offIcon="present_to_all"
              />
              <MediaStreamButton
                isStreaming={webcam.isStreaming}
                start={changeStreams(webcam)}
                stop={changeStreams()}
                onIcon="videocam_off"
                offIcon="videocam"
              />
            </>
          )}
          {children}
        </nav>

        <div className={`flex items-center gap-1.5 ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Button
            variant={'default'}
            ref={connectButtonRef}
            className={`p-2 rounded-lg ${
              connected 
                ? ' text-emerald-500' 
                : ' text-white'
            }`}
            onClick={connected ? disconnect : connect}
          >
            {connected ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default memo(ControlTray);
