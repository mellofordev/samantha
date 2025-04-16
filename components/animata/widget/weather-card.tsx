'use client';
import { CircleArrowUp, CloudSunRain } from "lucide-react";
import { useWeatherStore } from "@/contexts/weather-store";

export interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
}

interface WeatherCardProps {
  weather: WeatherData | null;
  location: string;
  isLoading: boolean;
}

function WeatherSkeleton() {
  return (
    <div className="relative flex w-full flex-col rounded-2xl bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] border-t border-[rgba(255,255,255,0.32)] border-solid p-4">
      <div className="flex flex-1 flex-col gap-3 text-white/90">
        {/* Location skeleton */}
        <div className="h-4 w-24 animate-pulse rounded-md bg-white/10" />
        
        {/* Temperature and icon skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-white/10" />
          <div className="h-10 w-16 animate-pulse rounded-md bg-white/10" />
        </div>
        
        {/* Feels like and wind skeleton */}
        <div className="h-3 w-36 animate-pulse rounded-md bg-white/10" />
      </div>
      
      {/* Humidity section skeleton */}
      <div className="mt-4 flex justify-between rounded-lg bg-[rgba(150,150,150,0.2)] backdrop-blur-[24px] border-t border-[rgba(255,255,255,0.32)] border-solid px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded-md bg-white/10" />
          <div className="h-4 w-8 animate-pulse rounded-md bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function WeatherCard({ weather, location, isLoading }: WeatherCardProps) {
  const store = useWeatherStore();
  const w = weather ?? store.weather;
  const l = location ?? store.location;
  const loading = isLoading ?? store.isLoadingWeather;
  if (loading) {
    return <WeatherSkeleton />;
  }
  if (!w) {
    return (
      <div className="relative flex w-full flex-col rounded-2xl bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] border-t border-[rgba(255,255,255,0.32)] border-solid p-4">
        <p className="text-white/70">Unable to load weather data</p>
      </div>
    );
  }
  const temperature = Math.round(w.current.temperature_2m);
  const feelsLike = Math.round(
    temperature + (w.current.relative_humidity_2m > 70 ? 2 : -2)
  );
  return (
    <div className="relative flex w-full flex-col rounded-2xl bg-[rgba(232,225,225,0.2)] backdrop-blur-[24px] border-t border-[rgba(154,154,154,0.32)] border-solid p-4">
      <div className="flex flex-1 flex-col gap-3 text-white/90">
        <p className="text-sm font-medium text-white/70">{l}</p>
        <div className="flex items-center gap-3">
          <CloudSunRain className="h-8 w-8 text-white/80" />
          <p className="text-4xl font-light">{temperature}°</p>
        </div>
        <p className="text-xs text-white/60">
          Feels like {feelsLike}° • Wind: {Math.round(w.current.wind_speed_10m)} km/h
        </p>
      </div>
      <div className="mt-4 flex justify-between rounded-lg bg-[rgba(150,150,150,0.2)] backdrop-blur-[24px] border-t border-[rgba(217,216,216,0.32)] border-solid px-3 py-2">
        <div className="flex items-center gap-1 text-sm text-white/80">
          <span>Humidity:</span>
          <span>{Math.round(w.current.relative_humidity_2m)}%</span>
        </div>
      </div>
    </div>
  );
}
