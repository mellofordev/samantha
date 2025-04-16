import { create } from 'zustand';

export interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
}

interface WeatherStoreState {
  weather: WeatherData | null;
  location: string;
  coordinates: { latitude: number; longitude: number } | null;
  isLoadingWeather: boolean;
  setWeather: (weather: WeatherData | null) => void;
  setLocation: (location: string) => void;
  setCoordinates: (coords: { latitude: number; longitude: number } | null) => void;
  setIsLoadingWeather: (isLoading: boolean) => void;
}

export const useWeatherStore = create<WeatherStoreState>((set) => ({
  weather: null,
  location: 'Loading location...',
  coordinates: null,
  isLoadingWeather: true,
  setWeather: (weather) => set({ weather }),
  setLocation: (location) => set({ location }),
  setCoordinates: (coordinates) => set({ coordinates }),
  setIsLoadingWeather: (isLoadingWeather) => set({ isLoadingWeather }),
})); 