import { useState, useEffect, useCallback, useMemo } from 'react';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';
import { useProgressiveEmails } from '@/shared/hooks/useProgressiveData';
import { useAuth } from '@/shared/contexts/AuthContext';

export interface MailboxFolder {
  id: string;
  displayName: string;
  unreadCount: number;
  totalCount: number;
  isSystemFolder: boolean;
  icon?: string;
  graphId?: string;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folder: string;
  folderId?: string;
  avatarUrl?: string;
  displayTime?: string;
  webLink?: string;
  graphMessage?: Message;
}

export function useProgressiveMailbox() {
  const { user } = useAuth();
  
  // Use the new progressive data loading
  const {
    emails: rawEmails,
    isLoading: emailsLoading,
    loadingProgress,
    loadMoreWeeks,
    refresh: refreshEmails,
    hasMoreData
  } = useProgressiveEmails(user?.id);

  // Local state for UI
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<string>('inbox');
  const [error, setError] = useState<string | null>(null);

  // Generate default folders
  const defaultFolders: MailboxFolder[] = useMemo(() => [
    {
      id: 'inbox',
      displayName: 'Inbox',
      unreadCount: rawEmails.filter(e => e.folder === 'inbox' && !e.isRead).length,
      totalCount: rawEmails.filter(e => e.folder === 'inbox').length,
      isSystemFolder: true,
      icon: 'Inbox',
    },
    {
      id: 'sent',
      displayName: 'Sent Items',
      unreadCount: 0,
      totalCount: rawEmails.filter(e => e.folder === 'sent').length,
      isSystemFolder: true,
      icon: 'Send',
    },
    {
      id: 'drafts',
      displayName: 'Drafts',
      unreadCount: 0,
      totalCount: rawEmails.filter(e => e.folder === 'drafts').length,
      isSystemFolder: true,
      icon: 'Mail',
    },
    {
      id: 'starred',
      displayName: 'Starred',
      unreadCount: rawEmails.filter(e => e.isStarred && !e.isRead).length,
      totalCount: rawEmails.filter(e => e.isStarred).length,
      isSystemFolder: true,
      icon: 'Star',
    }
  ], [rawEmails]);

  // Filter emails based on current view and search
  const filteredEmails = useMemo(() => {
    let filtered = rawEmails;

    // Filter by folder/view
    if (currentView === 'starred') {
      filtered = filtered.filter(email => email.isStarred);
    } else if (currentView !== 'all') {
      filtered = filtered.filter(email => email.folder === currentView);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(query) ||
        email.sender.toLowerCase().includes(query) ||
        email.senderEmail.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [rawEmails, currentView, searchQuery]);

  // Actions
  const selectEmail = useCallback((email: Email) => {
    setSelectedEmail(email);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEmail(null);
  }, []);

  const searchEmails = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const switchView = useCallback((view: string) => {
    setCurrentView(view);
    setSelectedEmail(null); // Clear selection when switching views
  }, []);

  const markAsRead = useCallback(async (emailId: string) => {
    // Optimistic update - update local state immediately
    setSelectedEmail(prev => 
      prev && prev.id === emailId 
        ? { ...prev, isRead: true }
        : prev
    );

    // TODO: Update via Microsoft Graph API
    // For now, just update local state
    console.log('TODO: Mark email as read via Graph API:', emailId);
  }, []);

  const markAsUnread = useCallback(async (emailId: string) => {
    setSelectedEmail(prev => 
      prev && prev.id === emailId 
        ? { ...prev, isRead: false }
        : prev
    );

    console.log('TODO: Mark email as unread via Graph API:', emailId);
  }, []);

  const toggleStar = useCallback(async (emailId: string) => {
    setSelectedEmail(prev => 
      prev && prev.id === emailId 
        ? { ...prev, isStarred: !prev.isStarred }
        : prev
    );

    console.log('TODO: Toggle star via Graph API:', emailId);
  }, []);

  const deleteEmail = useCallback(async (emailId: string) => {
    // Remove from selection if it was selected
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }

    console.log('TODO: Delete email via Graph API:', emailId);
  }, [selectedEmail]);

  const loadMoreData = useCallback(async (weeks: number = 4) => {
    try {
      await loadMoreWeeks(weeks);
    } catch (error) {
      console.error('Failed to load more data:', error);
      setError('Failed to load more emails');
    }
  }, [loadMoreWeeks]);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      await refreshEmails();
    } catch (error) {
      console.error('Failed to refresh emails:', error);
      setError('Failed to refresh emails');
    }
  }, [refreshEmails]);

  // Calculate loading state
  const isLoading = emailsLoading || loadingProgress.isLoadingWeek;

  return {
    // Data
    emails: filteredEmails,
    allEmails: rawEmails,
    folders: defaultFolders,
    selectedEmail,
    
    // Search & filters
    searchQuery,
    currentView,
    
    // Loading state
    isLoading,
    loadingProgress,
    hasMoreData,
    error,
    
    // Derived state
    hasEmails: rawEmails.length > 0,
    unreadCount: rawEmails.filter(e => !e.isRead).length,
    
    // Actions
    selectEmail,
    clearSelection,
    searchEmails,
    switchView,
    markAsRead,
    markAsUnread,
    toggleStar,
    deleteEmail,
    loadMoreData,
    refresh,
  };
} 