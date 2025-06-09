import { useState, useMemo } from 'react';
import type { Email } from '@/shared/types/unified-data';

export function useMailboxFilters(emails: Email[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('inbox');

  // Filter emails based on current view and search
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Filter by view
      let viewMatch = false;
      if (currentView === 'starred') {
        viewMatch = email.isStarred;
      } else {
        // For system and custom folders, match by folder
        viewMatch = email.folder === currentView || 
                   (currentView === 'inbox' && email.folder === 'inbox') ||
                   (currentView === 'sent' && email.folder === 'sentitems') ||
                   (currentView === 'drafts' && email.folder === 'drafts') ||
                   (currentView === 'deletedItems' && email.folder === 'deleteditems');
      }

      if (!viewMatch) return false;

      // Filter by search query
      if (searchQuery === '') return true;
      
      const query = searchQuery.toLowerCase();
      return email.sender.toLowerCase().includes(query) ||
             email.subject.toLowerCase().includes(query) ||
             email.preview.toLowerCase().includes(query);
    });
  }, [emails, currentView, searchQuery]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return emails.filter(email => !email.isRead).length;
  }, [emails]);

  return {
    filteredEmails,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    unreadCount,
    hasEmails: emails.length > 0
  };
}