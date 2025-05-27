import { useState, useEffect, useCallback } from 'react';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftGraphService } from '../../services/microsoft-graph';
import { useMicrosoftAuth } from '../../services/MicrosoftAuthContext';
import { contactSyncService } from '../../services/ContactSyncService';

export interface MailboxFolder {
  id: string;
  displayName: string;
  unreadCount: number;
  totalCount: number;
  isSystemFolder: boolean;
  icon?: string;
  graphId?: string; // The actual Microsoft Graph folder ID
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
  folder: string; // Changed from union type to string to support custom folder IDs
  folderId?: string; // Add explicit folder ID
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

function convertGraphMessageToEmail(message: Message, folderType: string = 'inbox', folderId?: string): Email {
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
    folderId: folderId,
    avatarUrl: getAvatarUrl(senderName),
    displayTime: formatTimestamp(message.receivedDateTime || new Date().toISOString()),
    webLink: message.webLink || undefined,
    graphMessage: message,
  };
}

export function useMailbox() {
  const { isSignedIn, isLoading: authLoading } = useMicrosoftAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<MailboxFolder[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<string>('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data or load real data
  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) return;

      if (isSignedIn) {
        await loadMailFolders();
        await loadMicrosoftEmails();
      } else {
        // Use mock data when not signed in
        setFolders(getDefaultFolders());
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

  // Get default system folders for demo mode
  const getDefaultFolders = (): MailboxFolder[] => [
    { id: 'inbox', displayName: 'Inbox', unreadCount: 3, totalCount: 15, isSystemFolder: true, icon: 'Inbox' },
    { id: 'sent', displayName: 'Sent Items', unreadCount: 0, totalCount: 8, isSystemFolder: true, icon: 'Send' },
    { id: 'drafts', displayName: 'Drafts', unreadCount: 0, totalCount: 2, isSystemFolder: true, icon: 'Mail' },
    { id: 'deletedItems', displayName: 'Deleted Items', unreadCount: 0, totalCount: 12, isSystemFolder: true, icon: 'Trash' },
    { id: 'archive', displayName: 'Archive', unreadCount: 0, totalCount: 45, isSystemFolder: true, icon: 'Archive' },
    { id: 'starred', displayName: 'Starred', unreadCount: 1, totalCount: 5, isSystemFolder: true, icon: 'Star' },
  ];

  // Load mail folders from Microsoft Graph
  const loadMailFolders = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      console.log('📁 Loading mail folders from Microsoft Graph...');
      const graphFolders = await microsoftGraphService.getMailFolders();
      console.log('📁 Raw Graph folders received:', graphFolders);
      
      const systemFolders = getDefaultFolders();
      const customFolders: MailboxFolder[] = [];

      // Update system folders with actual Graph folder IDs and counts
      const updatedSystemFolders = systemFolders.map(sysFolder => {
        const matchingGraphFolder = graphFolders.find(f => 
          isMatchingSystemFolder(f.displayName || '', sysFolder.id)
        );
        
        console.log(`🔍 Looking for system folder "${sysFolder.id}" (${sysFolder.displayName})`);
        console.log('🔍 Found matching Graph folder:', matchingGraphFolder);
        
        if (matchingGraphFolder) {
          const updatedFolder = {
            ...sysFolder,
            id: sysFolder.id, // Keep our system ID for consistency
            graphId: matchingGraphFolder.id, // Store the actual Graph ID separately
            unreadCount: matchingGraphFolder.unreadItemCount || 0,
            totalCount: matchingGraphFolder.totalItemCount || 0,
          };
          console.log(`✅ Updated system folder "${sysFolder.id}":`, updatedFolder);
          return updatedFolder;
        }
        console.log(`⚠️ No matching Graph folder found for "${sysFolder.id}"`);
        return sysFolder;
      });

      // Add custom folders (excluding system folders)
      graphFolders.forEach(folder => {
        if (!isSystemFolderName(folder.displayName || '')) {
          customFolders.push({
            id: `custom_${folder.id}`, // Prefix to avoid conflicts with system folder IDs
            displayName: folder.displayName || 'Unnamed Folder',
            unreadCount: folder.unreadItemCount || 0,
            totalCount: folder.totalItemCount || 0,
            isSystemFolder: false,
            icon: 'Folder',
            graphId: folder.id // Store the actual Graph ID
          });
        }
      });

      // Create final folder list with guaranteed unique IDs
      const allFolders = [...updatedSystemFolders, ...customFolders];
      console.log('📁 Final folder list:', allFolders);
      
      setFolders(allFolders);
      console.log(`✅ Loaded ${updatedSystemFolders.length} system folders and ${customFolders.length} custom folders`);
    } catch (error) {
      console.error('❌ Failed to load mail folders:', error);
      // Fallback to default folders
      setFolders(getDefaultFolders());
    }
  }, [isSignedIn]);

  // Helper function to check if a folder name is a system folder
  const isSystemFolderName = (folderName: string): boolean => {
    const systemNames = ['inbox', 'sent items', 'drafts', 'deleted items', 'junk email', 'outbox'];
    return systemNames.includes(folderName.toLowerCase());
  };

  // Helper function to match Graph folder names to our system folder IDs
  const isMatchingSystemFolder = (graphFolderName: string, systemFolderId: string): boolean => {
    const folderName = graphFolderName.toLowerCase();
    switch (systemFolderId) {
      case 'inbox': return folderName === 'inbox';
      case 'sent': return folderName === 'sent items';
      case 'drafts': return folderName === 'drafts';
      case 'deletedItems': return folderName === 'deleted items';
      case 'archive': return folderName === 'archive';
      default: return false;
    }
  };

  const loadMicrosoftEmails = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📧 Loading emails from Microsoft Graph...');
      const emailIdMap = new Map<string, Email>(); // Track emails by ID to prevent duplicates

      // Load emails from system folders
      const systemFolderMappings = [
        { id: 'inbox', graphId: 'inbox', displayName: 'Inbox' },
        { id: 'sent', graphId: 'sentitems', displayName: 'Sent Items' },
        { id: 'drafts', graphId: 'drafts', displayName: 'Drafts' },
        { id: 'deletedItems', graphId: 'deleteditems', displayName: 'Deleted Items' },
      ];

      for (const folderMapping of systemFolderMappings) {
        try {
          console.log(`📂 Loading emails from ${folderMapping.displayName}...`);
          
          // Find the actual folder to get the real graphId if available
          const actualFolder = folders.find(f => f.id === folderMapping.id);
          const graphIdToUse = actualFolder?.graphId || folderMapping.graphId;
          
          const messages = await microsoftGraphService.getEmails(graphIdToUse, 50);
          const folderEmails = messages.map(msg => 
            convertGraphMessageToEmail(msg, folderMapping.id, graphIdToUse)
          );
          
          // Add emails to map, preventing duplicates
          folderEmails.forEach(email => {
            if (!emailIdMap.has(email.id)) {
              emailIdMap.set(email.id, email);
            }
          });
          
          console.log(`✅ Loaded ${folderEmails.length} emails from ${folderMapping.displayName}`);
        } catch (error) {
          console.error(`❌ Failed to load emails from ${folderMapping.displayName}:`, error);
        }
      }

      // Load emails from custom folders
      const customFolders = folders.filter(f => !f.isSystemFolder);
      for (const folder of customFolders) {
        try {
          console.log(`📂 Loading emails from custom folder: ${folder.displayName}...`);
          const graphIdToUse = folder.graphId || folder.id.replace('custom_', '');
          const messages = await microsoftGraphService.getEmails(graphIdToUse, 20);
          const folderEmails = messages.map(msg => 
            convertGraphMessageToEmail(msg, folder.id, graphIdToUse)
          );
          
          // Add emails to map, preventing duplicates
          folderEmails.forEach(email => {
            if (!emailIdMap.has(email.id)) {
              emailIdMap.set(email.id, email);
            }
          });
          
          console.log(`✅ Loaded ${folderEmails.length} emails from ${folder.displayName}`);
        } catch (error) {
          console.error(`❌ Failed to load emails from ${folder.displayName}:`, error);
        }
      }
      
      // Convert map back to array
      const deduplicatedEmails = Array.from(emailIdMap.values());
      
      setAllEmails(deduplicatedEmails);
      console.log(`✅ Total unique emails loaded: ${deduplicatedEmails.length}`);
      
      // Automatically sync contacts from emails to CRM in the background
      if (deduplicatedEmails.length > 0) {
        console.log('🔄 useMailbox: Starting automatic contact sync to CRM...');
        contactSyncService.syncContactsInBackground(deduplicatedEmails).catch(error => {
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
  }, [isSignedIn, folders]);

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

  // Mark email as unread in Microsoft Graph
  const markAsUnread = useCallback(async (email: Email) => {
    if (!isSignedIn || !email.graphMessage?.id) return;

    try {
      await microsoftGraphService.markAsUnread(email.graphMessage.id);
      
      // Update local state
      setAllEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: false } : e
      ));
    } catch (error) {
      console.error('Error marking email as unread:', error);
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

  // Delete email from Microsoft Graph and local state
  const deleteEmail = useCallback(async (email: Email) => {
    try {
      console.log('🗑️ Deleting email:', email.subject, 'ID:', email.id);
      
      // If connected to Microsoft Graph, move to Deleted Items folder
      if (isSignedIn && email.graphMessage?.id) {
        console.log('📧 Connected to Graph, moving to Deleted Items...');
        
        // First try to get the actual Deleted Items folder ID from Microsoft Graph
        let actualDeletedItemsFolderId = null;
        try {
          actualDeletedItemsFolderId = await microsoftGraphService.getDeletedItemsFolder();
          console.log('📁 Actual Deleted Items folder ID from Graph:', actualDeletedItemsFolderId);
        } catch (error) {
          console.warn('⚠️ Failed to get actual Deleted Items folder ID:', error);
        }
        
        // Prepare list of folder IDs to try
        const possibleDeletedFolderIds = [];
        
        // Add the actual folder ID first if we found it
        if (actualDeletedItemsFolderId) {
          possibleDeletedFolderIds.push(actualDeletedItemsFolderId);
        }
        
        // Add our stored folder ID if available
        const deletedItemsFolder = folders.find(f => 
          f.id === 'deletedItems' || 
          f.displayName?.toLowerCase().includes('deleted') ||
          f.displayName?.toLowerCase().includes('trash')
        );
        
        if (deletedItemsFolder?.graphId) {
          possibleDeletedFolderIds.push(deletedItemsFolder.graphId);
        }
        
        // Add Microsoft Graph well-known folder names
        possibleDeletedFolderIds.push(
          'deleteditems',  // Standard well-known name
          'deletedItems',  // Alternative format
          'trash'          // Some systems use this
        );
        
        // Remove duplicates
        const uniqueFolderIds = [...new Set(possibleDeletedFolderIds)];
        console.log('📁 Will try these folder IDs in order:', uniqueFolderIds);
        
        let moveSuccessful = false;
        let lastError = null;
        
        // Try each possible folder ID until one works
        for (const folderId of uniqueFolderIds) {
          try {
            console.log(`📍 Trying to move to folder ID: ${folderId}`);
            await microsoftGraphService.moveEmail(email.graphMessage.id, folderId);
            console.log('✅ Email moved successfully to Deleted Items using ID:', folderId);
            
            // Update local state - move email to deletedItems folder
            setAllEmails(prev => prev.map(e => 
              e.id === email.id 
                ? { ...e, folder: 'deletedItems', folderId: folderId }
                : e
            ));
            
            moveSuccessful = true;
            break;
            
          } catch (moveError) {
            console.warn(`⚠️ Failed to move to folder "${folderId}":`, moveError);
            lastError = moveError;
            continue;
          }
        }
        
        if (!moveSuccessful) {
          console.error('❌ All move attempts failed. Last error:', lastError);
          console.log('🔄 Falling back to permanent deletion...');
          
          // Fallback: permanently delete if all move attempts fail
          await microsoftGraphService.deleteEmail(email.graphMessage.id);
          
          // Remove from local state since it's permanently deleted
          setAllEmails(prev => prev.filter(e => e.id !== email.id));
          console.log('⚠️ Email permanently deleted as fallback');
        }
        
      } else {
        // For demo mode or when not connected, just remove from local state
        setAllEmails(prev => prev.filter(e => e.id !== email.id));
        console.log('✅ Email removed from demo mode:', email.subject);
      }
      
      // If the deleted email was selected, clear selection
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      
    } catch (error) {
      console.error('Error deleting email:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }, [isSignedIn, selectedEmail, folders]);

  // Refresh emails and folders
  const refreshEmails = useCallback(async () => {
    if (isSignedIn) {
      await loadMailFolders();
      await loadMicrosoftEmails();
    }
  }, [isSignedIn, loadMailFolders, loadMicrosoftEmails]);

  // Filter emails based on current view and search
  const filteredEmails = allEmails.filter(email => {
    // Filter by view
    if (currentView === 'starred') return email.isStarred;
    
    // For system and custom folders, match by our folder ID
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
    folders,
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
    markAsUnread,
    toggleStar,
    deleteEmail,
    refreshEmails,
    loadMailFolders,
  };
} 