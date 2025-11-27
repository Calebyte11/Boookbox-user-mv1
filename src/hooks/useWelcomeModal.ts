import { useState, useEffect } from 'react';

const WELCOME_MODAL_STORAGE_KEY = 'boookbox_welcome_modal_seen';

/**
 * Custom hook to manage welcome modal state
 * Tracks whether user has seen the welcome modal before using localStorage
 * 
 * @returns {Object} Object containing modal state and control functions
 */
export const useWelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  // Check if user has seen welcome modal before on mount
  useEffect(() => {
    try {
      const hasSeenModal = localStorage.getItem(WELCOME_MODAL_STORAGE_KEY);
      const hasSeen = hasSeenModal === 'false';
      setHasSeenBefore(hasSeen);
      
      // Show modal only if user hasn't seen it before
      if (!hasSeen) {
        // Add a small delay to ensure page has loaded
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error reading welcome modal state from localStorage:', error);
      // If localStorage fails, show modal as fallback
      setIsOpen(true);
    }
  }, []);

  /**
   * Close the modal and mark it as seen
   */
  const closeModal = () => {
    setIsOpen(false);
    markAsSeen();
  };

  /**
   * Mark the welcome modal as seen in localStorage
   */
  const markAsSeen = () => {
    try {
      localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, 'true');
      setHasSeenBefore(true);
    } catch (error) {
      console.error('Error saving welcome modal state to localStorage:', error);
    }
  };

  /**
   * Force show the modal (useful for testing or manual trigger)
   */
  const showModal = () => {
    setIsOpen(true);
  };

  /**
   * Reset the modal state (useful for testing or allowing user to see it again)
   */
  const resetModalState = () => {
    try {
      localStorage.removeItem(WELCOME_MODAL_STORAGE_KEY);
      setHasSeenBefore(false);
    } catch (error) {
      console.error('Error resetting welcome modal state:', error);
    }
  };

  return {
    isOpen,
    hasSeenBefore,
    closeModal,
    showModal,
    resetModalState,
    markAsSeen
  };
};

export default useWelcomeModal;