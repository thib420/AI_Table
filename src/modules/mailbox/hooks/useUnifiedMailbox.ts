import { useState, useEffect, useCallback } from 'react';
import { usePersistentData } from '@/shared/hooks/usePersistentData';
import { Email, MailboxFolder } from './useProgressiveMailbox';
import { Message } from '@microsoft/microsoft-graph-types';
import { useMicrosoftAuth } from '../services/MicrosoftAuthContext';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 168) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getAvatarUrl(name: string) {
  const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
}

function convertGraphMessageToEmail(message: Message, folderType: string = 'inbox'): Email {
  const senderName = message.sender?.emailAddress?.name || message.from?.emailAddress?.name || 'Unknown Sender';
  const senderEmail = message.sender?.emailAddress?.address || message.from?.emailAddress?.address || '';
  
  return {
    id: message.id || '',
    sender: senderName,
    senderEmail,
    subject: message.subject || '(No Subject)',
    preview: message.bodyPreview || '',
    timestamp: message.receivedDateTime || new Date().toISOString(),
    isRead: message.isRead || false,
    isStarred: message.flag?.flagStatus === 'flagged',
    hasAttachments: message.hasAttachments || false,
    folder: folderType,
    avatarUrl: getAvatarUrl(senderName),
    displayTime: formatTimestamp(message.receivedDateTime || new Date().toISOString()),
    webLink: message.webLink || undefined,
    graphMessage: message,
  };
}

export function useUnifiedMailbox() {
  const { isSignedIn } = useMicrosoftAuth();
  const persistentData = usePersistentData();
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<MailboxFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Subscribe to unified data updates
  useEffect(() => {
    if (!isSignedIn || !persistentData.isInitialized) return;

    console.log('📧 useUnifiedMailbox: Subscribing to persistent data service');
    console.log('📧 Persistent mode:', persistentData.isPersistentMode ? 'ENABLED' : 'DISABLED (fallback)');
    
    const unsubscribe = persistentData.subscribe('mailbox', (data) => {
      console.log('📧 useUnifiedMailbox: Received data update', {
        emails: data.emails.length,
        folders: data.folders.length,
        contacts: data.contacts.length,
        isLoading: data.isLoading,
        persistentMode: persistentData.isPersistentMode
      });

      setIsLoading(data.isLoading);

      // Convert folders and add special folders
      const convertedFolders: MailboxFolder[] = [...data.folders];

      // Add starred folder
      convertedFolders.push({
        id: 'starred',
        displayName: 'Starred',
        unreadCount: 0,
        totalCount: data.emails.filter(e => e.isStarred).length,
        isSystemFolder: true,
        icon: 'Star'
      });

      setFolders(convertedFolders);
      setEmails(data.emails);
    });

    // Trigger initial data load
    loadData();

    return () => {
      console.log('📧 useUnifiedMailbox: Unsubscribing from persistent data service');
      unsubscribe();
    };
  }, [isSignedIn, persistentData.isInitialized]);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      await persistentData.getData(forceRefresh);
    } catch (err) {
      console.error('❌ Failed to load unified data:', err);
      setError('Failed to load data from Microsoft Graph');
    }
  }, [persistentData]);

  const refreshEmails = useCallback(async () => {
    console.log('🔄 Refreshing mailbox data...');
    console.log('📧 Using persistent cache:', persistentData.isPersistentMode);
    await loadData(true);
  }, [loadData, persistentData.isPersistentMode]);

  // Mark as read
  const markAsRead = useCallback(async (email: Email) => {
    if (!email.graphMessage?.id) return;

    try {
      // Update local state immediately
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));

      // TODO: Call Microsoft Graph API to mark as read
      console.log('📧 TODO: Mark as read in Microsoft Graph:', email.id);
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }, []);

  // Mark as unread
  const markAsUnread = useCallback(async (email: Email) => {
    if (!email.graphMessage?.id) return;

    try {
      // Update local state immediately
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: false } : e
      ));

      // TODO: Call Microsoft Graph API to mark as unread
      console.log('📧 TODO: Mark as unread in Microsoft Graph:', email.id);
    } catch (error) {
      console.error('Error marking email as unread:', error);
    }
  }, []);

  // Toggle star
  const toggleStar = useCallback(async (email: Email) => {
    if (!email.graphMessage?.id) return;

    try {
      // Update local state immediately
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
      ));

      // TODO: Call Microsoft Graph API to toggle flag
      console.log('📧 TODO: Toggle star in Microsoft Graph:', email.id);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  }, []);

  // Delete email
  const deleteEmail = useCallback(async (email: Email) => {
    if (!email.graphMessage?.id) return;

    try {
      // Remove from local state immediately
      setEmails(prev => prev.filter(e => e.id !== email.id));

      // TODO: Call Microsoft Graph API to delete
      console.log('📧 TODO: Delete in Microsoft Graph:', email.id);
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }, []);

  // Filter emails based on current view and search
  const filteredEmails = emails.filter(email => {
    // Filter by view
    if (currentView === 'starred') return email.isStarred;
    
    // For system and custom folders, match by folder
    return email.folder === currentView || 
           (currentView === 'inbox' && email.folder === 'inbox') ||
           (currentView === 'sent' && email.folder === 'sentitems') ||
           (currentView === 'drafts' && email.folder === 'drafts') ||
           (currentView === 'deletedItems' && email.folder === 'deleteditems');
  }).filter(email =>
    // Filter by search query
    searchQuery === '' ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-mark as read when email is selected
  useEffect(() => {
    if (selectedEmail && !selectedEmail.isRead) {
      markAsRead(selectedEmail);
    }
  }, [selectedEmail, markAsRead]);

  return {
    emails: filteredEmails,
    allEmails: emails,
    folders,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    isLoading,
    error: error || persistentData.error,
    isConnected: isSignedIn,
    isPersistentMode: persistentData.isPersistentMode,
    refreshEmails,
    markAsRead,
    markAsUnread,
    toggleStar,
    deleteEmail,
  };
}

// Helper functions
function isSystemFolder(folderName: string): boolean {
  const systemNames = ['inbox', 'sent items', 'drafts', 'deleted items', 'junk email', 'outbox', 'archive'];
  return systemNames.includes(folderName.toLowerCase());
}

function getFolderIcon(folderName: string): string {
  const name = folderName.toLowerCase();
  if (name === 'inbox') return 'Inbox';
  if (name === 'sent items') return 'Send';
  if (name === 'drafts') return 'Mail';
  if (name === 'deleted items') return 'Trash';
  if (name === 'archive') return 'Archive';
  return 'Folder';
}

function determineFolderType(parentFolderId?: string): string {
  if (!parentFolderId) return 'inbox';
  
  // Map well-known folder IDs to types
  const folderMap: { [key: string]: string } = {
    'inbox': 'inbox',
    'sentitems': 'sent',
    'drafts': 'drafts',
    'deleteditems': 'deletedItems',
    'junkemail': 'junk',
    'archive': 'archive'
  };
  
  const lowerFolderId = parentFolderId.toLowerCase();
  return folderMap[lowerFolderId] || parentFolderId;
} 