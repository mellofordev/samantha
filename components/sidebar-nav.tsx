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
import { knowledge_graph, operator, operator_completed } from "@/lib/schema/function-call";
import { UserButton, useUser } from "@clerk/nextjs";
import { Inter } from 'next/font/google';
import WeatherCard, { WeatherData } from "./animata/widget/weather-card";
import { Instrument_Serif } from "next/font/google";

const inter = Inter({ 
  weight: '700',
  subsets: ['latin'],
});

export function AppSidebar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const { setConfig } = useLiveAPIContext();
  const { user } = useUser();
  
  // Add weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<string>('Loading location...');
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);

  // Fetch weather data
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoordinates({ latitude, longitude });
          
          // Fetch weather data
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`
          );
          const data = await response.json();
          setWeather(data);

          // Fetch location name
          const geoResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}`
          );
          const geoData = await geoResponse.json();
          setLocation(geoData.city || geoData.locality || 'Unknown location');
          
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingWeather(false);
        }
      }, (error) => {
        console.error('Error getting location:', error);
        setIsLoadingWeather(false);
      });
    }
  }, []);

  // Update system instruction with weather data
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
            text: prompt(
              user?.fullName || 'User', 
              {
                weather: weather ? {
                  temperature: Math.round(weather.current.temperature_2m),
                  humidity: Math.round(weather.current.relative_humidity_2m),
                  windSpeed: Math.round(weather.current.wind_speed_10m),
                  location: location
                } : undefined
              }
            ),
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [knowledge_graph,operator,operator_completed] },
      ],
    });
  }, [setConfig, user, weather, location]);

  return (
    <Sidebar className="dark text-white border-r border-white/10 border-dashed">
      <SidebarHeader className="flex flex-row justify-between items-center p-4 m-2">
        <div className="flex items-center gap-2">
          <h1 className={`font-instrument-serif text-xl font-bold text-white `}>
            AutoCompute
          </h1>
        </div>
        <UserButton  />
      </SidebarHeader>
      <hr className="border-white/10 border-dashed" />
      <SidebarContent>
        {videoStream && (
          <div className="space-y-4 p-4">
            <div className="aspect-video relative overflow-hidden rounded-xl  bg-black/20 backdrop-blur-[24px] border border-[rgba(179,177,177,0.32)] border-solid">
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
      <SidebarGroup className="p-6">
        <WeatherCard 
          weather={weather}
          location={location}
          isLoading={isLoadingWeather}
        />
      </SidebarGroup>
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
