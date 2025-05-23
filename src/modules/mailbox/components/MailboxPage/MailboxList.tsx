import React from 'react';
import { Email } from './useMailbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MailboxListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelect: (email: Email) => void;
  onToggleStar?: (email: Email) => void;
}

export function MailboxList({ emails, selectedEmailId, onSelect, onToggleStar }: MailboxListProps) {
  const handleStarClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation(); // Prevent email selection
    onToggleStar?.(email);
  };

  return (
    <div className="divide-y">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
            selectedEmailId === email.id ? 'bg-muted' : ''
          } ${!email.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-500' : ''}`}
          onClick={() => onSelect(email)}
        >
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={email.avatarUrl} alt={email.sender} />
              <AvatarFallback>{email.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${!email.isRead ? 'font-semibold' : ''}`}>{email.sender}</p>
                <div className="flex items-center space-x-1">
                  {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 hover:bg-transparent"
                    onClick={(e) => handleStarClick(e, email)}
                  >
                    <Star className={`h-3 w-3 ${email.isStarred ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                  </Button>
                  <span className="text-xs text-muted-foreground">{email.displayTime}</span>
                </div>
              </div>
              <p className={`text-sm truncate mt-1 ${!email.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{email.subject}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">{email.preview}</p>
            </div>
          </div>
        </div>
      ))}
      {emails.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No emails found</p>
        </div>
      )}
    </div>
  );
} 