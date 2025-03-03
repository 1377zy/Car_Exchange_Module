/**
 * Notification Sound Utilities
 * Handles playing notification sounds based on priorities and user preferences
 */

// Audio objects for different notification priorities
let audioCache = {};

// Default sound URLs
const DEFAULT_SOUNDS = {
  high: '/sounds/notification-high.mp3',
  normal: '/sounds/notification-normal.mp3',
  low: '/sounds/notification-low.mp3',
  custom: null
};

// User preferences
let soundPreferences = {
  enabled: true,
  volume: 0.7,
  customSounds: {}
};

/**
 * Initialize sound notifications
 * @param {Object} preferences - User sound preferences
 * @returns {boolean} Whether sound initialization was successful
 */
export const initNotificationSounds = (preferences = {}) => {
  try {
    // Update preferences
    soundPreferences = {
      ...soundPreferences,
      ...preferences
    };
    
    // Create audio objects for different notification priorities
    audioCache = {
      high: new Audio(soundPreferences.customSounds.high || DEFAULT_SOUNDS.high),
      normal: new Audio(soundPreferences.customSounds.normal || DEFAULT_SOUNDS.normal),
      low: new Audio(soundPreferences.customSounds.low || DEFAULT_SOUNDS.low)
    };
    
    // Add custom sounds if defined
    if (soundPreferences.customSounds.custom) {
      audioCache.custom = new Audio(soundPreferences.customSounds.custom);
    }
    
    // Preload audio files
    Object.values(audioCache).forEach(audio => {
      audio.load();
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing notification sounds:', error);
    return false;
  }
};

/**
 * Update sound preferences
 * @param {Object} preferences - New sound preferences
 */
export const updateSoundPreferences = (preferences = {}) => {
  const oldPreferences = { ...soundPreferences };
  
  // Update preferences
  soundPreferences = {
    ...soundPreferences,
    ...preferences
  };
  
  // Check if custom sounds have changed
  const customSoundsChanged = JSON.stringify(oldPreferences.customSounds) !== 
                             JSON.stringify(soundPreferences.customSounds);
  
  // Reinitialize sounds if custom sounds changed
  if (customSoundsChanged) {
    initNotificationSounds(soundPreferences);
  }
  
  return soundPreferences;
};

/**
 * Play a notification sound based on priority
 * @param {string} priority - Notification priority ('high', 'normal', 'low', 'custom')
 * @param {Object} options - Additional options
 * @param {number} options.volume - Volume level (0-1)
 * @param {boolean} options.loop - Whether to loop the sound
 * @param {number} options.duration - Duration to play in ms (for looping sounds)
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const playNotificationSound = async (priority = 'normal', options = {}) => {
  // If sounds are disabled, don't play anything
  if (!soundPreferences.enabled) {
    return false;
  }
  
  const { 
    volume = soundPreferences.volume, 
    loop = false,
    duration = 0
  } = options;
  
  try {
    // If audio not initialized, initialize it
    if (Object.keys(audioCache).length === 0) {
      initNotificationSounds();
    }
    
    // Get the appropriate audio based on priority
    const audio = audioCache[priority] || audioCache.normal;
    
    // Reset audio to beginning if it's already playing
    audio.pause();
    audio.currentTime = 0;
    
    // Set volume
    audio.volume = Math.min(1, Math.max(0, volume));
    
    // Set loop
    audio.loop = loop;
    
    // Play the sound
    const playPromise = audio.play();
    
    // If duration is set and loop is true, stop after duration
    if (loop && duration > 0) {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
      }, duration);
    }
    
    // Handle autoplay restrictions in browsers
    if (playPromise !== undefined) {
      return playPromise
        .then(() => true)
        .catch(error => {
          console.warn('Could not play notification sound:', error.message);
          return false;
        });
    }
    
    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};

/**
 * Play a test sound
 * @param {string} priority - Sound priority to test
 * @param {number} volume - Volume to test (0-1)
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const playTestSound = async (priority = 'normal', volume = soundPreferences.volume) => {
  return playNotificationSound(priority, { volume });
};

/**
 * Stop all notification sounds
 */
export const stopAllNotificationSounds = () => {
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
  });
};

/**
 * Stop a specific notification sound
 * @param {string} priority - Priority of sound to stop
 */
export const stopNotificationSound = (priority = 'normal') => {
  if (audioCache[priority]) {
    audioCache[priority].pause();
    audioCache[priority].currentTime = 0;
    audioCache[priority].loop = false;
  }
};

/**
 * Check if browser supports audio
 * @returns {boolean} Whether audio is supported
 */
export const isAudioSupported = () => {
  return typeof Audio !== 'undefined';
};

/**
 * Get current sound preferences
 * @returns {Object} Current sound preferences
 */
export const getSoundPreferences = () => {
  return { ...soundPreferences };
};

/**
 * Preload all notification sounds
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const preloadNotificationSounds = async () => {
  try {
    if (!isAudioSupported()) {
      return false;
    }
    
    // Initialize sounds if not already initialized
    if (Object.keys(audioCache).length === 0) {
      initNotificationSounds();
    }
    
    // Preload all sounds
    const preloadPromises = Object.values(audioCache).map(audio => {
      return new Promise((resolve) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.load();
      });
    });
    
    await Promise.all(preloadPromises);
    return true;
  } catch (error) {
    console.error('Error preloading notification sounds:', error);
    return false;
  }
};

export default {
  initNotificationSounds,
  updateSoundPreferences,
  playNotificationSound,
  playTestSound,
  stopAllNotificationSounds,
  stopNotificationSound,
  isAudioSupported,
  getSoundPreferences,
  preloadNotificationSounds
};
