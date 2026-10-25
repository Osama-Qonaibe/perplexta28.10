import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from './AppContext';
import { toast } from '@/design-system';

export type WorkspaceMode = 'chat' | 'image' | 'video' | 'audio' | 'app' | 'bulletin';

interface WorkspaceProject {
  id: string;
  title: string;
  type: WorkspaceMode;
  lastModified: number;
  data: any;
}

interface WorkspaceContextType {
  activeMode: WorkspaceMode;
  setActiveMode: (mode: WorkspaceMode) => void;
  activeProject: WorkspaceProject | null;
  setActiveProject: (project: WorkspaceProject | null) => void;
  switchWorkspace: (mode: WorkspaceMode, projectId?: string) => void;
  isTransitioning: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMode, setActiveModeState] = useState<WorkspaceMode>('chat');
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync mode with route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/chat')) setActiveModeState('chat');
    else if (path.startsWith('/image-studio')) setActiveModeState('image');
    else if (path.startsWith('/video-studio')) setActiveModeState('video');
    else if (path.startsWith('/audio-studio')) setActiveModeState('audio');
    else if (path.startsWith('/app')) setActiveModeState('app');
    else if (path.startsWith('/bulletin')) setActiveModeState('bulletin');
  }, [location.pathname]);

  const setActiveMode = useCallback((mode: WorkspaceMode) => {
    setActiveModeState(mode);
    switch (mode) {
      case 'chat': navigate('/chat'); break;
      case 'image': navigate('/image-studio'); break;
      case 'video': navigate('/image-studio?category=reels'); break;
      case 'audio': navigate('/audio-studio'); break;
      case 'app': navigate('/app'); break;
      case 'bulletin': navigate('/bulletin'); break;
    }
  }, [navigate]);

  const switchWorkspace = useCallback((mode: WorkspaceMode, projectId?: string) => {
    setIsTransitioning(true);
    // Simulate smart pre-loading or state preservation
    setTimeout(() => {
      setActiveMode(mode);
      if (projectId) {
        // Logic to load project would go here or be handled by the page component
      }
      setIsTransitioning(false);
    }, 300);
  }, [setActiveMode]);

  return (
    <WorkspaceContext.Provider value={{
      activeMode,
      setActiveMode,
      activeProject,
      setActiveProject,
      switchWorkspace,
      isTransitioning
    }}>
      {children}
      
      {/* Global Workspace Transition Overlay (Elite Motion) */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[10000] bg-[var(--surface-page)] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[var(--accent)]/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] animate-pulse">
            {activeMode === 'video' ? 'Initializing Rinex Motion Engine' : 'Switching Workspace'}
          </p>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
