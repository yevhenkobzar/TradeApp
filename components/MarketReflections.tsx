import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Button, Input, Textarea, Label, Select } from './ui/Form';
import { useData } from '../context/DataContext';
import { Calendar, TrendingUp, TrendingDown, Minus, Activity, Trash2 } from 'lucide-react';
import { Sentiment } from '../types';

const SentimentBadge = ({ sentiment }: { sentiment: Sentiment }) => {
  switch (sentiment) {
    case Sentiment.BULLISH:
      return <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium"><TrendingUp size={14} /> Bullish</span>;
    case Sentiment.BEARISH:
      return <span className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-1 rounded text-xs font-medium"><TrendingDown size={14} /> Bearish</span>;
    case Sentiment.NEUTRAL:
      return <span className="flex items-center gap-1 text-zinc-400 bg-zinc-400/10 px-2 py-1 rounded text-xs font-medium"><Minus size={14} /> Neutral</span>;
    default:
      return <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs font-medium"><Activity size={14} /> Mixed</span>;
  }
};

export const MarketReflections: React.FC = () => {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    macroReview: '',
    altsMarket: '',
    summary: '',
    sentiment: Sentiment.NEUTRAL
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJournalEntry(formData);
    setIsModalOpen(false);
    // Reset form except date
    setFormData({
      date: new Date().toISOString().split('T')[0],
      macroReview: '',
      altsMarket: '',
      summary: '',
      sentiment: Sentiment.NEUTRAL
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Reflections</h2>
          <p className="text-zinc-400 text-sm mt-1">Daily macro analysis and market structure notes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Calendar size={16} />
          New Entry
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {journalEntries.map((entry) => (
          <Card key={entry.id} className="border-l-4 border-l-zinc-700 hover:border-l-indigo-500 transition-all duration-300 group relative">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Date & Meta Column */}
              <div className="md:w-48 flex-shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-100 font-mono text-lg font-bold">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    {entry.date}
                  </div>
                </div>
                <div>
                  <SentimentBadge sentiment={entry.sentiment} />
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-2">
                  Market Context
                </div>
                
                {/* Delete button (Visible on hover for desktop, always for mobile/touch if active) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Are you sure you want to delete this entry?')) {
                      deleteJournalEntry(entry.id);
                    }
                  }}
                  className="mt-2 flex items-center gap-2 text-zinc-600 hover:text-rose-500 transition-colors text-xs font-medium md:opacity-0 md:group-hover:opacity-100 w-fit"
                >
                  <Trash2 size={14} /> Remove Entry
                </button>
              </div>

              {/* Content Column */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    Macro Review
                  </h4>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.macroReview}
                  </p>
                </div>
                
                <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    ALTs Market
                  </h4>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.altsMarket}
                  </p>
                </div>

                <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50 md:col-span-2 lg:col-span-1">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    Performance Summary
                  </h4>
                  <p className="text-zinc-300 text-sm leading-relaxed italic border-l-2 border-emerald-500/20 pl-3">
                    "{entry.summary}"
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {journalEntries.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>No market reflections recorded yet.</p>
            <p className="text-sm mt-2">Start your trading day by analyzing the market structure.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Daily Reflection">
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
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select 
                id="sentiment"
                value={formData.sentiment} 
                onChange={e => setFormData({...formData, sentiment: e.target.value as Sentiment})}
              >
                <option value={Sentiment.BULLISH}>Bullish</option>
                <option value={Sentiment.BEARISH}>Bearish</option>
                <option value={Sentiment.NEUTRAL}>Neutral</option>
                <option value={Sentiment.MIXED}>Mixed</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="macro">Macro Review</Label>
            <Textarea 
              id="macro"
              placeholder="What's happening in the broader market?" 
              value={formData.macroReview} 
              onChange={e => setFormData({...formData, macroReview: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="alts">Altcoin Market Structure</Label>
            <Textarea 
              id="alts"
              placeholder="Which sectors are moving? Specific ticker notes?" 
              value={formData.altsMarket} 
              onChange={e => setFormData({...formData, altsMarket: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="summary">Day Summary</Label>
            <Textarea 
              id="summary"
              className="min-h-[80px]"
              placeholder="Brief summary of your performance and mental state..." 
              value={formData.summary} 
              onChange={e => setFormData({...formData, summary: e.target.value})}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};