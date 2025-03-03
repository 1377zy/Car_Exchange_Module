/**
 * Sound Utilities
 * Handles playing notification sounds
 */

// Audio context for playing sounds
let audioContext = null;

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
    }
  }
  return audioContext;
};

/**
 * Play a notification sound
 * @param {string} priority - Priority of the notification ('high', 'normal', 'low')
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<boolean>} Whether sound was played successfully
 */
export const playNotificationSound = async (priority = 'normal', volume = 0.7) => {
  try {
    // Initialize audio context (needed for web audio API)
    const context = initAudioContext();
    if (!context) {
      return false;
    }
    
    // Resume audio context if it's suspended (autoplay policy)
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    // Get the appropriate sound URL based on priority
    const soundUrl = getSoundUrl(priority);
    
    // Create audio element
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    
    // Play the sound
    await audio.play();
    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};

/**
 * Get the URL for a notification sound based on priority
 * @param {string} priority - Priority of the notification
 * @returns {string} URL to the sound file
 */
const getSoundUrl = (priority) => {
  switch (priority) {
    case 'high':
      return '/sounds/notification-high.mp3';
    case 'low':
      return '/sounds/notification-low.mp3';
    case 'normal':
    default:
      return '/sounds/notification-normal.mp3';
  }
};

/**
 * Test playing notification sounds
 * @param {string} priority - Priority to test ('high', 'normal', 'low')
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<boolean>} Whether test was successful
 */
export const testNotificationSound = async (priority = 'normal', volume = 0.7) => {
  return await playNotificationSound(priority, volume);
};

export default {
  playNotificationSound,
  testNotificationSound
};
