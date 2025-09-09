import { router } from 'expo-router';

// Define your app's routes
export const AppRoutes = {
  // Auth routes
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  
  // Main app routes
  WATCH: '/tabs/watch',
  LIBRARY: '/tabs/library',
  PROFILE: '/tabs/profile',
} as const;

// Type-safe navigation functions
export const navigate = {
  toLogin: () => router.replace(AppRoutes.LOGIN as any),
  toSignup: () => router.push(AppRoutes.SIGNUP as any),
  toWatch: (filmId?: string) => {
    const route = filmId ? `/tabs/watch?filmId=${filmId}` : AppRoutes.WATCH;
    router.replace(route as any);
  },
  toLibrary: () => router.push(AppRoutes.LIBRARY as any),
  toProfile: () => router.push(AppRoutes.PROFILE as any),
  
  // Generic navigation with type assertion
  to: (route: string) => router.push(route as any),
  replace: (route: string) => router.replace(route as any),
};