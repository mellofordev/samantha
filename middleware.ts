import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)', '/','/api/webhooks(.*)','/api/chat(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const {userId} = await auth()
  
  if(userId && isPublicRoute(request)){
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',  
  ],
}