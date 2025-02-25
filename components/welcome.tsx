import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import BentoGrid from "@/components/animata/bento-grid/gradient";
export default function Welcome() {
  const { user } = useUser();
  const currentHour = new Date().getHours();
  const isNightOrEvening = currentHour >= 17 || currentHour < 6;
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
      <div className="text-center mb-12 relative z-10">
        <h1 className={`text-4xl font-instrument-serif mb-2 text-gray-800`}>
          Welcome {user?.firstName || 'Guest'}!
        </h1>
      {/* <BentoGrid /> */}
      </div>
    </div>
  )
}