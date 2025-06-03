import { supabase } from '@/shared/lib/supabase/client';
import { Email, MailboxFolder } from '../components/MailboxPage/useMailbox';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';

interface CachedEmail {
  id: string;
  user_id: string;
  graph_message_id: string;
  folder_id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body_preview: string | null;
  received_date_time: string | null;
  is_read: boolean;
  is_flagged: boolean;
  has_attachments: boolean;
  importance: string;
  to_recipients: any;
  cc_recipients: any;
  bcc_recipients: any;
  raw_message_data: any;
  web_link: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

interface CachedFolder {
  id: string;
  user_id: string;
  graph_folder_id: string;
  display_name: string;
  parent_folder_id: string | null;
  unread_count: number;
  total_count: number;
  is_system_folder: boolean;
  folder_type: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

interface SyncStatus {
  id: string;
  user_id: string;
  last_full_sync_at: string | null;
  last_incremental_sync_at: string | null;
  next_sync_due_at: string | null;
  sync_enabled: boolean;
  sync_interval_minutes: number;
  max_emails_per_folder: number;
  total_emails_cached: number;
  total_folders_cached: number;
  last_sync_duration_ms: number | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export class EmailCacheService {
  private userId: string | null = null;

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    
    // Initialize sync status if it doesn't exist
    const { data: existingStatus } = await supabase
      .from('email_sync_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingStatus) {
      await supabase
        .from('email_sync_status')
        .insert({
          user_id: userId,
          sync_enabled: true,
          sync_interval_minutes: 15,
          max_emails_per_folder: 100,
          total_emails_cached: 0,
          total_folders_cached: 0,
          next_sync_due_at: new Date().toISOString()
        });
    }
  }

  private ensureUserId(): string {
    if (!this.userId) {
      throw new Error('EmailCacheService not initialized with user ID');
    }
    return this.userId;
  }

  // ===== FOLDER OPERATIONS =====

