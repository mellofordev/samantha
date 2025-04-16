"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useRef, useState, useEffect } from "react";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { prompt } from "@/lib/prompt_helpers/prompt";
import { web_search, conversation, add_folder } from "@/lib/schema/function-call";
import { UserButton, useUser } from "@clerk/nextjs";
import { Inter } from 'next/font/google';
import WeatherCard, { WeatherData } from "./animata/widget/weather-card";
import { Folder, FolderItem } from "./ui/folder";
import { Book, Sparkle, FolderIcon, Paintbrush, Search, Clock, Trash, Edit, MoreVertical } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";
import { getUserPreference, saveUserLocation, getSearchHistory, getFolders, deleteFolder, renameFolder } from "@/app/actions/backend";
import { generateWebSearch } from "@/app/actions/ai-agent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useWeatherStore } from "@/contexts/weather-store";
const inter = Inter({ 
  weight: '700',
  subsets: ['latin'],
});

export function AppSidebar() {
  const { setConfig } = useLiveAPIContext();
  const { user } = useUser();
  
  const { weather, location, coordinates, isLoadingWeather, setWeather, setLocation, setCoordinates, setIsLoadingWeather } = useWeatherStore();
  const [userPreference, setUserPreference] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [folderToRename, setFolderToRename] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  
  const loadUserPreference = async () => {
    const userPreference = await getUserPreference();
    if (userPreference) {
      setUserPreference(userPreference);
    }
  }
  
  // Add function to load search history and folders
  const loadHistoryAndFolders = async () => {
    try {
      const history = await getSearchHistory(5); // Get the 5 most recent searches
      setSearchHistory(history || []);
      
      const userFolders = await getFolders();
      setFolders(userFolders || []);
    } catch (error) {
      console.error("Error loading history and folders:", error);
    }
  };
  
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
          const locationName = geoData.city || geoData.locality || 'Unknown location';
          setLocation(locationName);
          await saveUserLocation(locationName);
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
    loadUserPreference();
    loadHistoryAndFolders();
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
            text: prompt(
              user?.fullName || 'User', 
              {
                weather: weather ? {
                  temperature: Math.round(weather.current.temperature_2m),
                  humidity: Math.round(weather.current.relative_humidity_2m),
                  windSpeed: Math.round(weather.current.wind_speed_10m),
                  location: location,
                } : undefined,
                userPreference: userPreference
              },
            ),
          },
        ],
      },
      tools: [
        { functionDeclarations: [web_search, conversation, add_folder] },
      ],
    });
  }, [setConfig, user, weather, location]);

  // Function to handle search history item click
  const handleSearchHistoryClick = async (query: string, savedResult?: string) => {
    try {
      // If we have a saved result, parse it and use it directly
      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult);
          // Dispatch an event to notify the dashboard to update the knowledge graph
          const event = new CustomEvent('renderKnowledgeGraph', { 
            detail: { data: parsedResult } 
          });
          window.dispatchEvent(event);
          return;
        } catch (parseError) {
          console.error("Error parsing saved result:", parseError);
          // If parsing fails, continue to regenerate the result
        }
      }
      
      // If no saved result or parsing failed, regenerate the knowledge graph
      setIsLoadingSearch(true);
      const response = await generateWebSearch(query);
      
      // Dispatch an event to notify the dashboard to update the knowledge graph
      const event = new CustomEvent('renderKnowledgeGraph', { 
        detail: { data: response } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error handling search history click:", error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Add function to refresh folders
  const refreshFolders = async () => {
    try {
      const userFolders = await getFolders();
      setFolders(userFolders || []);
    } catch (error) {
      console.error("Error refreshing folders:", error);
    }
  };
  
  // Listen for folder creation events
  useEffect(() => {
    const handleFolderCreated = () => {
      refreshFolders();
    };
    
    // Add event listener
    window.addEventListener('folderCreated', handleFolderCreated);
    
    // Clean up
    return () => {
      window.removeEventListener('folderCreated', handleFolderCreated);
    };
  }, []);

  // Add function to handle file click
  const handleFileClick = (file: any) => {
    try {
      if (!file || !file.json_content) {
        console.error("Invalid file or missing content");
        return;
      }
      
      // Handle click on file
      
      let content;
      try {
        content = JSON.parse(file.json_content);
      } catch (parseError) {
        console.error("Error parsing file content:", parseError);
        return;
      }
      
      if (file.file_type === 'url' && content.url) {
        // Open URL in new tab
        window.open(content.url, '_blank');
      } else if (file.file_type === 'knowledge_graph') {
        // Validate knowledge graph structure
        if (!validateKnowledgeGraphStructure(content)) {
          console.error("Invalid knowledge graph structure:", content);
          return;
        }
        
        // Dispatch event to render knowledge graph
        const event = new CustomEvent('renderKnowledgeGraph', { 
          detail: { data: content } 
        });
        window.dispatchEvent(event);
      } else {
        // Unknown file type
      }
    } catch (error) {
      console.error("Error handling file click:", error);
    }
  };
  
  // Helper function to validate knowledge graph structure
  const validateKnowledgeGraphStructure = (data: any) => {
    // Check for required fields
    const requiredFields = [
      'title', 
      'description', 
      'imageUrl', 
      'relatedTopics', 
      'videoResult', 
      'imageGallery', 
      'search_results'
    ];
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
      
      // Check that arrays are actually arrays
      if (['relatedTopics', 'videoResult', 'imageGallery', 'search_results'].includes(field)) {
        if (!Array.isArray(data[field])) {
          console.error(`Field ${field} should be an array`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Add function to handle folder deletion
  const handleDeleteFolder = async (folderId: string) => {
    try {
      setIsDeletingFolder(true);
      const result = await deleteFolder(folderId);
      if (result) {
        refreshFolders();
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setIsDeletingFolder(false);
    }
  };
  
  // Add function to handle folder renaming
  const handleRenameFolder = async () => {
    if (!folderToRename || !newFolderName.trim()) return;
    
    try {
      setIsRenamingFolder(true);
      const result = await renameFolder(folderToRename.id, newFolderName);
      if (result) {
        refreshFolders();
        setFolderToRename(null);
        setNewFolderName("");
      }
    } catch (error) {
      console.error("Error renaming folder:", error);
    } finally {
      setIsRenamingFolder(false);
    }
  };
  
  return (
    <Sidebar className="dark text-white border-r border-white/10 border-dashed">
      <SidebarHeader className="flex flex-row justify-between items-center p-4 m-2">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AutoCompute" width={32} height={32} draggable={false} />
        </div>
        <UserButton  />
      </SidebarHeader>
      <hr className="border-white/10 border-dashed" />
      <SidebarContent>
        <ContextMenu>
          <ContextMenuTrigger className="flex flex-col w-full h-full">
            <div className="p-3 space-y-3">
              {/* Search History Folder */}
              <Folder 
                title="Recent Searches" 
                defaultOpen={true}
                icon={<Search className="h-4 w-4" />}
              >
                {isLoadingSearch ? (
                  <FolderItem 
                    icon={<Clock className="h-4 w-4 animate-spin" />}
                    label="Loading..." 
                  />
                ) : searchHistory.length > 0 ? (
                  searchHistory.map((item, index) => (
                    <FolderItem 
                      key={item.id || index}
                      icon={<Clock className="h-4 w-4" />}
                      label={item.query.length > 25 ? `${item.query.substring(0, 25)}...` : item.query}
                      onClick={() => handleSearchHistoryClick(item.query, item.result)}
                    />
                  ))
                ) : (
                  <FolderItem 
                    icon={<Clock className="h-4 w-4" />}
                    label="No recent searches" 
                  />
                )}
              </Folder>
              
              {/* User Folders */}
              {folders.map((folder) => (
                <ContextMenu key={folder.id}>
                  <ContextMenuTrigger>
                    <Folder
                      title={folder.folder_name}
                      defaultOpen={false}
                      icon={<FolderIcon className="h-4 w-4" />}
                    >
                      {folder.files && folder.files.length > 0 ? (
                        folder.files.map((file: any) => (
                          <FolderItem
                            key={file.id}
                            icon={file.file_type === 'url' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                              </svg>
                            )}
                            label={file.file_name}
                            onClick={() => handleFileClick(file)}
                          />
                        ))
                      ) : (
                        <FolderItem
                          icon={<FolderIcon className="h-4 w-4" />}
                          label="Empty folder"
                        />
                      )}
                    </Folder>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem 
                      onClick={() => {
                        setFolderToRename(folder);
                        setNewFolderName(folder.folder_name);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Rename</span>
                    </ContextMenuItem>
                    <ContextMenuItem 
                      className="flex items-center gap-2 cursor-pointer hover:bg-white/10 text-red-400"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-60 h-full">
            <ContextMenuItem className="rounded-md hover:bg-[rgba(75,75,75,0.7)] focus:bg-[rgba(75,75,75,0.7)] transition-colors">
              <FolderIcon className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem className="rounded-md hover:bg-[rgba(75,75,75,0.7)] focus:bg-[rgba(75,75,75,0.7)] transition-colors">
              <Sparkle className="mr-2 h-4 w-4" />
              New Task
            </ContextMenuItem>
            <ContextMenuItem className="rounded-md hover:bg-[rgba(75,75,75,0.7)] focus:bg-[rgba(75,75,75,0.7)] transition-colors">
              <Paintbrush className="mr-2 h-4 w-4" />
              Customize
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </SidebarContent>
      
      {/* Rename Folder Dialog */}
      {folderToRename && (
        <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
          <DialogContent className="sm:max-w-md p-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl text-white">Rename Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 shadow-none"
              />
              <div className="flex justify-between gap-3 mt-4">
                <Button 
                  onClick={() => setFolderToRename(null)}
                  variant="outline"
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRenameFolder} 
                  disabled={isRenamingFolder || !newFolderName.trim()}
                  className="w-1/2"
                >
                  {isRenamingFolder ? "Renaming..." : "Rename"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
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
