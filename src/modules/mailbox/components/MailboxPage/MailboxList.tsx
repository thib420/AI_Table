import React from 'react';
import { Email } from './useMailbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MailboxListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelect: (email: Email) => void;
  onToggleStar?: (email: Email) => void;
  onDelete?: (email: Email) => void;
}

export function MailboxList({ emails, selectedEmailId, onSelect, onToggleStar, onDelete }: MailboxListProps) {
  const handleStarClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation(); // Prevent email selection
    onToggleStar?.(email);
  };

  const handleDeleteClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation(); // Prevent email selection
    onDelete?.(email);
  };

  return (
    <div className="divide-y overflow-auto flex-1">
      {emails.map((email) => (
        <div
          key={email.id}
          data-testid="email-row"
          className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
            selectedEmailId === email.id ? 'bg-muted' : ''
          } ${!email.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-500' : ''}`}
          onClick={() => onSelect(email)}
        >
          <div className="flex items-start space-x-2">
            <Avatar className="h-8 w-8">
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
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 hover:bg-transparent hover:text-red-500"
                      onClick={(e) => handleDeleteClick(e, email)}
                      title="Delete email"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                    </Button>
                  )}
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