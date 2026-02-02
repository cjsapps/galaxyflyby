
import React, { useState, useEffect, useCallback } from 'react';
import GalaxyCanvas from './components/GalaxyCanvas';
// Removed erroneous import of GalaxyProps to fix TypeScript error (member not exported)
import { Leva } from 'leva';

// Define a type for the deferred prompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [galaxyKey, setGalaxyKey] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed via display-mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt from showing
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const regenerateGalaxy = useCallback(() => {
    setGalaxyKey(prevKey => prevKey + 1);
  }, []);

  // Function to download the entire project source as a ZIP file
  const handleDownloadSource = async () => {
    try {
      // Load JSZip from CDN if not already loaded
      if (!(window as any).JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        const loadPromise = new Promise((resolve) => {
          script.onload = resolve;
        });
        document.head.appendChild(script);
        await loadPromise;
      }

      const zip = new (window as any).JSZip();
      
      // Define file structure and contents for the project bundle
      zip.file('index.tsx', `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst rootElement = document.getElementById('root');\nif (!rootElement) throw new Error("Root element not found");\nconst root = ReactDOM.createRoot(rootElement);\nroot.render(<React.StrictMode><App /></React.StrictMode>);`);
      
      // Add scripts for building, previewing, and deploying to Cloudflare
      zip.file('package.json', JSON.stringify({
        name: "stellaris-3d",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
          deploy: "npm run build && npx wrangler pages deploy dist"
        },
        dependencies: {
          "@react-three/drei": "^9.0.0",
          "@react-three/fiber": "^8.0.0",
          "@react-three/postprocessing": "^2.0.0",
          "leva": "^0.9.0",
          "react": "^18.0.0",
          "react-dom": "^18.0.0",
          "three": "^0.150.0",
          "lucide-react": "^0.284.0"
        },
        devDependencies: {
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0",
          "@types/three": "^0.150.0",
          "typescript": "^5.0.0",
          "vite": "^4.0.0",
          "wrangler": "^3.0.0"
        }
      }, null, 2));
      
      zip.file('DEPLOYMENT.md', `# Deployment Guide\n\nTo deploy this project to Cloudflare Pages:\n\n1. Ensure you have a GitHub repository connected to Cloudflare Pages.\n2. In the Cloudflare Dashboard, select 'Pages' -> 'Create a project' -> 'Connect to Git'.\n3. Select your repository.\n4. Set the following build settings:\n   - Framework preset: \`Vite\`\n   - Build command: \`npm run build\`\n   - Build output directory: \`dist\`\n5. Environment Variables: Ensure \`NODE_VERSION\` is at least \`18.0.0\`.`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stellaris-3d-source.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating source bundle:', error);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden font-sans text-slate-50 selection:bg-purple-500/30">
      {/* HUD Controls */}
      <Leva collapsed />
      
      {/* 3D Scene */}
      <GalaxyCanvas key={galaxyKey} />
      
      {/* UI HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 z-10">
        
        {/* Header Section */}
        <header className="flex justify-between items-start w-full">
          <div className="space-y-1 animate-in fade-in slide-in-from-top duration-1000">
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-fuchsia-500 to-amber-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              Stellaris 3D
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-purple-500/50" />
              <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.4em] uppercase opacity-90">
                Procedural Cosmic Engine
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pointer-events-auto items-end animate-in fade-in slide-in-from-right duration-1000 delay-200">
            <button
              onClick={regenerateGalaxy}
              className="group relative flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 backdrop-blur-xl active:scale-95 hover:border-purple-500/50 shadow-2xl"
            >
              <span className="text-sm font-black tracking-widest uppercase text-white/90">Regenerate</span>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse group-hover:scale-125 transition-transform shadow-[0_0_10px_#a855f7]" />
            </button>
            
            {!isAppInstalled && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/30 transition-all active:scale-95 animate-bounce mt-2"
              >
                Install Application
              </button>
            )}
          </div>
        </header>

        {/* Footer HUD */}
        <footer className="flex flex-col md:flex-row justify-between items-end gap-6 w-full animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">
               <div className="w-16 h-[1px] bg-slate-800" />
               <span>Navigation Protocol</span>
             </div>
             <div className="flex gap-2">
               {['Orbit: L-Click', 'Pan: R-Click', 'Zoom: Scroll'].map(ctrl => (
                 <span key={ctrl} className="text-[10px] text-slate-400 font-bold bg-white/5 px-3 py-1.5 rounded-md border border-white/5 backdrop-blur-md">
                   {ctrl}
                 </span>
               ))}
             </div>
          </div>
          
          <div className="flex flex-col gap-3 items-end pointer-events-auto">
            <button
              onClick={handleDownloadSource}
              className="group flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-lg transition-all active:scale-95 backdrop-blur-xl"
              title="Download Source Bundle (ZIP)"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Project Bundle
            </button>
            <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono tracking-tighter italic">
              <span>DEPLOYED_MODE</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span>v1.0.4-α</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Atmospheric Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent opacity-40 pointer-events-none" />
    </main>
  );
};

export default App;
