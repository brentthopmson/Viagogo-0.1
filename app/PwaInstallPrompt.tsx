'use client';
import { useEffect, useState } from 'react';
import { useUser } from './UserContext';

export default function PwaInstallPrompt() {
  const { admin, isOffline } = useUser();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hasStorage, setHasStorage] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) setShowIOSPrompt(true);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIOSPrompt(false);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => { setHasStorage(!!localStorage.getItem('adminData')); }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  const isLoggedIn = !!admin || hasStorage;

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-white text-center text-xs py-1 font-medium">
          You are offline — showing cached data
        </div>
      )}
      {isLoggedIn && !dismissed && !isOffline && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="bg-[#001B41] text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-bold hover:bg-[#002856] transition-colors"
            >
              Install Viagogo App
            </button>
          )}
          {showIOSPrompt && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 max-w-xs text-sm text-gray-700 relative">
              <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
              <p className="font-bold text-gray-900 mb-1">Install Viagogo App</p>
              <p>
                Tap <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">Share</span>
                {' '}&rarr;{' '}
                <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">Add to Home Screen</span>
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
