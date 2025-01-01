import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  publicRoutes: ['/', '/login', '/signup'], // Publicly accessible routes
  ignoredRoutes: ['/api/webhook'], // Routes to ignore
  async afterAuth(auth, req) {
    const { userId } = auth;

    // Redirect unauthenticated users trying to access `/write`
    if (req.nextUrl.pathname === '/write' && !userId) {
      const signInUrl = new URL('/login', req.nextUrl.origin);
      return Response.redirect(signInUrl);
    }
  },
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
