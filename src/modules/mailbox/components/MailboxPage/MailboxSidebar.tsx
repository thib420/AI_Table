import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Inbox, Star, Send, Mail, Archive, Calendar, Users } from 'lucide-react';

type MailboxView = 'inbox' | 'sent' | 'drafts' | 'archive' | 'starred';

interface MailboxSidebarProps {
  currentView: string;
  setCurrentView: (view: MailboxView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inboxUnread: number;
  starredCount: number;
  onQuickCustomer?: () => void;
}

export function MailboxSidebar({ currentView, setCurrentView, searchQuery, setSearchQuery, inboxUnread, starredCount, onQuickCustomer }: MailboxSidebarProps) {
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
        {/* Navigation */}
        <div className="space-y-1">
          <Button
            variant={currentView === 'inbox' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('inbox')}
          >
            <Inbox className="h-4 w-4 mr-3" />
            Inbox
            <span className="ml-auto text-xs">{inboxUnread}</span>
          </Button>
          <Button
            variant={currentView === 'starred' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('starred')}
          >
            <Star className="h-4 w-4 mr-3" />
            Starred
            <span className="ml-auto text-xs">{starredCount}</span>
          </Button>
          <Button
            variant={currentView === 'sent' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('sent')}
          >
            <Send className="h-4 w-4 mr-3" />
            Sent
          </Button>
          <Button
            variant={currentView === 'drafts' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('drafts')}
          >
            <Mail className="h-4 w-4 mr-3" />
            Drafts
          </Button>
          <Button
            variant={currentView === 'archive' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView('archive')}
          >
            <Archive className="h-4 w-4 mr-3" />
            Archive
          </Button>
        </div>
        {/* Quick Actions */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium text-muted-foreground px-2">Quick Actions</h4>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={onQuickCustomer}>
            <Users className="h-4 w-4 mr-2" />
            Add to CRM
          </Button>
        </div>
      </div>
    </div>
  );
} 