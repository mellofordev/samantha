import * as React from "react"
import { Play } from "lucide-react"
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Main Topic */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div>
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription className="text-lg mt-2">{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="mt-4 space-y-4">
                <h3 className="font-semibold text-lg">Quick Facts</h3>
                <ul className="space-y-2">
                  {facts.slice(0, 3).map((fact, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{fact.title}:</span> {fact.content}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </div>
          <div className="space-y-6">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className="w-full h-[300px] object-cover rounded-lg shadow-lg"
            />
            <div className="grid grid-cols-3 gap-4">
              {imageGallery.slice(0, 3).map((img, index) => (
                <img
                  key={index}
                  src={img || "/placeholder.svg"}
                  alt={`${title} gallery ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg shadow"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Related Topics */}
      <div className="grid md:grid-cols-3 gap-6">
        {relatedTopics.map((topic, index) => (
          <Card key={index} className="overflow-hidden">
            <img
              src={topic.imageUrl || "/placeholder.svg"}
              alt={topic.title}
              className="w-full h-48 object-cover"
            />
            <CardHeader>
              <CardTitle className="text-lg">{topic.title}</CardTitle>
              <CardDescription>{topic.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Video Section */}
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={videoResult.thumbnailUrl || "/placeholder.svg"}
            alt={videoResult.title}
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-16 h-16 text-white" />
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{videoResult.title}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

// export default function KnowledgeGraph({data}:any) {
//     return <div className="p-4 bg-muted rounded-xl">
//     <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
//       {/* Main Result */}
//       <Card className="col-span-3 row-span-2 overflow-hidden">
//         <CardHeader>
//           <CardTitle>{data.title}</CardTitle>
//           <CardDescription>{data.description}</CardDescription>
//         </CardHeader>
//         <CardContent>
//             <img
//               src={"https://assets.editorial.aetnd.com/uploads/2009/10/adolf-hitler-gettyimages-119505258.jpg"}
//               alt={"image"}
//               className="rounded-md object-cover"
//             />
//            {/* Related Topics */}
//            <div className="flex flex-wrap gap-2 mt-4">
//              {data.relatedTopics.map((topic:any, index:any) => (
//                <Button
//                  variant={'secondary'}
//                  key={index}
//                  className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
//                >
//                  {topic.title}
//                </Button>
//              ))}
//            </div>
//         </CardContent>
//       </Card>
//     </div>
//   </div>
// }