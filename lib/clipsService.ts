import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Clip {
  id: string;
  title: string;
  hlsUrl: string;
  duration: number;
  order: number;
  isPremium?: boolean;
}

export interface Film {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  clips: Clip[];
  currentClipIndex: number;
  lastWatchedAt: string;
  totalClips: number;
  freeClipLimit: number;
  isPremium?: boolean;
}

export interface WatchProgress {
  filmId: string;
  currentClipIndex: number;
  currentTime: number;
  lastWatchedAt: string;
  userId: string;
}

class ClipsService {
  private static readonly STORAGE_KEY = 'tinky_watch_progress';

  // Get user's watch progress from local storage
  async getLocalProgress(filmId: string): Promise<WatchProgress | null> {
    try {
      const stored = await AsyncStorage.getItem(`${ClipsService.STORAGE_KEY}_${filmId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading local progress:', error);
      return null;
    }
  }

  // Save user's watch progress locally
  async saveLocalProgress(progress: WatchProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${ClipsService.STORAGE_KEY}_${progress.filmId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Error saving local progress:', error);
    }
  }

  // Sync progress with Supabase (for authenticated users)
  async syncProgressToCloud(progress: WatchProgress): Promise<void> {
    try {
      const { error } = await supabase
        .from('watch_progress')
        .upsert({
          user_id: progress.userId,
          film_id: progress.filmId,
          current_clip_index: progress.currentClipIndex,
          playback_time: progress.currentTime,
          last_watched_at: progress.lastWatchedAt,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error syncing progress to cloud:', error);
      }
    } catch (error) {
      console.error('Error syncing progress to cloud:', error);
    }
  }

  // Get progress from cloud (for authenticated users)
  async getCloudProgress(userId: string, filmId: string): Promise<WatchProgress | null> {
    try {
      const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('film_id', filmId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        filmId: data.film_id,
        currentClipIndex: data.current_clip_index,
        currentTime: data.playback_time,
        lastWatchedAt: data.last_watched_at,
        userId: data.user_id,
      };
    } catch (error) {
      console.error('Error getting cloud progress:', error);
      return null;
    }
  }

  // Get combined progress (cloud + local)
  async getWatchProgress(userId: string | null, filmId: string): Promise<WatchProgress | null> {
    // Try cloud first if user is authenticated
    if (userId) {
      const cloudProgress = await this.getCloudProgress(userId, filmId);
      if (cloudProgress) {
        return cloudProgress;
      }
    }

    // Fall back to local storage
    return this.getLocalProgress(filmId);
  }

  // Save progress both locally and to cloud
  async saveWatchProgress(progress: WatchProgress): Promise<void> {
    // Always save locally for offline access
    await this.saveLocalProgress(progress);

    // Sync to cloud if user is authenticated
    if (progress.userId) {
      await this.syncProgressToCloud(progress);
    }
  }

  // Get all films from Supabase
  async getAllFilms(): Promise<Film[]> {
    try {
      const { data: films, error } = await supabase
        .from('films')
        .select(`
          id,
          title,
          description,
          cover_url,
          is_published,
          clips (
            id,
            title,
            hls_url,
            duration_sec,
            idx,
            is_free_preview
          )
        `)
        .eq('is_published', true)

      if (error) {
        console.error('Error fetching films:', error);
        return [];
      }

      if (!films || films.length === 0) {
        console.log('No published films found');
        return [];
      }

      return films.map((film: any) => {
        const clips = film.clips || [];
        const sortedClips = clips
          .sort((a: any, b: any) => a.idx - b.idx)
          .map((clip: any) => ({
            id: clip.id,
            title: clip.title || 'Untitled Clip',
            hlsUrl: clip.hls_url || '',
            duration: clip.duration_sec || 0,
            order: clip.idx || 0,
            isPremium: !clip.is_free_preview,
          }));

        // Count free clips (where is_free_preview = true)
        const freeClipCount = clips.filter((clip: any) => clip.is_free_preview === true).length;

        return {
          id: film.id,
          title: film.title || 'Untitled Film',
          description: film.description || '',
          coverImageUrl: film['cover-url'] || '',
          totalClips: clips.length,
          freeClipLimit: freeClipCount,
          isPremium: false,
          currentClipIndex: 0,
          lastWatchedAt: new Date().toISOString(),
          clips: sortedClips,
        };
      });
    } catch (error) {
      console.error('Error fetching films:', error);
      return [];
    }
  }

  // Get specific film with clips from Supabase
  async getFilm(filmId: string): Promise<Film | null> {
    try {
      const { data, error } = await supabase
        .from('films')
        .select(`
          id,
          title,
          description,
          cover_url,
          is_published,
          clips (
            id,
            title,
            hls_url,
            duration_sec,
            idx,
            is_free_preview
          )
        `)
        .eq('id', filmId)
        .eq('is_published', true)
        .single();

      if (error || !data) {
        console.error('Error fetching film:', error);
        return null;
      }

      const film: any = data;
      const clips = film.clips || [];
      const sortedClips = clips
        .sort((a: any, b: any) => a.idx - b.idx)
        .map((clip: any) => ({
          id: clip.id,
          title: clip.title || 'Untitled Clip',
          hlsUrl: clip.hls_url || '',
          duration: clip.duration_sec || 0,
          order: clip.idx || 0,
          isPremium: !clip.is_free_preview,
        }));

      // Count free clips (where is_free_preview = true)
      const freeClipCount = clips.filter((clip: any) => clip.is_free_preview === true).length;

      return {
        id: film.id,
        title: film.title || 'Untitled Film',
        description: film.description || '',
        coverImageUrl: film['cover_url'] || '',
        totalClips: clips.length,
        freeClipLimit: freeClipCount,
        isPremium: false,
        currentClipIndex: 0,
        lastWatchedAt: new Date().toISOString(),
        clips: sortedClips,
      };
    } catch (error) {
      console.error('Error fetching film:', error);
      return null;
    }
  }

  // Check if user can access a specific clip (based on payment/premium status)
  canAccessClip(film: Film, clipIndex: number, userHasPremium: boolean = false): boolean {
    const clip = film.clips[clipIndex];
    if (!clip) return false;

    // If clip is not premium, user can always access it
    if (!clip.isPremium) return true;

    // If user has premium access, they can access premium clips
    if (userHasPremium) return true;

    // For free users, check if they're within the free clip limit
    return clipIndex < film.freeClipLimit;
  }

  // Get current clip based on progress
  getCurrentClip(film: Film, progress?: WatchProgress | null): Clip | null {
    const clipIndex = progress?.currentClipIndex || 0;
    return film.clips[clipIndex] || null;
  }

  // Check if user can go to next clip
  canGoToNextClip(film: Film, currentClipIndex: number): boolean {
    return currentClipIndex < film.clips.length - 1;
  }

  // Check if user can go to previous clip
  canGoToPreviousClip(currentClipIndex: number): boolean {
    return currentClipIndex > 0;
  }

  // Get next clip index
  getNextClipIndex(currentIndex: number, totalClips: number): number {
    return Math.min(currentIndex + 1, totalClips - 1);
  }

  // Get previous clip index
  getPreviousClipIndex(currentIndex: number): number {
    return Math.max(currentIndex - 1, 0);
  }
}

export const clipsService = new ClipsService();