export enum Direction {
  LONG = 'Long',
  SHORT = 'Short'
}

export enum Sentiment {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  NEUTRAL = 'Neutral',
  MIXED = 'Mixed'
}

export type AssetType = 'Crypto' | 'Stock';

export interface JournalEntry {
  id: string;
  date: string;
  macroReview: string;
  altsMarket: string;
  summary: string;
  sentiment: Sentiment;
}

export interface PortfolioItem {
  id: string;
  token: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  category: 'Liquid' | 'Vested' | 'Farming';
  assetType: AssetType;
}

export interface Trade {
  id: string;
  date: string;
  ticker: string;
  direction: Direction;
  entryPrice: number;
  exitPrice: number | null; // Null if open
  size: number;
  pnl: number | null;
  status: 'Open' | 'Win' | 'Loss' | 'Breakeven';
  rationale: string;
  exitReason?: string;
  postExitReflection?: string;
}

export interface TabProps {
  isActive: boolean;
}