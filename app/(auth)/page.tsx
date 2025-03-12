import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import Image from "next/image";
export default function Page() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#181818]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-4 top-20 bg-gradient-to-r from-blue-500 to-white animate-gradient bg-[length:200%_100%] rounded-3xl">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: `url('/cloud2.avif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: `url("/noise.png")`,
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Navigation Bar */}
        <nav className="w-full px-4 sm:px-8 h-16 flex items-center justify-between border-b border-dashed border-white/10">
          <div className="font-instrument-serif text-xl sm:text-2xl text-white flex items-center gap-2">
            <Image src="/logo.svg" alt="AutoCompute" width={32} height={32} draggable={false} />
            <span className="text-white">samantha</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a
              href="#features"
              className="text-sm text-white/90 hover:text-white"
            >
              Features
            </a>
            <a href="#blog" className="text-sm text-white/90 hover:text-white">
              Blog
            </a>
            <a href="#blog" className="text-sm text-white/90 hover:text-white">
              Education
            </a>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <SignedOut>
              <a
                href="/sign-in"
                className="text-sm text-white/90 hover:text-white"
              >
                Sign In
              </a>
              <Link href="/dashboard">
                <Button variant={"default"} className="text-sm sm:text-base">Try for free</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <Link href="https://wa.me/918075496634" target="_blank">
                <Button variant={'default'} className="text-sm sm:text-base">
                  Contact us
                </Button>
              </Link>
            </SignedIn>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
          <div className="max-w-[90rem] w-full mx-auto flex-1 grid grid-rows-[auto,1fr] gap-4 sm:gap-8 py-4 sm:py-8">
            {/* Text Content */}
            <div className="max-w-2xl mx-auto text-center px-4">
              <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mt-10">
                Meet
                <span className="font-instrument-serif font-normal">
                  {" "}samantha
                </span>
              </h1>
              <p className="mt-2 sm:mt-4 text-base sm:text-lg text-white/90">
                automatically controlling computer 
              </p>
              <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-4">
                <SignedOut>
                  <Link href="/sign-in" className="w-full sm:w-auto">
                    <Button variant={"default"} className="w-full sm:w-auto">Try for free</Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant={"default"} className="w-full sm:w-auto rounded-lg">Go to Dashboard</Button>
                  </Link>
                </SignedIn>
                <HeroVideoDialog 
                  videoSrc="https://www.youtube.com/embed/hqJDKTqCESE" 
                  thumbnailSrc="https://mediaproxy.salon.com/width/1200/https://media2.salon.com/2013/12/her2.jpg" 
                  className="w-full sm:w-[650px] h-[250px] sm:h-[400px] mt-4"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
