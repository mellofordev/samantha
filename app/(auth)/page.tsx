export default function Page() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-orange-500 to-green-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.15)_100%)]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Navigation Bar */}
        <nav className="w-full px-8 h-16 flex items-center justify-between border-b border-white/10">
          <div className="text-xl font-semibold text-white">Samantha</div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm text-white/90 hover:text-white">Features</a>
            <a href="#enterprise" className="text-sm text-white/90 hover:text-white">Enterprise</a>
            <a href="#blog" className="text-sm text-white/90 hover:text-white">Blog</a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/sign-in" className="text-sm text-white/90 hover:text-white">Sign In</a>
            <a href="/download" className="text-sm px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100">
              Try for free
            </a>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="max-w-[90rem] w-full mx-auto flex-1 grid grid-rows-[auto,1fr] gap-8 py-8">
            {/* Text Content */}
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-6xl font-bold text-white tracking-tight">
                Meet Samantha
              </h1>
              <p className="mt-4 text-lg text-white/90 font-mono">
                Explore knowledge through beautiful interactive visualizations.
              </p>
              <div className="mt-6">
                <a 
                  href="/dashboard" 
                  className="inline-flex items-center px-6 py-2.5 text-sm font-medium bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  Try for free
                </a>
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