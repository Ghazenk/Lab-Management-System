import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SampleList from './components/SampleList';
import TestCatalog from './components/TestCatalog';
import Reports from './components/Reports';
import Equipment from './components/Equipment';
import Settings from './components/Settings';
import PatientRegistry from './components/PatientRegistry';
import ThemeToggle from './components/ThemeToggle';
import NotificationsPanel from './components/NotificationsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Bell, Search, Menu, AlertCircle, Info, CheckCircle2, X as XIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    // Equipment Status Monitoring
    const equipmentChannel = supabase
      .channel('global-equipment-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const node = payload.new;
            if (node.status === 'Warning' || node.status === 'Maintenance') {
              const title = node.status === 'Warning' ? 'Hardware Warning' : 'Maintenance Initiated';
              const message = node.status === 'Warning' 
                ? `Hardware node ${node.name} has entered a warning state. Health: ${node.health}%`
                : `Hardware node ${node.name} is now undergoing recalibration.`;
              
              const type = node.status === 'Warning' ? 'warning' : 'info';

              // Add to notifications table
              supabase.from('notifications').insert([{
                title,
                message,
                type,
                read: false
              }]);

              // Show Toast
              const id = Math.random().toString(36).substr(2, 9);
              setToasts(prev => [...prev, { id, title, message, type }]);
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
              }, 5000);
            }
          }
        }
      )
      .subscribe();

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch(err => {
        console.error('Auth session error:', err);
      })
      .finally(() => {
        setIsAuthReady(true);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      supabase.removeChannel(equipmentChannel);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-on-surface-dim">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-[12px] uppercase tracking-widest">Initializing Security Protocols...</p>
        </div>
      );
    }

    if (!isSupabaseConfigured && activeTab !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-12">
          <div className="w-16 h-16 border border-primary/20 flex items-center justify-center mb-8">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-serif text-on-surface mb-4">Cloud Node Not Configured</h2>
          <p className="text-on-surface-dim text-sm max-w-md mb-8">
            The laboratory cloud node requires a valid Supabase configuration to synchronize data. 
            Please provide your <strong className="text-on-surface">VITE_SUPABASE_URL</strong> and <strong className="text-on-surface">VITE_SUPABASE_ANON_KEY</strong> in the Secrets panel.
          </p>
          <button 
            onClick={() => setActiveTab('settings')}
            className="px-8 py-3 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all"
          >
            Configure System Node
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'samples':
        return <SampleList searchQuery={searchQuery} />;
      case 'tests':
        return <TestCatalog searchQuery={searchQuery} />;
      case 'reports':
        return <Reports searchQuery={searchQuery} />;
      case 'equipment':
        return <Equipment searchQuery={searchQuery} />;
      case 'patients':
        return <PatientRegistry searchQuery={searchQuery} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-on-surface-dim">
            <h2 className="text-2xl font-serif italic mb-2">Protocol Pending</h2>
            <p className="text-[12px] uppercase tracking-widest">Module currently in synchronization</p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Navigation */}
          <header className="h-24 px-4 sm:px-12 flex items-center justify-between sticky top-0 z-10 glass border-b border-border">
            <div className="flex items-center gap-4 sm:gap-8 flex-1 max-w-xl">
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 text-on-surface-dim hover:text-primary transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative w-full hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-dim" />
                <input 
                  type="text" 
                  placeholder="Search analytical nodes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-6 py-2 bg-transparent border border-border rounded-full text-[12px] uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-8 ml-4 sm:ml-12">
              <ThemeToggle isDark={isDark} toggle={toggleTheme} />

              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-on-surface-dim hover:text-primary transition-colors group"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
              </button>
              
              <div className="h-8 w-[1px] bg-border hidden sm:block" />
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-on-surface">{user?.displayName || 'Dr. Elias Thorne'}</p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-dim">Chief Pathologist</p>
                </div>
                <div className="w-10 h-10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={user?.photoURL || "https://picsum.photos/seed/doctor/100/100"} 
                    alt="Avatar" 
                    className={`w-full h-full object-cover transition-all duration-500 ${isDark ? 'grayscale hover:grayscale-0' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 sm:p-12 max-w-[1400px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer / Status Bar */}
          <footer className="mt-auto p-4 sm:p-12 pt-0">
            <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-medium text-on-surface-dim uppercase tracking-widest">Last synchronized: 14:02:11 GMT</span>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-8">
                <span className="text-[10px] font-medium text-on-surface-dim uppercase tracking-widest hover:text-primary cursor-pointer transition-colors">Registry v4.2.0</span>
                <span className="text-[10px] font-medium text-on-surface-dim uppercase tracking-widest">Helix Laboratory OS</span>
              </div>
            </div>
          </footer>
        </main>

        <NotificationsPanel 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />

        {/* Toast Notifications */}
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="pointer-events-auto w-80 bg-surface border border-border p-5 shadow-2xl flex gap-4 items-start group"
              >
                <div className="mt-1">
                  {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                  {toast.type === 'info' && <Info className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${toast.type === 'warning' ? 'text-rose-500' : 'text-primary'}`}>
                    {toast.title}
                  </h4>
                  <p className="text-[12px] text-on-surface-dim leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 text-on-surface-dim hover:text-on-surface opacity-0 group-hover:opacity-100 transition-all"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
}
