import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Button, Input, Label, Select } from './ui/Form';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, DollarSign, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { AssetType } from '../types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#06b6d4'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PortfolioBreakdown: React.FC = () => {
  const { 
    portfolioItems, 
    addPortfolioItem, 
    editPortfolioItem, 
    deletePortfolioItem,
    livePrices,
    lastUpdated,
    isRefreshing,
    refreshPrices
  } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    token: '',
    amount: '',
    buyPrice: '',
    currentPrice: '',
    category: 'Liquid' as 'Liquid' | 'Vested' | 'Farming',
    assetType: 'Crypto' as AssetType
  });

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;
    
    const dataByToken = portfolioItems.map(item => {
      // Use live price if available, otherwise fallback to manual entry
      // For Crypto, keys are often ticker symbols (e.g. BTC)
      const livePrice = livePrices[item.token.toUpperCase()];
      const effectivePrice = livePrice !== undefined ? livePrice : item.currentPrice;

      const value = effectivePrice * item.amount;
      const invested = item.buyPrice * item.amount;
      const pnl = value - invested;
      
      totalValue += value;
      totalInvested += invested;
      
      return { 
        ...item, 
        effectivePrice,
        isLive: livePrice !== undefined,
        value, 
        pnl, 
        invested 
      };
    }).sort((a, b) => b.value - a.value);

    return { totalValue, totalInvested, dataByToken };
  }, [portfolioItems, livePrices]);

  const totalPnL = stats.totalValue - stats.totalInvested;
  const pnlPercent = stats.totalInvested > 0 ? (totalPnL / stats.totalInvested) * 100 : 0;

  const chartData = stats.dataByToken.map(item => ({
    name: item.token,
    value: item.value
  }));

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        token: item.token,
        amount: item.amount.toString(),
        buyPrice: item.buyPrice.toString(),
        currentPrice: item.currentPrice.toString(),
        category: item.category,
        assetType: item.assetType || 'Crypto'
      });
    } else {
      setEditingId(null);
      setFormData({ 
        token: '', 
        amount: '', 
        buyPrice: '', 
        currentPrice: '', 
        category: 'Liquid',
        assetType: 'Crypto'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      token: formData.token.toUpperCase(), // Store tickers in upper case
      amount: Number(formData.amount),
      buyPrice: Number(formData.buyPrice),
      currentPrice: Number(formData.currentPrice),
      category: formData.category,
      assetType: formData.assetType
    };

    if (editingId) {
      editPortfolioItem(editingId, payload);
    } else {
      addPortfolioItem(payload);
    }
    
    setIsModalOpen(false);
    setFormData({ token: '', amount: '', buyPrice: '', currentPrice: '', category: 'Liquid', assetType: 'Crypto' });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Total Balance</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</h3>
            </div>
          </div>
        </Card>

        <Card>
           <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${totalPnL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Total PnL ($)</p>
              <h3 className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
              </h3>
            </div>
          </div>
        </Card>

        <Card>
           <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${pnlPercent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">ROI (%)</p>
              <h3 className={`text-2xl font-bold ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card title="Allocation" className="lg:col-span-1 h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                   layout="horizontal" 
                   verticalAlign="bottom" 
                   align="center"
                   wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                 <Wallet size={20} className="text-zinc-600" />
              </div>
              No assets added yet
            </div>
          )}
        </Card>

        {/* Holdings Table */}
        <Card 
          title="Holdings Breakdown" 
          className="lg:col-span-2 min-h-[400px] flex flex-col"
          action={
            <div className="flex items-center gap-2">
              <button 
                onClick={() => refreshPrices()}
                disabled={isRefreshing}
                className={`p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Prices"
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Add Asset
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            {stats.dataByToken.length > 0 ? (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/50 sticky top-0 z-10 text-xs uppercase tracking-wider font-semibold text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Token</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Avg Buy</th>
                    <th className="px-6 py-4 text-right">Current Price</th>
                    <th className="px-6 py-4 text-right">Value</th>
                    <th className="px-6 py-4 text-right">PnL</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {stats.dataByToken.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.assetType === 'Stock' ? 'bg-blue-500' : 'bg-orange-500'}`} title={item.assetType}></div>
                        {item.token}
                        <span className="ml-2 text-[10px] uppercase border border-zinc-800 rounded px-1 text-zinc-500">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{item.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-500">${item.buyPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-white flex items-center justify-end gap-1.5">
                         {item.isLive && (
                           <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                         )}
                         ${item.effectivePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-white">{formatCurrency(item.value)}</td>
                      <td className={`px-6 py-4 text-right font-mono font-medium ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="text-zinc-500 hover:text-indigo-400 p-1"
                            title="Edit Asset"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deletePortfolioItem(item.id)}
                            className="text-zinc-500 hover:text-rose-500 p-1"
                            title="Remove Asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 py-12">
                <p>Your portfolio is empty.</p>
                <Button variant="secondary" onClick={() => handleOpenModal()}>Add your first asset</Button>
              </div>
            )}
          </div>
          {lastUpdated && stats.dataByToken.length > 0 && (
             <div className="px-6 py-2 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between items-center bg-zinc-950 mt-auto">
               <span>
                  Crypto Data: Real-time (CryptoCompare) • Stocks: Market Sim
               </span>
               <span>
                  Updated: {lastUpdated.toLocaleTimeString()}
               </span>
             </div>
          )}
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Portfolio Asset" : "Add Portfolio Asset"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Asset Type</Label>
              <Select 
                id="type"
                value={formData.assetType} 
                onChange={e => setFormData({...formData, assetType: e.target.value as AssetType})}
              >
                <option value="Crypto">Crypto</option>
                <option value="Stock">Stock</option>
              </Select>
            </div>
             <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                id="category"
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="Liquid">Liquid</option>
                <option value="Vested">Vested</option>
                <option value="Farming">Farming</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="token">Ticker / Symbol</Label>
              <Input 
                id="token"
                placeholder={formData.assetType === 'Crypto' ? "e.g. BTC, ETH" : "e.g. AAPL, TSLA"}
                value={formData.token} 
                onChange={e => setFormData({...formData, token: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount Held</Label>
              <Input 
                id="amount"
                type="number"
                step="any"
                placeholder="0.00" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyPrice">Avg Buy Price ($)</Label>
              <Input 
                id="buyPrice"
                type="number"
                step="any"
                placeholder="0.00" 
                value={formData.buyPrice} 
                onChange={e => setFormData({...formData, buyPrice: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="currentPrice">Current Price (Fallback)</Label>
              <Input 
                id="currentPrice"
                type="number"
                step="any"
                placeholder="0.00" 
                value={formData.currentPrice} 
                onChange={e => setFormData({...formData, currentPrice: e.target.value})} 
                required 
              />
              <p className="text-[10px] text-zinc-500 mt-1">Used if live data is unavailable.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingId ? 'Update Asset' : 'Add Asset'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};