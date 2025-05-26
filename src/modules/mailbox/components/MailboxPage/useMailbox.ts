import { useState, useEffect, useCallback } from 'react';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftGraphService } from '../../services/microsoft-graph';
import { useMicrosoftAuth } from '../../services/MicrosoftAuthContext';
import { contactSyncService } from '../../services/ContactSyncService';

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
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';
  avatarUrl?: string;
  displayTime?: string;
  webLink?: string;
  graphMessage?: Message; // Store original Graph message for advanced operations
}

const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    senderEmail: 'sarah.johnson@techcorp.com',
    subject: 'RE: Partnership Proposal Discussion',
    preview: 'Thank you for the detailed proposal. I\'ve reviewed it with our team and we\'re very interested in moving forward...',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    folder: 'inbox',
  },
  {
    id: '2',
    sender: 'Michael Chen',
    senderEmail: 'michael.chen@innovate.io',
    subject: 'Integration Meeting Follow-up',
    preview: 'Great meeting today! As discussed, I\'m attaching the technical specifications for the API integration...',
    timestamp: '2024-01-19T15:45:00Z',
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    folder: 'inbox',
  },
  {
    id: '3',
    sender: 'Emily Rodriguez',
    senderEmail: 'emily.r@globaltech.com',
    subject: 'Demo Request - GlobalTech Solutions',
    preview: 'Hi there, I came across your platform and would love to schedule a demo for our team. We\'re particularly interested in...',
    timestamp: '2024-01-19T09:15:00Z',
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    folder: 'inbox',
  }
];

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
    folder: folderType as any,
    avatarUrl: getAvatarUrl(senderName),
    displayTime: formatTimestamp(message.receivedDateTime || new Date().toISOString()),
    webLink: message.webLink,
    graphMessage: message,
  };
}

export function useMailbox() {
  const { isSignedIn, isLoading: authLoading } = useMicrosoftAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'inbox' | 'sent' | 'drafts' | 'archive' | 'starred'>('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data or load real data
  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) return;

      if (isSignedIn) {
        await loadMicrosoftEmails();
      } else {
        // Use mock data when not signed in
        const processedMockEmails = mockEmails.map(email => ({
          ...email,
          avatarUrl: getAvatarUrl(email.sender),
          displayTime: formatTimestamp(email.timestamp),
        }));
        setAllEmails(processedMockEmails);
        setEmails(processedMockEmails);
        
        // Sync mock contacts to CRM
        if (processedMockEmails.length > 0) {
          console.log('🔄 useMailbox: Starting automatic contact sync for initial mock data...');
          contactSyncService.syncContactsInBackground(processedMockEmails).catch(error => {
            console.error('❌ useMailbox: Initial mock data contact sync failed:', error);
          });
        }
      }
    };

    initializeData();
  }, [isSignedIn, authLoading]);

  const loadMicrosoftEmails = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get inbox emails
      const inboxMessages = await microsoftGraphService.getEmails('inbox', 50);
      const inboxEmails = inboxMessages.map(msg => convertGraphMessageToEmail(msg, 'inbox'));

      // Get sent emails
      const sentMessages = await microsoftGraphService.getEmails('sentitems', 20);
      const sentEmails = sentMessages.map(msg => convertGraphMessageToEmail(msg, 'sent'));

      // Combine all emails
      const combinedEmails = [...inboxEmails, ...sentEmails];
      
      setAllEmails(combinedEmails);
      
      // Automatically sync contacts from emails to CRM in the background
      if (combinedEmails.length > 0) {
        console.log('🔄 useMailbox: Starting automatic contact sync to CRM...');
        contactSyncService.syncContactsInBackground(combinedEmails).catch(error => {
          console.error('❌ useMailbox: Background contact sync failed:', error);
        });
      }
      
    } catch (error) {
      console.error('Error loading Microsoft emails:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        isSignedIn,
        authLoading
      });
      setError(`Failed to load emails from Microsoft: ${error instanceof Error ? error.message : 'Unknown error'}. Using offline mode.`);
      
      // Fallback to mock data on error
      const processedMockEmails = mockEmails.map(email => ({
        ...email,
        avatarUrl: getAvatarUrl(email.sender),
        displayTime: formatTimestamp(email.timestamp),
      }));
      setAllEmails(processedMockEmails);
      
      // Sync mock contacts to CRM as well
      if (processedMockEmails.length > 0) {
        console.log('🔄 useMailbox: Starting automatic contact sync for mock data...');
        contactSyncService.syncContactsInBackground(processedMockEmails).catch(error => {
          console.error('❌ useMailbox: Mock data contact sync failed:', error);
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Mark email as read in Microsoft Graph
  const markAsRead = useCallback(async (email: Email) => {
    if (!isSignedIn || !email.graphMessage?.id) return;

    try {
      await microsoftGraphService.markAsRead(email.graphMessage.id);
      
      // Update local state
      setAllEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }, [isSignedIn]);

  // Toggle star/flag in Microsoft Graph
  const toggleStar = useCallback(async (email: Email) => {
    if (!isSignedIn || !email.graphMessage?.id) return;

    try {
      await microsoftGraphService.setFlag(email.graphMessage.id, !email.isStarred);
      
      // Update local state
      setAllEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  }, [isSignedIn]);

  // Refresh emails
  const refreshEmails = useCallback(async () => {
    if (isSignedIn) {
      await loadMicrosoftEmails();
    }
  }, [isSignedIn, loadMicrosoftEmails]);

  // Filter emails based on current view and search
  const filteredEmails = allEmails.filter(email => {
    // Filter by view
    if (currentView === 'starred') return email.isStarred;
    return email.folder === currentView;
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
    allEmails,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    isLoading,
    error,
    isConnected: isSignedIn,
    markAsRead,
    toggleStar,
    refreshEmails,
  };
} 