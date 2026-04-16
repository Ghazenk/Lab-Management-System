import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Database, 
  User, 
  Bell, 
  Globe,
  Lock,
  ChevronRight,
  Check,
  Save,
  RefreshCw,
  Server,
  Key
} from 'lucide-react';

const settingSections = [
  { id: 'profile', label: 'User Profile', icon: User, description: 'Manage your personal information and credentials.' },
  { id: 'security', label: 'Security & Access', icon: Shield, description: 'Configure multi-factor authentication and session limits.' },
  { id: 'database', label: 'Database Config', icon: Database, description: 'Manage laboratory data retention and synchronization.' },
  { id: 'notifications', label: 'Alert Protocols', icon: Bell, description: 'Set thresholds for critical specimen alerts.' },
  { id: 'network', label: 'Network Nodes', icon: Globe, description: 'Configure laboratory node connections and API keys.' },
];

import { supabase, isSupabaseConfigured } from '../supabase';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: 'Laboratory Administrator',
    designation: 'Chief Pathologist',
    email: ''
  });
  const [toggles, setToggles] = useState({
    autoSync: true,
    maintenance: false,
    encryption: true,
    twoFactor: false,
    emailAlerts: true
  });
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setProfile(prev => ({ ...prev, email: user.email || '' }));
      }
    };
    getUser();
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Configuration Node Updated Successfully.");
    }, 1500);
  };

  const handleReset = async () => {
    if (confirm("Are you absolutely sure? This will purge all laboratory data.")) {
      setIsResetting(true);
      try {
        // Attempt to clear tables
        const tables = ['samples', 'subjects', 'tests', 'reports', 'equipment'];
        for (const table of tables) {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        alert("System Node Reset Successful. All laboratory data has been purged.");
      } catch (error) {
        console.error('Reset error:', error);
        alert("Reset failed. Check console for details.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Full Name</label>
                <input 
                  type="text" 
                  value={profile.full_name} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Designation</label>
                <input 
                  type="text" 
                  value={profile.designation} 
                  onChange={e => setProfile({...profile, designation: e.target.value})}
                  className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Email Address (Read Only)</label>
              <input 
                type="email" 
                readOnly
                value={profile.email} 
                className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface-dim outline-none cursor-not-allowed" 
              />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border bg-surface-low">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-on-surface">Two-Factor Authentication</h4>
                <p className="text-[11px] text-on-surface-dim mt-1">Add an extra layer of security to your account.</p>
              </div>
              <button 
                onClick={() => setToggles({...toggles, twoFactor: !toggles.twoFactor})}
                className={`w-10 h-5 rounded-full relative transition-colors ${toggles.twoFactor ? 'bg-primary' : 'bg-border'}`}
              >
                <motion.div animate={{ x: toggles.twoFactor ? 20 : 0 }} className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Session Timeout (Minutes)</label>
              <select className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none appearance-none">
                <option className="bg-surface">15 Minutes</option>
                <option className="bg-surface">30 Minutes</option>
                <option className="bg-surface">60 Minutes</option>
              </select>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border bg-surface-low">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-on-surface">Auto-Sync Registry</h4>
                <p className="text-[11px] text-on-surface-dim mt-1">Automatically synchronize specimen data with cloud nodes.</p>
              </div>
              <button 
                onClick={() => setToggles({...toggles, autoSync: !toggles.autoSync})}
                className={`w-10 h-5 rounded-full relative transition-colors ${toggles.autoSync ? 'bg-primary' : 'bg-border'}`}
              >
                <motion.div animate={{ x: toggles.autoSync ? 20 : 0 }} className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Data Retention Period</label>
              <select className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none appearance-none">
                <option className="bg-surface">1 Year</option>
                <option className="bg-surface">5 Years</option>
                <option className="bg-surface">Indefinite</option>
              </select>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border bg-surface-low">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-on-surface">Critical Alert Emails</h4>
                <p className="text-[11px] text-on-surface-dim mt-1">Receive immediate notification for critical specimen results.</p>
              </div>
              <button 
                onClick={() => setToggles({...toggles, emailAlerts: !toggles.emailAlerts})}
                className={`w-10 h-5 rounded-full relative transition-colors ${toggles.emailAlerts ? 'bg-primary' : 'bg-border'}`}
              >
                <motion.div animate={{ x: toggles.emailAlerts ? 20 : 0 }} className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
              </button>
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-6">
            <div className="p-4 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-4 h-4 text-primary" />
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-primary">Cloud Node Status</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-on-surface-dim">Connection Status:</span>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${isSupabaseConfigured ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isSupabaseConfigured ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Supabase URL</label>
                <input type="text" readOnly value={import.meta.env.VITE_SUPABASE_URL || 'Not Configured'} className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Anon Key</label>
                <div className="relative">
                  <input type="password" value={isSupabaseConfigured ? '••••••••••••••••' : ''} readOnly className="w-full bg-transparent border border-border p-3 text-[13px] text-on-surface focus:border-primary outline-none" />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-dim" />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-normal text-on-surface tracking-tight">System Configuration</h1>
          <p className="text-on-surface-dim text-[12px] uppercase tracking-widest mt-1">Helix Laboratory OS v4.2.0 Settings</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {isSaving ? 'Synchronizing...' : 'Save Configuration'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-serif italic text-on-surface mb-6">Control Modules</h2>
          <div className="space-y-2">
            {settingSections.map((section) => (
              <motion.div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`border p-6 flex items-center justify-between group cursor-pointer transition-all ${
                  activeSection === section.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-10 h-10 border flex items-center justify-center transition-colors ${
                    activeSection === section.id ? 'border-primary text-primary' : 'border-border text-on-surface-dim group-hover:text-primary group-hover:border-primary'
                  }`}>
                    <section.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-[13px] font-bold uppercase tracking-widest transition-colors ${
                      activeSection === section.id ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                    }`}>
                      {section.label}
                    </h3>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${
                  activeSection === section.id ? 'text-primary' : 'text-on-surface-dim group-hover:text-primary'
                }`} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Section Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="border border-border p-8 bg-surface-low min-h-[400px]">
            <div className="flex items-center gap-3 mb-8">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">
                {settingSections.find(s => s.id === activeSection)?.label} Override
              </h2>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderSectionContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border border-border p-8 border-rose-500/20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-rose-500 mb-4">Danger Zone</h2>
            <p className="text-[11px] text-on-surface-dim mb-6">Permanently delete all laboratory data and reset the system node.</p>
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className="w-full py-3 border border-rose-500 text-rose-500 text-[11px] uppercase tracking-widest font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
            >
              {isResetting ? 'Purging Data...' : 'Reset System Node'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
