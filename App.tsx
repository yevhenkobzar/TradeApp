import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { MarketReflections } from './components/MarketReflections';
import { PortfolioBreakdown } from './components/PortfolioBreakdown';
import { TradingJournal } from './components/TradingJournal';
import { LayoutDashboard, LineChart, BookOpen, Settings, Bell, Search } from 'lucide-react';

// Tab Configuration
const TABS = [
  { id: 'market', label: 'Market Review', icon: BookOpen, component: MarketReflections },
  { id: 'portfolio', label: 'Portfolio Breakdown', icon: LayoutDashboard, component: PortfolioBreakdown },
  { id: 'journal', label: 'Trading Journal', icon: LineChart, component: TradingJournal },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState(TABS[1].id);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || PortfolioBreakdown;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LineChart className="text-white" size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">TradeSync</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <input 
                type="text" 
                placeholder="Search ticker..." 
                className="bg-zinc-900 border border-zinc-800 text-sm rounded-full pl-10 pr-4 py-1.5 w-48 focus:w-64 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-300 placeholder:text-zinc-600"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            </div>
            
            <button className="relative text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-900">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
               <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        
        {/* Mobile Nav (Visible only on small screens) */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
           {TABS.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`
                 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border
                 ${activeTab === tab.id 
                   ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                   : 'bg-transparent text-zinc-400 border-zinc-800'
                 }
               `}
             >
               {tab.label}
             </button>
           ))}
        </div>

        <ActiveComponent />
      </main>

    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;