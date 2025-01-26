import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KnowledgeGraphData } from "@/lib/schema/knowledge-graph"

export function KnowledgeGraphBento({
  title,
  description,
  imageUrl,
  relatedTopics,
  videoResult,
  imageGallery,
  facts,
}: KnowledgeGraphData) {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Hero Section */}
      <Card className="overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid md:grid-cols-5 gap-4 p-4">
          <div className="md:col-span-3">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {title}
              </CardTitle>
              <CardDescription className="text-lg font-medium text-gray-700">
                {description}
              </CardDescription>
            </CardHeader>
            
            {/* Quick Facts as Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {facts.slice(0, 3).map((fact, index) => (
                <div
                  key={index}
                  className="flex-1 min-w-[200px] p-3 rounded-xl bg-white shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="font-bold text-indigo-700 text-sm mb-1">
                    {fact.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {fact.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-3">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className="w-full h-48 object-cover rounded-xl shadow-md hover:shadow-xl transition-shadow"
            />
            <div className="grid grid-cols-3 gap-2">
              {imageGallery.slice(0, 3).map((img, index) => (
                <img
                  key={index}
                  src={img || "/placeholder.svg"}
                  alt={`${title} gallery ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Video Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videoResult?.slice(0, 3).map((video, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Related Topics as Interactive Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {relatedTopics.map((topic, index) => (
          <Card 
            key={index} 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-32">
              <img
                src={topic.imageUrl || "/placeholder.svg"}
                alt={topic.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <CardTitle className="absolute bottom-2 left-2 text-white text-lg">
                {topic.title}
              </CardTitle>
            </div>
            <CardContent className="p-3">
              <p className="text-sm text-gray-600 line-clamp-2">{topic.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}