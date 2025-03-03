/**
 * Audio Utilities for Notifications
 * Handles playing notification sounds based on priority
 */

// Audio objects for different notification sounds
let normalNotificationSound = null;
let highNotificationSound = null;
let lowNotificationSound = null;

// Initialize audio objects
const initializeAudio = () => {
  // Create audio objects if they don't exist
  if (!normalNotificationSound) {
    normalNotificationSound = new Audio('/sounds/notification-normal.mp3');
    normalNotificationSound.preload = 'auto';
  }
  
  if (!highNotificationSound) {
    highNotificationSound = new Audio('/sounds/notification-high.mp3');
    highNotificationSound.preload = 'auto';
  }
  
  if (!lowNotificationSound) {
    lowNotificationSound = new Audio('/sounds/notification-low.mp3');
    lowNotificationSound.preload = 'auto';
  }
};

/**
 * Play notification sound based on priority
 * @param {string} priority - Notification priority (high, normal, low)
 */
export const playNotificationSound = (priority = 'normal') => {
  // Initialize audio if not already done
  initializeAudio();
  
  // Get the appropriate sound based on priority
  let sound;
  
  switch (priority) {
    case 'high':
      sound = highNotificationSound;
      break;
    case 'normal':
      sound = normalNotificationSound;
      break;
    case 'low':
      sound = lowNotificationSound;
      break;
    default:
      sound = normalNotificationSound;
  }
  
  // Play the sound
  if (sound) {
    // Reset to beginning if already playing
    sound.pause();
    sound.currentTime = 0;
    
    // Play the sound
    sound.play().catch(error => {
      // This usually happens when the user hasn't interacted with the page yet
      console.warn('Could not play notification sound:', error);
    });
  }
};

/**
 * Set volume for all notification sounds
 * @param {number} volume - Volume level (0-1)
 */
export const setNotificationVolume = (volume) => {
  // Initialize audio if not already done
  initializeAudio();
  
  // Ensure volume is between 0 and 1
  const safeVolume = Math.max(0, Math.min(1, volume));
  
  // Set volume for all sounds
  if (normalNotificationSound) normalNotificationSound.volume = safeVolume;
  if (highNotificationSound) highNotificationSound.volume = safeVolume;
  if (lowNotificationSound) lowNotificationSound.volume = safeVolume;
};

/**
 * Mute all notification sounds
 */
export const muteNotificationSounds = () => {
  setNotificationVolume(0);
};

/**
 * Unmute notification sounds (set to default volume)
 */
export const unmuteNotificationSounds = () => {
  setNotificationVolume(0.7); // Default volume
};

/**
 * Check if browser supports audio playback
 * @returns {boolean} Whether audio is supported
 */
export const isAudioSupported = () => {
  return typeof Audio !== 'undefined';
};

/**
 * Preload all notification sounds
 * This can be called on app initialization to ensure sounds are ready
 */
export const preloadNotificationSounds = () => {
  initializeAudio();
};

export default {
  playNotificationSound,
  setNotificationVolume,
  muteNotificationSounds,
  unmuteNotificationSounds,
  isAudioSupported,
  preloadNotificationSounds
};
