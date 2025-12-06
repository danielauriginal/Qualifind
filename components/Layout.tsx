import React from 'react';
import { LayoutDashboard, PlusCircle, Database, Settings, LogOut, Menu, Users, BarChart2, FileText, Terminal, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'search' | 'projects' | 'contacts' | 'controlling' | 'scripts';
  onNavigate: (tab: 'dashboard' | 'search' | 'projects' | 'contacts' | 'controlling' | 'scripts') => void;
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSettings?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onNavigate, 
  isDevMode, 
  onToggleDevMode, 
  isDarkMode, 
  onToggleDarkMode,
  onOpenSettings 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className="mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full shadow-xl z-20 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Icebreaker</span>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="search" icon={PlusCircle} label="New Search" />
          <NavItem id="projects" icon={Database} label="My Projects" />
          <NavItem id="contacts" icon={Users} label="CRM" />
          <NavItem id="scripts" icon={FileText} label="Scripts" />
          <div className="pt-4 mt-4 border-t border-slate-800">
             <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Analytics</div>
             <NavItem id="controlling" icon={BarChart2} label="Controlling" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
             onClick={onToggleDevMode}
             className={`flex items-center w-full px-4 py-2 mb-2 transition-colors rounded ${isDevMode ? 'text-green-400 bg-slate-800' : 'text-slate-500 hover:text-white'}`}
          >
             <Terminal size={18} className="mr-3" />
             <span>Dev Mode {isDevMode ? 'ON' : 'OFF'}</span>
          </button>
          
           <button 
             onClick={onToggleDarkMode}
             className={`flex items-center w-full px-4 py-2 mb-2 transition-colors rounded text-slate-500 hover:text-white hover:bg-slate-800`}
          >
             {isDarkMode ? <Sun size={18} className="mr-3 text-yellow-400" /> : <Moon size={18} className="mr-3" />}
             <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button 
            onClick={onOpenSettings}
            className="flex items-center w-full px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <Settings size={18} className="mr-3" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 px-4 py-3 flex items-center justify-between shadow-md">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold">LeadScout</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={24} />
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-40 flex flex-col pt-20 px-4 md:hidden">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="search" icon={PlusCircle} label="New Search" />
          <NavItem id="projects" icon={Database} label="My Projects" />
          <NavItem id="contacts" icon={Users} label="CRM" />
          <NavItem id="scripts" icon={FileText} label="Scripts" />
          <NavItem id="controlling" icon={BarChart2} label="Controlling" />
          <div className="mt-4 border-t border-slate-800 pt-4">
              <button 
                 onClick={onToggleDarkMode}
                 className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-white"
              >
                 {isDarkMode ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
                 <span>{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
              <button 
                 onClick={() => { onOpenSettings && onOpenSettings(); setIsMobileMenuOpen(false); }}
                 className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-white"
              >
                 <Settings size={20} className="mr-3" />
                 <span>Settings</span>
              </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative md:static mt-14 md:mt-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
             {isDevMode && (
                <span className="px-2 py-1 bg-slate-800 dark:bg-slate-900 text-green-400 text-xs font-mono rounded border border-green-900">
                   DEV MODE ACTIVE
                </span>
             )}
             <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800">
               Pro Plan
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
               JD
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};