  async ensureFoldersExist(folderMappings: Array<{graphId: string, folderType: string, displayName: string}>): Promise<void> {
    const userId = this.ensureUserId();
    
    console.log(`📁 Ensuring ${folderMappings.length} folders exist in cache...`);

    // Check which folders already exist
    const existingFolders = await supabase
      .from('email_folders')
      .select('graph_folder_id')
      .eq('user_id', userId)
      .in('graph_folder_id', folderMappings.map(f => f.graphId));

    const existingFolderIds = new Set(existingFolders.data?.map(f => f.graph_folder_id) || []);
    
    // Create missing folders
    const missingFolders = folderMappings.filter(f => !existingFolderIds.has(f.graphId));
    
    if (missingFolders.length > 0) {
      console.log(`📁 Creating ${missingFolders.length} missing folders...`);
      
      const folderData = missingFolders.map(folder => ({
        user_id: userId,
        graph_folder_id: folder.graphId,
        display_name: folder.displayName,
        unread_count: 0,
        total_count: 0,
        is_system_folder: this.isSystemFolderFromType(folder.folderType),
        folder_type: folder.folderType,
        last_synced_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('email_folders')
        .insert(folderData);

      if (error) {
        console.error('Error creating missing folders:', error);
        throw error;
      }

      console.log(`✅ Created ${missingFolders.length} missing folders`);
    }
  }

  async getCachedFolders(): Promise<MailboxFolder[]> {
    const userId = this.ensureUserId();
    
    const { data: folders, error } = await supabase
      .from('email_folders')
      .select('*')
      .eq('user_id', userId)
      .order('display_name');

    if (error) {
      console.error('Error fetching cached folders:', error);
      return [];
    }

    return folders.map(folder => this.convertCachedFolderToMailboxFolder(folder));
  }

  async cacheFolders(folders: MailFolder[]): Promise<void> {
    const userId = this.ensureUserId();
    
    console.log(`📁 Caching ${folders.length} folders for user ${userId}`);

    // Prepare folder data for insert/upsert
    const folderData = folders.map(folder => ({
      user_id: userId,
      graph_folder_id: folder.id || '',
      display_name: folder.displayName || 'Unnamed Folder',
      parent_folder_id: folder.parentFolderId || null,
      unread_count: folder.unreadItemCount || 0,
      total_count: folder.totalItemCount || 0,
      is_system_folder: this.isSystemFolder(folder.displayName || ''),
      folder_type: this.getFolderType(folder.displayName || ''),
      last_synced_at: new Date().toISOString()
    }));

    // Use upsert to handle existing folders
    const { error } = await supabase
      .from('email_folders')
      .upsert(folderData, { 
        onConflict: 'user_id,graph_folder_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error caching folders:', error);
      throw error;
    }

    // Update sync status
    await this.updateSyncStatus({
      total_folders_cached: folders.length
    });

    console.log(`✅ Successfully cached ${folders.length} folders`);
  }

  async ensureFoldersExist(folderMappings: Array<{
    graphId: string;
    folderType: string;
    displayName: string;
  }>): Promise<void> {
    const userId = this.ensureUserId();
    
    console.log(`📁 Ensuring ${folderMappings.length} system folders exist in cache...`);

    // Prepare folder data for system folders
    const folderData = folderMappings.map(mapping => ({
      user_id: userId,
      graph_folder_id: mapping.graphId,
      display_name: mapping.displayName,
      parent_folder_id: null,
      unread_count: 0,
      total_count: 0,
      is_system_folder: true,
      folder_type: mapping.folderType,
      last_synced_at: new Date().toISOString()
    }));

    // Use upsert to create folders if they don't exist
    const { error } = await supabase
      .from('email_folders')
      .upsert(folderData, { 
        onConflict: 'user_id,graph_folder_id',
        ignoreDuplicates: true // Don't update existing folders, just ensure they exist
      });

    if (error) {
      console.error('Error ensuring folders exist:', error);
      throw error;
    }

    console.log(`✅ System folders ensured in cache`);
  }

  // ===== EMAIL OPERATIONS =====

  async getCachedEmails(folderId?: string): Promise<Email[]> {
    const userId = this.ensureUserId();
    
    let query = supabase
      .from('emails')
      .select(`
        *,
        email_folders!inner(
          id,
          display_name,
          folder_type,
          graph_folder_id
        )
      `)
      .eq('user_id', userId)
      .order('received_date_time', { ascending: false });

    if (folderId) {
      // If folderId is provided, filter by it
      const { data: folder } = await supabase
        .from('email_folders')
        .select('id')
        .eq('user_id', userId)
        .eq('graph_folder_id', folderId)
        .single();

      if (folder) {
        query = query.eq('folder_id', folder.id);
      }
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('Error fetching cached emails:', error);
      return [];
    }

    return emails.map(email => this.convertCachedEmailToEmail(email));
  }

  async cacheEmails(emails: Message[], folderId: string, folderType: string = 'inbox'): Promise<void> {
    const userId = this.ensureUserId();
    
    console.log(`📧 Caching ${emails.length} emails for folder ${folderId}`);

    // Get the internal folder ID, or create the folder if it doesn't exist
    let { data: folder } = await supabase
      .from('email_folders')
      .select('id')
      .eq('user_id', userId)
      .eq('graph_folder_id', folderId)
      .single();

    if (!folder) {
      console.log(`📁 Folder not found for graph ID: ${folderId}, creating it...`);
      
      // Create the folder if it doesn't exist
      const { data: newFolder, error: createError } = await supabase
        .from('email_folders')
        .insert({
          user_id: userId,
          graph_folder_id: folderId,
          display_name: this.getFolderDisplayName(folderId, folderType),
          unread_count: 0,
          total_count: 0,
          is_system_folder: this.isSystemFolderFromType(folderType),
          folder_type: folderType,
          last_synced_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`Failed to create folder for graph ID: ${folderId}`, createError);
        return;
      }
      
      folder = newFolder;
      console.log(`✅ Created folder for graph ID: ${folderId}`);
    }

    // Prepare email data for insert/upsert
    const emailData = emails.map(email => ({
      user_id: userId,
      graph_message_id: email.id || '',
      folder_id: folder.id,
      sender_name: email.sender?.emailAddress?.name || email.from?.emailAddress?.name || null,
      sender_email: email.sender?.emailAddress?.address || email.from?.emailAddress?.address || null,
      subject: email.subject || null,
      body_preview: email.bodyPreview || null,
      received_date_time: email.receivedDateTime || null,
      is_read: email.isRead || false,
      is_flagged: email.flag?.flagStatus === 'flagged',
      has_attachments: email.hasAttachments || false,
      importance: email.importance || 'normal',
      to_recipients: email.toRecipients || null,
      cc_recipients: email.ccRecipients || null,
      bcc_recipients: email.bccRecipients || null,
      raw_message_data: email,
      web_link: email.webLink || null,
      last_synced_at: new Date().toISOString()
    }));

    // Use upsert to handle existing emails
    const { error } = await supabase
      .from('emails')
      .upsert(emailData, { 
        onConflict: 'user_id,graph_message_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error caching emails:', error);
      throw error;
    }

    console.log(`✅ Successfully cached ${emails.length} emails for folder ${folderId}`);
  }

  async updateEmailStatus(graphMessageId: string, updates: {
    is_read?: boolean;
    is_flagged?: boolean;
  }): Promise<void> {
    const userId = this.ensureUserId();

    const { error } = await supabase
      .from('emails')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('graph_message_id', graphMessageId);

    if (error) {
      console.error('Error updating email status:', error);
      throw error;
    }
  }

  async deleteEmailFromCache(graphMessageId: string): Promise<void> {
    const userId = this.ensureUserId();

    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('user_id', userId)
      .eq('graph_message_id', graphMessageId);

    if (error) {
      console.error('Error deleting email from cache:', error);
      throw error;
    }
  }

  // ===== SYNC STATUS OPERATIONS =====

  async getSyncStatus(): Promise<SyncStatus | null> {
    const userId = this.ensureUserId();

    const { data, error } = await supabase
      .from('email_sync_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching sync status:', error);
      return null;
    }

    return data;
  }

  async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    const userId = this.ensureUserId();

    const { error } = await supabase
      .from('email_sync_status')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  async isSyncDue(): Promise<boolean> {
    const status = await this.getSyncStatus();
    if (!status || !status.sync_enabled) return false;

    const now = new Date();
    const nextSyncDue = status.next_sync_due_at ? new Date(status.next_sync_due_at) : now;
    
    return now >= nextSyncDue;
  }

  async markSyncComplete(duration: number, error?: string): Promise<void> {
    const now = new Date();
    const nextSync = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    await this.updateSyncStatus({
      last_incremental_sync_at: now.toISOString(),
      next_sync_due_at: nextSync.toISOString(),
      last_sync_duration_ms: duration,
      last_sync_error: error || null
    });
  }

  // ===== SEARCH AND FILTER =====

  async searchEmails(query: string): Promise<Email[]> {
    const userId = this.ensureUserId();

    const { data: emails, error } = await supabase
      .from('emails')
      .select(`
        *,
        email_folders!inner(
          id,
          display_name,
          folder_type,
          graph_folder_id
        )
      `)
      .eq('user_id', userId)
      .or(`subject.ilike.%${query}%,sender_name.ilike.%${query}%,sender_email.ilike.%${query}%,body_preview.ilike.%${query}%`)
      .order('received_date_time', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error searching emails:', error);
      return [];
    }

    return emails.map(email => this.convertCachedEmailToEmail(email));
  }

  async getStarredEmails(): Promise<Email[]> {
    const userId = this.ensureUserId();

    const { data: emails, error } = await supabase
      .from('emails')
      .select(`
        *,
        email_folders!inner(
          id,
          display_name,
          folder_type,
          graph_folder_id
        )
      `)
      .eq('user_id', userId)
      .eq('is_flagged', true)
      .order('received_date_time', { ascending: false });

    if (error) {
      console.error('Error fetching starred emails:', error);
      return [];
    }

    return emails.map(email => this.convertCachedEmailToEmail(email));
  }

  // ===== HELPER METHODS =====

  private isSystemFolder(displayName: string): boolean {
    const systemNames = ['inbox', 'sent items', 'drafts', 'deleted items', 'junk email', 'outbox'];
    return systemNames.includes(displayName.toLowerCase());
  }

  private isSystemFolderFromType(folderType: string): boolean {
    const systemTypes = ['inbox', 'sent', 'drafts', 'deletedItems', 'junk', 'custom'];
    return systemTypes.includes(folderType) && folderType !== 'custom';
  }

  private getFolderDisplayName(graphFolderId: string, folderType: string): string {
    // Map common folder IDs to display names
    const folderNameMap: { [key: string]: string } = {
      'inbox': 'Inbox',
      'sentitems': 'Sent Items',
      'drafts': 'Drafts',
      'deleteditems': 'Deleted Items',
      'junkemail': 'Junk Email',
      'outbox': 'Outbox',
      'archive': 'Archive'
    };

    const lowerGraphId = graphFolderId.toLowerCase();
    return folderNameMap[lowerGraphId] || folderNameMap[folderType] || `Folder (${graphFolderId})`;
  }

  private getFolderType(displayName: string): string {
    const name = displayName.toLowerCase();
    if (name === 'inbox') return 'inbox';
    if (name === 'sent items') return 'sent';
    if (name === 'drafts') return 'drafts';
    if (name === 'deleted items') return 'deletedItems';
    if (name === 'junk email') return 'junk';
    if (name === 'archive') return 'archive';
    return 'custom';
  }

  private convertCachedFolderToMailboxFolder(cached: CachedFolder): MailboxFolder {
    return {
      id: cached.folder_type || cached.graph_folder_id,
      displayName: cached.display_name,
      unreadCount: cached.unread_count,
      totalCount: cached.total_count,
      isSystemFolder: cached.is_system_folder,
      icon: this.getFolderIcon(cached.folder_type),
      graphId: cached.graph_folder_id
    };
  }

  private convertCachedEmailToEmail(cached: any): Email {
    const folder = cached.email_folders;
    const folderType = folder.folder_type || folder.graph_folder_id;

    return {
      id: cached.graph_message_id,
      sender: cached.sender_name || 'Unknown Sender',
      senderEmail: cached.sender_email || '',
      subject: cached.subject || '(No Subject)',
      preview: cached.body_preview || '',
      timestamp: cached.received_date_time || new Date().toISOString(),
      isRead: cached.is_read,
      isStarred: cached.is_flagged,
      hasAttachments: cached.has_attachments,
      folder: folderType,
      folderId: folder.graph_folder_id,
      avatarUrl: this.getAvatarUrl(cached.sender_name || ''),
      displayTime: this.formatTimestamp(cached.received_date_time || ''),
      webLink: cached.web_link,
      graphMessage: cached.raw_message_data
    };
  }

  private getFolderIcon(folderType?: string): string {
    switch (folderType) {
      case 'inbox': return 'Inbox';
      case 'sent': return 'Send';
      case 'drafts': return 'Mail';
      case 'deletedItems': return 'Trash';
      case 'archive': return 'Archive';
      default: return 'Folder';
    }
  }

  private getAvatarUrl(name: string): string {
    const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
  }

  private formatTimestamp(timestamp: string): string {
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

  // ===== CACHE MANAGEMENT =====

  async clearCache(): Promise<void> {
    const userId = this.ensureUserId();

    // Delete all emails for this user
    await supabase
      .from('emails')
      .delete()
      .eq('user_id', userId);

    // Delete all folders for this user
    await supabase
      .from('email_folders')
      .delete()
      .eq('user_id', userId);

    // Reset sync status
    await this.updateSyncStatus({
      total_emails_cached: 0,
      total_folders_cached: 0,
      last_full_sync_at: null,
      last_incremental_sync_at: null
    });

    console.log('✅ Cache cleared successfully');
  }

  async getCacheStats(): Promise<{
    totalEmails: number;
    totalFolders: number;
    lastSync: string | null;
    cacheSize: string;
  }> {
    const userId = this.ensureUserId();

    const [emailCount, folderCount, syncStatus] = await Promise.all([
      supabase
        .from('emails')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('email_folders')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      this.getSyncStatus()
    ]);

    return {
      totalEmails: emailCount.count || 0,
      totalFolders: folderCount.count || 0,
      lastSync: syncStatus?.last_incremental_sync_at || null,
      cacheSize: this.formatBytes((emailCount.count || 0) * 2048) // Rough estimate
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const emailCacheService = new EmailCacheService(); 