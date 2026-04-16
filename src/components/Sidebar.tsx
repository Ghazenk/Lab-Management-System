import React from 'react';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'samples', label: 'Sample Queue', icon: FlaskConical },
  { id: 'patients', label: 'Subject Registry', icon: Users },
  { id: 'tests', label: 'Diagnostic Inventory', icon: FileText },
  { id: 'reports', label: 'Analytical Reports', icon: FileText },
  { id: 'equipment', label: 'Equipment Node', icon: Settings },
  { id: 'settings', label: 'System Config', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-[260px] bg-surface z-50 transform transition-transform duration-300 ease-in-out border-r border-border px-8 py-10
        lg:translate-x-0 lg:static lg:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-14">
          <span className="font-serif italic text-2xl text-primary tracking-tight">Helix.OS</span>
          <button onClick={onClose} className="lg:hidden text-on-surface-dim hover:text-on-surface">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1">
          <ul className="space-y-6">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 text-[13px] uppercase tracking-[1.5px] transition-all duration-300 ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-on-surface-dim hover:text-on-surface'
                    }`}
                  >
                    <span className={`h-[1px] transition-all duration-300 ${isActive ? 'w-8 bg-primary' : 'w-0 bg-transparent'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          <div className="mb-4">
            <p className="text-sm font-medium text-on-surface">Dr. Elias Thorne</p>
            <p className="text-[11px] uppercase tracking-wider text-on-surface-dim">Chief Pathologist</p>
          </div>
          <button className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-on-surface-dim hover:text-on-surface transition-colors">
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
