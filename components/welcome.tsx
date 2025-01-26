import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Welcome() {
  const { user } = useUser();
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-white animate-gradient bg-[length:200%_100%]" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             opacity: 0.05,
           }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-white animate-gradient bg-[length:200%_100%]" />
      <div className="text-center relative z-10 mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome {user?.firstName || 'Guest'}!
        </h1>
        <p className="text-white/80">
          Let's start your programming journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 px-4 max-w-6xl">
        <Card className="hover:scale-105 transition-transform">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Chapter 1</CardTitle>
            <CardDescription className="text-lg font-semibold text-gray-800">Programming Fundamentals</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-600 space-y-2">
              <li>• Variables and Data Types</li>
              <li>• Control Structures</li>
              <li>• Functions and Methods</li>
              <li>• Basic Input/Output</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Chapter 2</CardTitle>
            <CardDescription className="text-lg font-semibold text-gray-800">Data Structures</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-600 space-y-2">
              <li>• Arrays and Lists</li>
              <li>• Stacks and Queues</li>
              <li>• Dictionaries and Sets</li>
              <li>• Basic Algorithms</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Chapter 3</CardTitle>
            <CardDescription className="text-lg font-semibold text-gray-800">Object-Oriented Programming</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-600 space-y-2">
              <li>• Classes and Objects</li>
              <li>• Inheritance</li>
              <li>• Encapsulation</li>
              <li>• Polymorphism</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}