import { useState, useEffect, useCallback } from 'react';
import { persistentUnifiedDataService } from '@/shared/services/PersistentUnifiedDataService';
import { unifiedDataService } from '@/shared/services/UnifiedDataService';
import { useAuth } from '@/shared/contexts/AuthContext';
import type { Email, Contact, Meeting, CRMContact, MailboxFolder } from '@/shared/types/unified-data';

interface UnifiedData {
  emails: Email[];
  contacts: CRMContact[];
  meetings: Meeting[];
  folders: MailboxFolder[];
  isLoading: boolean;
  lastSync: string | null;
}

type SubscriberCallback = (data: UnifiedData) => void;

// Feature flag to enable/disable persistent caching
const USE_PERSISTENT_CACHE = process.env.NEXT_PUBLIC_USE_PERSISTENT_CACHE !== 'false';

export function usePersistentData() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the persistent service when user is available
  useEffect(() => {
    const initializeService = async () => {
      if (!user) {
        setIsInitialized(false);
        return;
      }

      try {
        if (USE_PERSISTENT_CACHE) {
          console.log('🚀 Initializing PersistentUnifiedDataService for user:', user.id);
          await persistentUnifiedDataService.initialize(user.id);
          console.log('✅ PersistentUnifiedDataService initialized');
        }
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('❌ Failed to initialize PersistentUnifiedDataService:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsInitialized(true); // Still allow fallback to work
      }
    };

    initializeService();
  }, [user]);

  // Subscribe to data updates
  const subscribe = useCallback((subscriberId: string, callback: SubscriberCallback) => {
    if (!isInitialized) {
      console.warn('⚠️ Service not initialized yet, subscription will be delayed');
      return () => {}; // Return empty unsubscribe function
    }

    if (USE_PERSISTENT_CACHE && user) {
      console.log(`📡 Using PersistentUnifiedDataService for ${subscriberId}`);
      return persistentUnifiedDataService.subscribe(subscriberId, callback);
    } else {
      console.log(`📡 Falling back to UnifiedDataService for ${subscriberId}`);
      return unifiedDataService.subscribe(subscriberId, (data) => {
        // Convert UnifiedDataService format to PersistentUnifiedDataService format
        const convertedData: UnifiedData = {
          emails: data.emails.map(convertMessageToEmail),
          contacts: data.contacts,
          meetings: data.meetings.map(convertEventToMeeting),
          folders: data.folders.map(convertMailFolderToMailboxFolder),
          isLoading: data.isLoading,
          lastSync: data.lastFetch.toISOString()
        };
        callback(convertedData);
      });
    }
  }, [isInitialized, user]);

  // Get data
  const getData = useCallback(async (forceRefresh = false) => {
    if (!isInitialized) {
      console.warn('⚠️ Service not initialized yet');
      return;
    }

    try {
      if (USE_PERSISTENT_CACHE && user) {
        console.log('🚀 Getting data from PersistentUnifiedDataService');
        return await persistentUnifiedDataService.getData(forceRefresh);
      } else {
        console.log('🚀 Getting data from UnifiedDataService (fallback)');
        const data = await unifiedDataService.getData(forceRefresh);
        
        // Convert format
        return {
          emails: data.emails.map(convertMessageToEmail),
          contacts: data.contacts,
          meetings: data.meetings.map(convertEventToMeeting),
          folders: data.folders.map(convertMailFolderToMailboxFolder),
          isLoading: data.isLoading,
          lastSync: data.lastFetch.toISOString()
        };
      }
    } catch (err) {
      console.error('❌ Failed to get data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [isInitialized, user]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      if (USE_PERSISTENT_CACHE && user) {
        await persistentUnifiedDataService.clearCache();
      } else {
        unifiedDataService.clear();
      }
    } catch (err) {
      console.error('❌ Failed to clear cache:', err);
    }
  }, [user]);

  return {
    subscribe,
    getData,
    clearCache,
    isInitialized,
    isPersistentMode: USE_PERSISTENT_CACHE && !!user,
    error
  };
}

// Helper conversion functions
function convertMessageToEmail(message: any): Email {
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
    folder: determineFolderType(message.parentFolderId),
    folderId: message.parentFolderId,
    avatarUrl: getAvatarUrl(senderName),
    displayTime: formatTimestamp(message.receivedDateTime || new Date().toISOString()),
    webLink: message.webLink || undefined,
    graphMessage: message,
  };
}

function convertEventToMeeting(event: any): Meeting {
  return {
    id: event.id,
    subject: event.subject || 'No Subject',
    startTime: event.start?.dateTime || new Date().toISOString(),
    endTime: event.end?.dateTime || new Date().toISOString(),
    attendees: event.attendees || [],
    organizerEmail: event.organizer?.emailAddress?.address || null,
    location: event.location?.displayName || null,
    isOnlineMeeting: event.isOnlineMeeting || false
  };
}

function convertMailFolderToMailboxFolder(folder: any): MailboxFolder {
  return {
    id: folder.id || '',
    displayName: folder.displayName || 'Unnamed Folder',
    unreadCount: folder.unreadItemCount || 0,
    totalCount: folder.totalItemCount || 0,
    isSystemFolder: isSystemFolder(folder.displayName || ''),
    icon: getFolderIcon(folder.displayName || ''),
    graphId: folder.id
  };
}

// Helper functions
function determineFolderType(parentFolderId?: string): string {
  if (!parentFolderId) return 'inbox';
  
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

function getAvatarUrl(name: string): string {
  const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
} 