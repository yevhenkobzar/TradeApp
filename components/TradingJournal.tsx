import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Button, Input, Textarea, Label, Select } from './ui/Form';
import { useData } from '../context/DataContext';
import { Direction } from '../types';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export const TradingJournal: React.FC = () => {
  const { trades, addTrade, deleteTrade } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    direction: Direction.LONG,
    entryPrice: '',
    exitPrice: '',
    size: '',
    status: 'Open' as 'Open' | 'Win' | 'Loss' | 'Breakeven',
    rationale: '',
    exitReason: ''
  });

  // Sort trades by date desc
  const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Prepare chart data
  const chartData = sortedTrades.slice().reverse().map(trade => ({
    ticker: trade.ticker,
    pnl: trade.pnl || 0,
    date: trade.date
  }));

  const totalRealizedPnl = trades.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
  const closedTradesCount = trades.filter(t => t.status !== 'Open').length;
  const winRate = closedTradesCount > 0 
    ? (trades.filter(t => t.status === 'Win').length / closedTradesCount) * 100 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrade({
      date: formData.date,
      ticker: formData.ticker.toUpperCase(),
      direction: formData.direction,
      entryPrice: Number(formData.entryPrice),
      exitPrice: formData.exitPrice ? Number(formData.exitPrice) : null,
      size: Number(formData.size),
      status: formData.status,
      rationale: formData.rationale,
      exitReason: formData.exitReason || undefined
    });
    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ticker: '',
      direction: Direction.LONG,
      entryPrice: '',
      exitPrice: '',
      size: '',
      status: 'Open',
      rationale: '',
      exitReason: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-500 text-xs font-semibold uppercase">Realized PnL</p>
          <p className={`text-xl font-bold font-mono mt-1 ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-500 text-xs font-semibold uppercase">Win Rate</p>
          <p className="text-xl font-bold font-mono mt-1 text-zinc-100">{winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-500 text-xs font-semibold uppercase">Trades Taken</p>
          <p className="text-xl font-bold font-mono mt-1 text-zinc-100">{trades.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-500 text-xs font-semibold uppercase">Avg R:R</p>
          <p className="text-xl font-bold font-mono mt-1 text-zinc-100">2.4</p>
        </div>
      </div>

      {/* PnL Chart */}
      <Card title="Recent Performance" className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="ticker" 
                tick={{fill: '#71717a', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                tick={{fill: '#71717a', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip 
                cursor={{fill: '#27272a', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'PnL']}
              />
              <ReferenceLine y={0} stroke="#3f3f46" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
             No trades recorded yet.
          </div>
        )}
      </Card>

      {/* Trade History List */}
      <Card 
        title="Trade History" 
        action={
          <div className="flex gap-3">
             <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-100 hover:bg-white text-zinc-900 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Log Trade
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
              <Filter size={16} /> Filter
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {sortedTrades.map((trade) => (
            <div key={trade.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800/50 hover:border-zinc-700 transition-all">
              
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  trade.direction === Direction.LONG 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {trade.direction === Direction.LONG ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {trade.ticker} 
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{trade.direction}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                      trade.status === 'Win' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      trade.status === 'Loss' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      trade.status === 'Open' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>{trade.status}</span>
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono">{trade.date}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 md:mt-0 px-0 md:px-8">
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Entry</p>
                  <p className="font-mono text-sm text-zinc-300">${trade.entryPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Exit</p>
                  <p className="font-mono text-sm text-zinc-300">{trade.exitPrice ? `$${trade.exitPrice}` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Size</p>
                  <p className="font-mono text-sm text-zinc-300">${(trade.size/1000).toFixed(1)}k</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase">PnL</p>
                  <p className={`font-mono text-sm font-bold ${
                    !trade.pnl ? 'text-zinc-400' :
                    trade.pnl > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {trade.pnl ? (trade.pnl > 0 ? '+' : '') + `$${trade.pnl.toLocaleString()}` : 'Open'}
                  </p>
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:w-64 border-l border-zinc-800/50 pl-0 md:pl-6">
                 <p className="text-xs text-zinc-400 italic line-clamp-2">"{trade.rationale}"</p>
              </div>

              <div className="hidden md:flex ml-4 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1">
                <button 
                  onClick={() => {
                    if(confirm('Delete this trade?')) {
                      deleteTrade(trade.id);
                    }
                  }}
                  className="text-zinc-500 hover:text-rose-500 p-2 transition-colors rounded-lg hover:bg-zinc-900"
                  title="Remove Trade"
                >
                  <Trash2 size={18} />
                </button>
                <button className="text-zinc-500 hover:text-white p-2 transition-colors rounded-lg hover:bg-zinc-900">
                  <MoreHorizontal size={18} />
                </button>
              </div>

            </div>
          ))}

           {sortedTrades.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p>No trades logged yet.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Trade">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                id="status"
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="Open">Open</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Breakeven">Breakeven</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker</Label>
              <Input 
                id="ticker"
                placeholder="SOL" 
                value={formData.ticker} 
                onChange={e => setFormData({...formData, ticker: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select 
                id="direction"
                value={formData.direction} 
                onChange={e => setFormData({...formData, direction: e.target.value as Direction})}
              >
                <option value={Direction.LONG}>Long</option>
                <option value={Direction.SHORT}>Short</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entry">Entry Price</Label>
              <Input 
                id="entry"
                type="number"
                step="any"
                placeholder="0.00" 
                value={formData.entryPrice} 
                onChange={e => setFormData({...formData, entryPrice: e.target.value})} 
                required 
              />
            </div>
             <div>
              <Label htmlFor="exit">Exit Price</Label>
              <Input 
                id="exit"
                type="number"
                step="any"
                placeholder="0.00" 
                value={formData.exitPrice} 
                onChange={e => setFormData({...formData, exitPrice: e.target.value})} 
                disabled={formData.status === 'Open'}
              />
            </div>
            <div>
              <Label htmlFor="size">Size ($)</Label>
              <Input 
                id="size"
                type="number"
                step="any"
                placeholder="1000" 
                value={formData.size} 
                onChange={e => setFormData({...formData, size: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="rationale">Rationale / Setup</Label>
            <Textarea 
              id="rationale"
              placeholder="Why did you take this trade?" 
              value={formData.rationale} 
              onChange={e => setFormData({...formData, rationale: e.target.value})}
              required
            />
          </div>

          {formData.status !== 'Open' && (
            <div>
              <Label htmlFor="exitReason">Exit Reason</Label>
              <Textarea 
                id="exitReason"
                className="min-h-[60px]"
                placeholder="Why did you close it?" 
                value={formData.exitReason} 
                onChange={e => setFormData({...formData, exitReason: e.target.value})}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Trade</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};