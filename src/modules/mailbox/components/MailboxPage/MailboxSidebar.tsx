import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Inbox, Star, Send, Mail, Archive, Calendar, Users, RefreshCw, CheckCircle2, Folder, Trash2 } from 'lucide-react';
import { contactSyncService } from '../../services/ContactSyncService';
import { Email, MailboxFolder } from './useMailbox';
import { ContactSyncSettingsButton } from '../ContactSyncSettings';

interface MailboxSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  folders: MailboxFolder[];
  onViewCRM?: () => void;
  onViewCustomer?: (email: string) => void;
  selectedEmail?: Email | null;
  allEmails?: Email[]; // Add emails for manual sync
}

export function MailboxSidebar({ 
  currentView, 
  setCurrentView, 
  searchQuery, 
  setSearchQuery, 
  folders,
  onViewCRM, 
  onViewCustomer, 
  selectedEmail, 
  allEmails = [] 
}: MailboxSidebarProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncStats, setSyncStats] = useState<{ synced: number; skipped: number; errors: number } | null>(null);

  const handleManualSync = async () => {
    if (allEmails.length === 0) return;
    
    setSyncStatus('syncing');
    setSyncStats(null);
    
    try {
      console.log('🔄 Manual contact sync triggered');
      const result = await contactSyncService.syncEmailContactsToCRM(allEmails);
      setSyncStats(result);
      setSyncStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncStats(null);
      }, 3000);
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setSyncStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };

  // Get icon component for folder
  const getFolderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Inbox': return Inbox;
      case 'Send': return Send;
      case 'Mail': return Mail;
      case 'Archive': return Archive;
      case 'Star': return Star;
      case 'Trash': return Trash2;
      case 'Folder':
      default: return Folder;
    }
  };

  // Calculate starred count from all emails
  const starredCount = allEmails.filter(e => e.isStarred).length;

  return (
    <div className="w-56 border-r bg-muted/20 flex-shrink-0">
      <div className="p-4 space-y-2">
        {/* Search */}
        <div className="relative mb-4">
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Navigation - Dynamic Folders */}
        <div className="space-y-1">
          {folders.map((folder) => {
            const IconComponent = getFolderIcon(folder.icon);
            const isActive = currentView === folder.id;
            
            return (
              <Button
                key={folder.id}
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setCurrentView(folder.id)}
              >
                <IconComponent className="h-4 w-4 mr-3" />
                {folder.displayName}
                {folder.unreadCount > 0 && (
                  <span className="ml-auto text-xs">{folder.unreadCount}</span>
                )}
              </Button>
            );
          })}
          
          {/* Starred is special - not a real folder but a filter */}
          <Button
            variant={currentView === 'starred' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('starred')}
          >
            <Star className="h-4 w-4 mr-3" />
            Starred
            <span className="ml-auto text-xs">{starredCount}</span>
          </Button>
        </div>
        {/* Quick Actions */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium text-muted-foreground px-2">Quick Actions</h4>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={() => {
              if (selectedEmail && onViewCustomer) {
                console.log('📧 MailboxSidebar: See in CRM clicked with selected email:', selectedEmail.senderEmail);
                onViewCustomer(selectedEmail.senderEmail);
              } else if (onViewCRM) {
                console.log('📧 MailboxSidebar: No selected email, going to general CRM');
                onViewCRM();
              }
            }}
            disabled={!selectedEmail && !onViewCRM}
          >
            <Users className="h-4 w-4 mr-2" />
            {selectedEmail ? 'See Contact in CRM' : 'Go to CRM'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing' || allEmails.length === 0}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : syncStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
                         {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Contacts'}
           </Button>
           <ContactSyncSettingsButton />
           {syncStats && syncStatus === 'success' && (
             <div className="text-xs text-muted-foreground px-2 py-1">
               Added: {syncStats.synced}, Existing: {syncStats.skipped}
               {syncStats.errors > 0 && `, Errors: ${syncStats.errors}`}
             </div>
           )}
           {syncStatus === 'error' && (
             <div className="text-xs text-red-500 px-2 py-1">
               Sync failed. Check rate limits.
             </div>
           )}
        </div>
      </div>
    </div>
  );
} 