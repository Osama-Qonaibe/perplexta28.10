import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { useSwipeToClose } from '../utils/swipe';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { AuthCard } from './auth/AuthCard';
import { themeConfig } from '@/design-system';

export { AuthCard } from './auth/AuthCard';

export const AuthModal: React.FC = () => {
  const { dir, isAuthModalOpen, setIsAuthModalOpen, user } = useAppContext();

  const swipeHandlers = useSwipeToClose({
    onSwipeClose: () => setIsAuthModalOpen(false),
    direction: 'both',
    dir: dir as 'rtl' | 'ltr',
    isMobile: true
  });

  useModalScrollLock(isAuthModalOpen, 'auth-modal');

  useEffect(() => {
    if (!isAuthModalOpen) return;

    // Preload ChatPage chunk immediately while modal is open for 0ms post-login transition
    import('../pages/ChatPage').catch(() => {});

    if (user) {
      setIsAuthModalOpen(false);
    }
  }, [isAuthModalOpen, user, setIsAuthModalOpen]);

  const handleClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          key="perplexta-auth-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClose}
          className={themeConfig.auth.overlay}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full flex justify-center transform-gpu"
          >
            <AuthCard onClose={handleClose} onSuccess={handleClose} showCloseButton={true} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


