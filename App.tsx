
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Screen, Claim } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardScreen from './components/screens/DashboardScreen';
import ClaimDetailScreen from './components/screens/ClaimDetailScreen';
import ApiDocsScreen from './components/screens/ApiDocsScreen';
import FeaturesScreen from './components/screens/FeaturesScreen';
import AccountSettingsScreen from './components/screens/AccountSettingsScreen';
import ComplianceScreen from './components/screens/ComplianceScreen';
import TrainingScreen from './components/screens/TrainingScreen';
import LandingScreen from './components/screens/LandingScreen';
import MyARKAppScreen from './components/screens/MyArkAppScreen';
import { MOCK_CLAIMS, generateIncomingClaims } from './constants';
import { LockClosedIcon } from './components/icons/Icons';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [publicScreen, setPublicScreen] = useState<'landing' | 'myark'>('landing');
  
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.FEATURES);
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [nextIdCounter, setNextIdCounter] = useState(5); 
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  
  const mainContentRef = useRef<HTMLElement>(null);
  const idleTimerRef = useRef<number | null>(null);

  const resetIdleTimer = useCallback(() => {
      if (isSessionLocked || !isAuthenticated) return;

      if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
          setIsSessionLocked(true);
      }, SESSION_TIMEOUT_MS);
  }, [isSessionLocked, isAuthenticated]);

  useEffect(() => {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const handleActivity = () => resetIdleTimer();

      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer();

      return () => {
          events.forEach(event => window.removeEventListener(event, handleActivity));
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
  }, [resetIdleTimer]);

  // Scroll window to top when public screens change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [publicScreen, isAuthenticated]);

  useEffect(() => {
    if (mainContentRef.current && activeScreen !== Screen.TRAINING && selectedClaim?.liveFNOLAnalysis?.status !== 'active') {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeScreen, selectedClaim]);

  const handleNavigate = (screen: Screen) => {
    setActiveScreen(screen);
  };

  const handleSelectClaim = useCallback((claim: Claim) => {
    setSelectedClaim(claim);
    setActiveScreen(Screen.CLAIM_DETAIL);
  }, []);

  const handleUpdateClaim = useCallback((updatedClaim: Claim) => {
      setClaims(prevClaims => prevClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
      setSelectedClaim(updatedClaim);
  }, []);

  const handleSyncClaims = useCallback(() => {
     const newClaims = generateIncomingClaims(nextIdCounter);
     setClaims(prev => [...newClaims, ...prev]);
     setNextIdCounter(prev => prev + 1);
     return newClaims.length;
  }, [nextIdCounter]);

  const handleUnlockSession = () => {
      setIsSessionLocked(false);
      resetIdleTimer();
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activeScreen) {
      case Screen.DASHBOARD:
        return (
            <DashboardScreen 
                claims={claims}
                onSelectClaim={handleSelectClaim} 
                onSyncClaims={handleSyncClaims}
            />
        );
      case Screen.CLAIM_DETAIL:
        return selectedClaim ? <ClaimDetailScreen claim={selectedClaim} onUpdateClaim={handleUpdateClaim} /> : <DashboardScreen claims={claims} onSelectClaim={handleSelectClaim} onSyncClaims={handleSyncClaims} />;
      case Screen.API_DOCS:
        return <ApiDocsScreen />;
      case Screen.FEATURES:
        return <FeaturesScreen onNavigate={handleNavigate} />;
      case Screen.ACCOUNT_SETTINGS:
        return <AccountSettingsScreen />;
      case Screen.COMPLIANCE:
        return <ComplianceScreen />;
      case Screen.TRAINING:
        return <TrainingScreen />;
      default:
        return <DashboardScreen claims={claims} onSelectClaim={handleSelectClaim} onSyncClaims={handleSyncClaims} />;
    }
  };

  // --- RENDER LOGIC ---

  if (!isAuthenticated) {
      if (publicScreen === 'myark') {
          return <MyARKAppScreen onBack={() => setPublicScreen('landing')} />;
      }
      return <LandingScreen onGetStarted={handleLogin} onNavigateMyARK={() => setPublicScreen('myark')} />;
  }

  if (isSessionLocked) {
      return (
          <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center text-white z-50">
              <div className="bg-white text-neutral-dark p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LockClosedIcon className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Session Timeout</h2>
                  <p className="text-gray-500 mb-8">For your security, the session has been locked due to 15 minutes of inactivity.</p>
                  
                  <button 
                    onClick={handleUnlockSession}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg transition-colors"
                  >
                      Resume Session
                  </button>
                  <div className="mt-4 text-xs text-gray-400">
                      Logged in as Alex Johnson (Senior Adjuster)
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-neutral-light font-sans text-neutral-black overflow-hidden">
      <Sidebar 
        activeScreen={activeScreen} 
        onNavigate={handleNavigate} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onNavigate={handleNavigate} />
        <main 
            ref={mainContentRef} 
            className={`flex-1 overflow-y-auto overflow-x-hidden ${
                activeScreen === Screen.TRAINING ? 'p-0' : 'p-6 lg:p-8'
            }`}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
