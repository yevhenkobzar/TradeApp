import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JournalEntry, PortfolioItem, Trade, Direction } from '../types';
import { JOURNAL_ENTRIES, PORTFOLIO_ITEMS, TRADES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DataContextType {
  journalEntries: JournalEntry[];
  portfolioItems: PortfolioItem[];
  trades: Trade[];
  loading: boolean;
  livePrices: Record<string, number>;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  refreshPrices: () => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  editPortfolioItem: (id: string, item: Partial<Omit<PortfolioItem, 'id'>>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'pnl'>) => Promise<void>;
  editTrade: (id: string, trade: Partial<Omit<Trade, 'id' | 'pnl'>>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  clearTrades: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Real-time price state
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        // Fetch from Supabase
        try {
          const { data: journalData } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
          const { data: portfolioData } = await supabase.from('portfolio_items').select('*');
          const { data: tradesData } = await supabase.from('trades').select('*').order('date', { ascending: false });

          if (journalData) setJournalEntries(journalData);
          if (portfolioData) setPortfolioItems(portfolioData);
          if (tradesData) setTrades(tradesData);
        } catch (error) {
          console.error("Error fetching from Supabase:", error);
        }
      } else {
        // Fallback to LocalStorage
        const savedJournal = localStorage.getItem('journalEntries');
        const savedPortfolio = localStorage.getItem('portfolioItems');
        const savedTrades = localStorage.getItem('trades');

        setJournalEntries(savedJournal ? JSON.parse(savedJournal) : JOURNAL_ENTRIES);
        setPortfolioItems(savedPortfolio ? JSON.parse(savedPortfolio) : PORTFOLIO_ITEMS);
        setTrades(savedTrades ? JSON.parse(savedTrades) : TRADES);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Prices Logic
  const refreshPrices = useCallback(async () => {
    if (portfolioItems.length === 0) return;
    
    setIsRefreshing(true);
    const newPrices: Record<string, number> = { ...livePrices };

    // 1. Separate Assets
    const cryptoTickers = new Set<string>();
    const stockItems: PortfolioItem[] = [];

    portfolioItems.forEach(item => {
      // Default to Crypto if undefined (backward compatibility)
      if (item.assetType === 'Crypto' || !item.assetType) {
        cryptoTickers.add(item.token.toUpperCase());
      } else {
        stockItems.push(item);
      }
    });

    // 2. Fetch Crypto (Real Data via CryptoCompare)
    if (cryptoTickers.size > 0) {
      try {
        const tickersString = Array.from(cryptoTickers).join(',');
        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tickersString}&tsyms=USD`);
        const data = await response.json();
        
        Object.keys(data).forEach(ticker => {
          newPrices[ticker] = data[ticker].USD;
        });
      } catch (error) {
        console.error("Failed to fetch crypto prices", error);
      }
    }

    // 3. Simulate Stocks (Random Walk for Demo purposes as free Stock APIs are rare/limited)
    // In a production app, you would fetch from Finnhub or AlphaVantage here.
    stockItems.forEach(item => {
      const current = newPrices[item.token] || item.currentPrice;
      // Fluctuate by +/- 0.5%
      const change = 1 + (Math.random() - 0.5) * 0.01; 
      newPrices[item.token] = Number((current * change).toFixed(2));
    });

    setLivePrices(newPrices);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [portfolioItems, livePrices]);

  // Polling Effect (Every 15 seconds)
  useEffect(() => {
    if (!loading && portfolioItems.length > 0) {
      // Initial fetch
      refreshPrices();
      
      const interval = setInterval(refreshPrices, 15000);
      return () => clearInterval(interval);
    }
  }, [loading, portfolioItems.length]); // Intentionally not including refreshPrices to avoid loop, handled by ref or simple dependency

  // Helper to persist to LS if not using Supabase
  const persistToLS = (key: string, data: any) => {
    if (!isSupabaseConfigured) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('journal_entries').insert([newEntry]);
      if (!error) setJournalEntries(prev => [newEntry, ...prev]);
    } else {
      const updated = [newEntry, ...journalEntries];
      setJournalEntries(updated);
      persistToLS('journalEntries', updated);
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (!error) setJournalEntries(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = journalEntries.filter(item => item.id !== id);
      setJournalEntries(updated);
      persistToLS('journalEntries', updated);
    }
  };

  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('portfolio_items').insert([newItem]);
      if (!error) setPortfolioItems(prev => [newItem, ...prev]);
    } else {
      const updated = [newItem, ...portfolioItems];
      setPortfolioItems(updated);
      persistToLS('portfolioItems', updated);
    }
    // Trigger immediate price refresh
    setTimeout(refreshPrices, 500);
  };

  const editPortfolioItem = async (id: string, updates: Partial<Omit<PortfolioItem, 'id'>>) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('portfolio_items').update(updates).eq('id', id);
      if (!error) {
        setPortfolioItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      }
    } else {
      const updated = portfolioItems.map(item => item.id === id ? { ...item, ...updates } : item);
      setPortfolioItems(updated);
      persistToLS('portfolioItems', updated);
    }
    setTimeout(refreshPrices, 500);
  };

  const deletePortfolioItem = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (!error) setPortfolioItems(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = portfolioItems.filter(item => item.id !== id);
      setPortfolioItems(updated);
      persistToLS('portfolioItems', updated);
    }
  };

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'pnl'>) => {
    let pnl = null;
    
    // Auto-calculate PnL if trade is closed
    if (tradeData.status !== 'Open' && tradeData.exitPrice) {
      const entryVal = tradeData.entryPrice;
      const exitVal = tradeData.exitPrice;
      
      if (tradeData.direction === Direction.LONG) {
        pnl = ((exitVal - entryVal) / entryVal) * tradeData.size;
      } else {
        pnl = ((entryVal - exitVal) / entryVal) * tradeData.size;
      }
    }

    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
      pnl
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('trades').insert([newTrade]);
      if (!error) setTrades(prev => [newTrade, ...prev]);
    } else {
      const updated = [newTrade, ...trades];
      setTrades(updated);
      persistToLS('trades', updated);
    }
  };

  const editTrade = async (id: string, updates: Partial<Omit<Trade, 'id' | 'pnl'>>) => {
    const currentTrade = trades.find(t => t.id === id);
    if (!currentTrade) return;

    // Merge updates
    const mergedTrade = { ...currentTrade, ...updates };
    
    // Recalculate PnL
    let pnl = currentTrade.pnl;
    
    if (mergedTrade.status !== 'Open' && mergedTrade.exitPrice) {
       const entry = mergedTrade.entryPrice;
       const exit = mergedTrade.exitPrice;
       const size = mergedTrade.size;
       if (mergedTrade.direction === Direction.LONG) {
         pnl = ((exit - entry) / entry) * size;
       } else {
         pnl = ((entry - exit) / entry) * size;
       }
    } else if (mergedTrade.status === 'Open') {
        pnl = null;
    }

    const finalTrade = { ...mergedTrade, pnl };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('trades').update({ 
          ...updates,
          pnl: pnl
      }).eq('id', id);
      if (!error) setTrades(prev => prev.map(t => t.id === id ? finalTrade : t));
    } else {
      const updated = trades.map(t => t.id === id ? finalTrade : t);
      setTrades(updated);
      persistToLS('trades', updated);
    }
  };

  const deleteTrade = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('trades').delete().eq('id', id);
      if (!error) setTrades(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = trades.filter(item => item.id !== id);
      setTrades(updated);
      persistToLS('trades', updated);
    }
  };

  const clearTrades = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) setTrades([]);
    } else {
      setTrades([]);
      persistToLS('trades', []);
    }
  };

  return (
    <DataContext.Provider value={{
      journalEntries,
      portfolioItems,
      trades,
      loading,
      livePrices,
      lastUpdated,
      isRefreshing,
      refreshPrices,
      addJournalEntry,
      deleteJournalEntry,
      addPortfolioItem,
      editPortfolioItem,
      deletePortfolioItem,
      addTrade,
      editTrade,
      deleteTrade,
      clearTrades
    }}>
      {children}
    </DataContext.Provider>
  );
};