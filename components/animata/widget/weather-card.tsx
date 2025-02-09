'use client';
import { CircleArrowUp, CloudSunRain } from "lucide-react";

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
    <div className="relative flex w-full flex-col rounded-2xl bg-white/5 p-4 backdrop-blur-sm backdrop-filter border border-white/10">
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
      <div className="mt-4 flex justify-between rounded-lg bg-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded-md bg-white/10" />
          <div className="h-4 w-8 animate-pulse rounded-md bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function WeatherCard({ weather, location, isLoading }: WeatherCardProps) {
  if (isLoading) {
    return <WeatherSkeleton />;
  }

  if (!weather) {
    return (
      <div className="relative flex w-full flex-col rounded-2xl bg-white/5 p-4 backdrop-blur-sm backdrop-filter border border-white/10">
        <p className="text-white/70">Unable to load weather data</p>
      </div>
    );
  }

  const temperature = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(
    temperature + (weather.current.relative_humidity_2m > 70 ? 2 : -2)
  );

  return (
    <div className="relative flex w-full flex-col rounded-2xl bg-white/5 p-4 backdrop-blur-sm backdrop-filter border border-white/10">
      <div className="flex flex-1 flex-col gap-3 text-white/90">
        <p className="text-sm font-medium text-white/70">{location}</p>
        <div className="flex items-center gap-3">
          <CloudSunRain className="h-8 w-8 text-white/80" />
          <p className="text-4xl font-light">{temperature}°</p>
        </div>
        <p className="text-xs text-white/60">
          Feels like {feelsLike}° • Wind: {Math.round(weather.current.wind_speed_10m)} km/h
        </p>
      </div>
      <div className="mt-4 flex justify-between rounded-lg bg-white/5 px-3 py-2">
        <div className="flex items-center gap-1 text-sm text-white/80">
          <span>Humidity:</span>
          <span>{Math.round(weather.current.relative_humidity_2m)}%</span>
        </div>
      </div>
    </div>
  );
}
