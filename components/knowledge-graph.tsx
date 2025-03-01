"use client"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { WrigleDivider } from "@/components/ui/wrigle-divider"
export function KnowledgeGraphBento({
  title,
  description,
  imageUrl,
  relatedTopics,
  videoResult,
  imageGallery,
  quick_insights,
  search_results,
}: KnowledgeGraphData) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  return (
    <div className="w-full mx-auto p-4 pb-16 space-y-6 relative bg-white">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-md border border-white/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-blue-600 text-center">
            {title}
          </CardTitle>
          <div className="flex justify-center my-4">
            <WrigleDivider />
          </div>
          <CardDescription className="text-gray-600 text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Image Gallery */}
            <div className="mt-6 relative">
                <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                  {imageGallery.map((img, index) => (
                    <div key={index} className="flex-none w-72 relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                      <div className="relative bg-white rounded-lg overflow-hidden">
                        <div className="p-2 border-8 border-gray-200 rounded-md">
                          <img
                            src={img}
                            alt={`Image ${index + 1}`}
                            className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer rounded-md"
                            onClick={() => setSelectedImage(img)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {/* Facts Section - Redesigned to match mobile view */}
            <div className="space-y-3 mt-6">
              {quick_insights?.map((insight, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                  <div className="relative p-4 bg-white rounded-lg border-8 border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-xl">{insight.emoji}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Section */}
      <div className="mt-6 relative">
        <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
          {videoResult?.map((video, index) => (
            <div key={index} className="flex-none w-80 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white rounded-lg overflow-hidden">
                <div className="p-2 border-8 border-gray-200 rounded-md">
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full rounded-md"
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium line-clamp-2 text-gray-800">{video.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedTopics.map((topic, index) => (
          <div key={index} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
            <Card className="relative bg-white overflow-hidden border-0">
              <div className="relative h-48">
                <img
                  src={topic.imageUrl || "/placeholder.svg"}
                  alt={topic.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onClick={() => setSelectedImage(topic.imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <CardTitle className="absolute bottom-3 left-3 text-white text-lg font-semibold">
                  {topic.title}
                </CardTitle>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2">{topic.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        
        <DialogContent>
          <div className="flex flex-col gap-5 relative">
          <DialogTitle className="text-black/90 absolute top-4 left-4 z-10">
            </DialogTitle>
            <div className="p-6 mt-8">
              <img 
                src={selectedImage || "/placeholder.svg"} 
                alt="Preview"
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}