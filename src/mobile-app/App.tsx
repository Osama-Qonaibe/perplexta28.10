import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../context/AppContext';
import { PwaProvider } from '../context/PwaContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { UnifiedFeedbackProvider } from '../design-system';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { ThemeSync } from '../utils/ThemeSync';
import { useThemeCustomizations } from '../hooks/useThemeCustomizations';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Lazy load essential pages only
const ChatPage = React.lazy(() => import('../pages/ChatPage'));
const BulletinBoardPage = React.lazy(() => import('../pages/BulletinBoardPage').then(m => ({ default: m.BulletinBoardPage })));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SubscriptionPage = React.lazy(() => import('../pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const RewardsPage = React.lazy(() => import('../pages/RewardsPage').then(m => ({ default: m.RewardsPage })));
const RecommendationsPage = React.lazy(() => import('../pages/RecommendationsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.MobileProfilePage })));
const WalletPage = React.lazy(() => import('./pages/WalletPage').then(m => ({ default: m.MobileWalletPage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAppContext();
  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MobilePWAWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppContext();
  useThemeCustomizations(theme);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ThemeSync.apply(theme);
  }, [theme]);

  return (
    <Suspense fallback={null}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="block h-full w-full"
      >
        {children}
      </motion.div>
    </Suspense>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <PwaProvider>
        <AppProvider>
          <UnifiedFeedbackProvider>
            <ErrorBoundary name="Perplexta Mobile Runtime">
              <WorkspaceProvider>
                <MobilePWAWrapper>
                  <Routes>
                    <Route path="/" element={<MobileAppLayout />}>
                      <Route index element={<Navigate to="/viralbook" replace />} />
                      <Route path="chat/:id?" element={<ChatPage />} />
                      <Route path="discover" element={<RecommendationsPage />} />
                      <Route path="viralbook/*" element={<BulletinBoardPage />} />
                      <Route path="bulletin/*" element={<BulletinBoardPage />} />
                      <Route path="reels/*" element={<BulletinBoardPage />} />
                      <Route path="p/*" element={<BulletinBoardPage />} />
                      <Route path="post/*" element={<BulletinBoardPage />} />
                      <Route path="subscription" element={<SubscriptionPage />} />
                      <Route path="rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
                      <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                      {/* Sub-settings pages should still work if needed, but we prefer native profile */}
                      <Route path="settings/:tab?" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MobilePWAWrapper>
              </WorkspaceProvider>
            </ErrorBoundary>
          </UnifiedFeedbackProvider>
        </AppProvider>
      </PwaProvider>
    </BrowserRouter>
  );
}
