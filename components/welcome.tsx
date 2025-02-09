import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import BentoGrid from "@/components/animata/bento-grid/gradient";
export default function Welcome() {
  const { user } = useUser();
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
      <div className="text-center relative z-10 mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome {user?.firstName || 'Guest'}!
        </h1>
      </div>
      {/* <BentoGrid /> */}
    </div>
  )
}