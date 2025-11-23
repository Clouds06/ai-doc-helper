import React from 'react';

export type Tab = 'home' | 'documents' | 'chat';

export interface Scenario {
  id: number;
  icon: React.ReactNode;
  title: string;
  query: string;
  desc: string;
  theme: 'yellow' | 'purple' | 'blue' | 'green' | 'red' | 'indigo';
}

export interface DocFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'sheet' | 'md';
  date: string;
  status: 'ready' | 'indexing' | 'error';
  tags: string[];
}

export interface Citation {
  id: string;
  docName: string;
  docType: 'pdf' | 'doc' | 'sheet' | 'md';
  score: number;
  content: string;
  page?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  highlightInfo?: {
    text: string;
    citations: Citation[];
  };
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  date: string;
}
