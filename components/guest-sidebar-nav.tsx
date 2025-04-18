"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useEffect } from "react";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { prompt } from "@/lib/prompt_helpers/prompt";
import { web_search, conversation, add_folder } from "@/lib/schema/function-call";
import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";
import WeatherCard from "./animata/widget/weather-card";
import {  Plus } from "lucide-react";
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useWeatherStore } from "@/contexts/weather-store";
import { InfoCard, InfoCardAction, InfoCardContent, InfoCardDescription, InfoCardFooter, InfoCardMedia, InfoCardTitle } from "./ui/info-card";
export function GuestSidebarNav() {
  const { setConfig } = useLiveAPIContext();

  
  const { weather, location, isLoadingWeather, setWeather, setLocation, setCoordinates, setIsLoadingWeather } = useWeatherStore();
  
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
          const locationName = geoData.city || geoData.locality || 'Unknown location';
          setLocation(locationName);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.info("Enable location services to get weather updates");
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
      model: "models/gemini-2.0-flash-live-001",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: prompt( 'User', 
              {
                weather: weather ? {
                  temperature: Math.round(weather.current.temperature_2m),
                  humidity: Math.round(weather.current.relative_humidity_2m),
                  windSpeed: Math.round(weather.current.wind_speed_10m),
                  location: location,
                } : undefined,
                userPreference: 'This is a guest user , please always tell the user to sign up or login to get the full experience also in the beginning of the conversation ask the name of the user and then use it in the conversation'
              },
            ),
          },
        ],
      },
      tools: [
        { functionDeclarations: [web_search, conversation, add_folder] },
      ],
    });
  }, [setConfig, weather, location]);

  return (
    <Sidebar className="dark text-white border-r border-white/10 border-dashed">
      <SidebarHeader className="flex flex-row justify-between items-center p-4 m-2">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AutoCompute" width={32} height={32} draggable={false} />
        </div>
        <SignedIn>
          <UserButton  />
        </SignedIn>
        <SignedOut>
            <Button asChild className="rounded-full">
              <Link href="/sign-in">
                <Plus size={16} />
              </Link>
            </Button>
        </SignedOut>
      </SidebarHeader>
      <hr className="border-white/10 border-dashed" />
      <SidebarContent className="p-4">
      <InfoCard variant="dark">
            <InfoCardContent>
              <InfoCardTitle>Login</InfoCardTitle>
              <InfoCardDescription className="text-gray-300">
                Login to get access to your own folders , streamlines responses and more.
              </InfoCardDescription>
              <InfoCardMedia
                media={[
                  {
                    type: "video",
                    src: "https://video.twimg.com/amplify_video/1913358401146650624/vid/avc1/480x270/o6XwoKXbzaqtWTpR.mp4",
                    autoPlay: true,
                    loop: true,
                  }
                ]}
              />
              <InfoCardFooter>
                <InfoCardAction>
                    
                    <Link href="/login">
                      Login now
                    </Link>
                </InfoCardAction>
              </InfoCardFooter>
            </InfoCardContent>
          </InfoCard>
      </SidebarContent>
            
      <SidebarGroup className="p-6">
        <WeatherCard 
          weather={weather}
          location={location}
          isLoading={isLoadingWeather}
        />
      </SidebarGroup>
    </Sidebar>
  );
}
