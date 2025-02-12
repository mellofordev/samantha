import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#181818]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-4 top-20 bg-gradient-to-r from-blue-500 to-white animate-gradient bg-[length:200%_100%] rounded-3xl">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: `url('/cloud_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.15,
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Navigation Bar */}
        <nav className="w-full px-8 h-16 flex items-center justify-between border-b border-dashed border-white/10">
          <div className="font-instrument-serif text-2xl text-white">
            AutoCompute
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
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <a
                href="/sign-in"
                className="text-sm text-white/90 hover:text-white"
              >
                Sign In
              </a>
              <Link href="/dashboard">
                <Button variant={"secondary"}>Try for free</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <Link href="https://wa.me/918075496634" target="_blank">
              <Button variant={"secondary"}>
                Contact us
              </Button>
            </Link>
            </SignedIn>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="max-w-[90rem] w-full mx-auto flex-1 grid grid-rows-[auto,1fr] gap-8 py-8">
            {/* Text Content */}
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-6xl font-bold text-white tracking-tight">
                Meet
                <span className="font-instrument-serif font-normal">
                  AutoCompute
                </span>
              </h1>
              <p className="mt-4 text-lg text-white/90">
              automatically controlling computer 
              </p>
              <div className="mt-6">
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant={"secondary"}>Try for free</Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button variant={"secondary"}>Go to Dashboard</Button>
                  </Link>
                </SignedIn>
              </div>
            </div>

            {/* Preview Section */}
            <div className="w-[650px] h-[400px] relative mx-auto rounded-xl overflow-hidden border border-white/20">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/hqJDKTqCESE"
                title="Samantha Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="relative w-full h-full object-cover z-10"
              ></iframe>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
