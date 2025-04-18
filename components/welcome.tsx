import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, BugIcon, Info } from "lucide-react";
import {  useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WrigleDivider } from "./ui/wrigle-divider";
import Link from "next/link";
// Define the features to display in the carousel
const features = [
  {
    title: "Context aware",
    description: "Samanantha remembers your conversation and can retrieve information from past sessions.",
    image:"/context.png"
  },
  {
    title: "Realtime search",
    description: "Samantha automatically searches the web for you when you ask a question",
    image:"/search.png"
  },
  {
    title: "Screen share",
    description: "You can share your screen with Samantha and she will help you with any thing",
    image:"/screen.png"
  }
];

export default function Welcome({messages}:{messages:any}) {
  const { user } = useUser();
  const currentHour = new Date().getHours();
  const isNightOrEvening = currentHour >= 17 || currentHour < 6;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlphaDialogOpen, setIsAlphaDialogOpen] = useState(false);
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
          // filter: isNightOrEvening ? "brightness(0.6)" : "none",
        }}
      />
      {/* Grain noise filter overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("/noise.png")`,
        }}
      />
      
      {/* Buttons in top right */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <Button 
          className="rounded-3xl"
          onClick={() => setIsAlphaDialogOpen(true)}
        >
          <BugIcon className="h-4 w-4" />
          report bug
        </Button>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="rounded-3xl"
        >
          <Info className="h-4 w-4" />
          <span>features</span>
        </Button>
      </div>
      
      <div className="text-pretty relative z-10 p-6">
        <h1 className={`text-4xl font-instrument-serif mb-2 ${isNightOrEvening ? 'text-white' : 'text-gray-800'}`}>
          {
            messages?.length > 0 
              ? (messages[messages.length - 1].role === "assistant" 
                  ? messages[messages.length - 1].content 
                  : ""
              )
              : "Welcome " + (user?.firstName || 'Guest') + "!"
          }
        </h1>
      {/* <BentoGrid /> */}
      </div>
      {
        !user && (
          <div className="flex flex-row justify-center items-center gap-4">
            <Button className="rounded-3xl"><Link href="/login">Login</Link></Button>
            <Button className="rounded-3xl"><Link href="/signup">Signup</Link></Button>
          </div>
        )
      }
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

      {/* Alpha Version Dialog */}
      <Dialog open={isAlphaDialogOpen} onOpenChange={setIsAlphaDialogOpen}>
        <DialogContent className="p-6 md:p-8 text-white max-h-[85vh] overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="flex flex-col items-center">
              <DialogTitle className="text-center text-2xl font-light font-instrument-serif">samantha v0.1.0-alpha</DialogTitle>
              <WrigleDivider />
            </div>
          </DialogHeader>
          
          <div className="relative overflow-hidden py-4 px-6 md:px-8">
            <div className="text-center space-y-6">
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                You are currently using Samantha Alpha v0.1.0. This is an early release version with limited functionality.
              </p>
              
              <div className="space-y-4">
                <p className="text-gray-400">
                  For reporting issues or providing feedback, please email us at:
                </p>
                <a 
                  href="mailto:contact@mellohq.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray hover:underline block"
                >
                  contact@mellohq.in
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}