import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  StatusBar,
  FlatList,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Clip {
  id: string;
  title: string;
  hlsUrl: string;
  duration: number;
  order: number;
}

interface VerticalVideoPlayerProps {
  clips: Clip[];
  initialClipIndex: number;
  onClipChange: (clipIndex: number) => void;
  onProgress: (clipIndex: number, currentTime: number, duration: number) => void;
  filmTitle: string;
}

interface VideoItemProps {
  clip: Clip;
  isVisible: boolean;
  clipIndex: number;
  totalClips: number;
  filmTitle: string;
  onProgress: (currentTime: number, duration: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Individual video item component
const VideoItem: React.FC<VideoItemProps> = ({ 
  clip, 
  isVisible, 
  clipIndex, 
  totalClips, 
  filmTitle,
  onProgress 
}) => {
  const [paused, setPaused] = useState(!isVisible);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<Video>(null);

  // Pause/play based on visibility
  useEffect(() => {
    setPaused(!isVisible);
  }, [isVisible]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (paused) {
        await videoRef.current.playAsync();
      } else {
        await videoRef.current.pauseAsync();
      }
      setPaused(!paused);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoaded(true);
      const currentTimeSeconds = status.positionMillis / 1000;
      const durationSeconds = status.durationMillis / 1000;
      
      setCurrentTime(currentTimeSeconds);
      setDuration(durationSeconds);
      setPaused(!status.isPlaying);
      
      // Call progress callback
      onProgress(currentTimeSeconds, durationSeconds);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.videoItem}>
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: clip.hlsUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={!paused && isVisible}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading Indicator */}
        {!isLoaded && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Play/Pause Button - Always visible but subtle */}
        <View style={styles.playButtonContainer}>
          <TouchableOpacity
            style={[styles.playButton, paused && styles.playButtonVisible]}
            onPress={togglePlayPause}
          >
            <Ionicons 
              name={paused ? 'play' : 'pause'} 
              size={60} 
              color="rgba(255, 255, 255, 0.8)" 
            />
          </TouchableOpacity>
        </View>

        {/* Right Side Info Panel */}
        <View style={styles.rightPanel}>
          {/* Clip Counter */}
          <View style={styles.clipCounter}>
            <Text style={styles.clipCounterText}>
              {clipIndex + 1}/{totalClips}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.verticalProgressContainer}>
            <View style={styles.verticalProgressBar}>
              <View 
                style={[
                  styles.verticalProgressFill, 
                  { height: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Bottom Info Panel */}
        <View style={styles.bottomPanel}>
          <View style={styles.clipInfo}>
            <Text style={styles.filmTitle}>{filmTitle}</Text>
            <Text style={styles.clipTitle}>{clip.title}</Text>
            <Text style={styles.timeInfo}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Swipe Instructions (show briefly) */}
        {showControls && (
          <View style={styles.swipeInstructions}>
            <Text style={styles.swipeText}>
              Swipe up/down to change clips
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Main vertical video player component
export default function VerticalVideoPlayer({
  clips,
  initialClipIndex,
  onClipChange,
  onProgress,
  filmTitle,
}: VerticalVideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialClipIndex);
  const flatListRef = useRef<FlatList>(null);

  // Viewability config - video is considered viewable when 70% visible
  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 100,
  };

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index!;
      setCurrentIndex(newIndex);
      onClipChange(newIndex);
    }
  };

  // Handle progress for the current clip
  const handleProgress = (currentTime: number, duration: number) => {
    onProgress(currentIndex, currentTime, duration);
  };

  const renderVideoItem = ({ item, index }: { item: Clip; index: number }) => {
    return (
      <VideoItem
        clip={item}
        isVisible={index === currentIndex}
        clipIndex={index}
        totalClips={clips.length}
        filmTitle={filmTitle}
        onProgress={handleProgress}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <FlatList
        ref={flatListRef}
        data={clips}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        initialScrollIndex={initialClipIndex}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoItem: {
    width: screenWidth,
    height: screenHeight,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 50,
    padding: 20,
    opacity: 0,
    pointerEvents: 'auto',
  },
  playButtonVisible: {
    opacity: 1,
  },
  rightPanel: {
    position: 'absolute',
    right: 15,
    top: 100,
    bottom: 150,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clipCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clipCounterText: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verticalProgressContainer: {
    width: 4,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  verticalProgressBar: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  verticalProgressFill: {
    width: '100%',
    backgroundColor: '#e50914',
    borderRadius: 2,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 80,
  },
  clipInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    borderRadius: 10,
  },
  filmTitle: {
    color: '#e50914',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clipTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timeInfo: {
    color: '#ccc',
    fontSize: 14,
  },
  swipeInstructions: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  swipeText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
  },
});