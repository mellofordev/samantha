import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import BentoGrid from "@/components/animata/bento-grid/gradient";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WrigleDivider } from "./ui/wrigle-divider";

// Define the features to display in the carousel
const features = [
  {
    title: "Context aware",
    description: "Samanantha remembers your conversation and can retrieve information from past sessions.",
    image:"/context.png"
  },
  {
    title: "Quick Search",
    description: "Press Command+K (Mac) or Ctrl+K (Windows) to instantly search for anything you need",
    image:"/search.png"
  },
  {
    title: "Browser agent",
    description: "Tell some task to do , it will open up new tab and does it for you, requires chrome and our browser extension to be installed to work",
    image:"/agent.png"
  }
];

export default function Welcome() {
  const { user } = useUser();
  const currentHour = new Date().getHours();
  const isNightOrEvening = currentHour >= 17 || currentHour < 6;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const nextFeature = () => {
    setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/cloud2.avif')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: isNightOrEvening ? "brightness(0.6)" : "none",
        }}
      />
      {/* Grain noise filter overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("/noise.png")`,
        }}
      />
      
      {/* New Updates button */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="rounded-3xl"
        >
          <Info className="h-4 w-4" />
          <span>features</span>
        </Button>
      </div>
      
      <div className="text-center relative z-10">
        <h1 className={`text-4xl font-instrument-serif mb-2 ${isNightOrEvening ? 'text-white' : 'text-gray-800'}`}>
          Welcome {user?.firstName || 'Guest'}!
        </h1>
      {/* <BentoGrid /> */}
      </div>
      
      {/* Features Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-6 md:p-8 text-white max-h-[85vh] overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="flex flex-col items-center">
              <DialogTitle className="text-center text-2xl font-light font-instrument-serif">New Features</DialogTitle>
              <WrigleDivider />
            </div>
          </DialogHeader>
          
          <div className="relative overflow-hidden py-4">
            {/* Carousel */}
            <div 
              className="transition-all duration-500 ease-in-out flex"
              style={{ transform: `translateX(-${currentFeatureIndex * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-6 md:px-8">
                  <div className="text-center space-y-6">
                    <div className="h-[35vh] max-h-[280px]">
                      <img src={feature.image} alt={feature.title} className="w-full h-full object-cover mx-auto rounded-lg shadow-lg" />
                    </div>
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation dots */}
            <div className="flex justify-center mt-6 space-x-3">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentFeatureIndex === index 
                      ? "bg-[rgba(194,202,194,0.7)] w-5" 
                      : "bg-gray-300"
                  )}
                  onClick={() => setCurrentFeatureIndex(index)}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between mt-6 px-4">
              <Button 
                onClick={prevFeature}
                className="h-10 w-10 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                onClick={nextFeature}
                className="h-10 w-10 rounded-full"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}