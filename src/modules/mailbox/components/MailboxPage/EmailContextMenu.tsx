import React, { useState, useEffect } from 'react';
import { Email } from './useMailbox';
import { 
  Star, 
  Mail, 
  MailOpen, 
  Trash2, 
  Archive, 
  Reply, 
  Forward, 
  Flag 
} from 'lucide-react';

interface EmailContextMenuProps {
  email: Email;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  onMarkAsRead?: (email: Email) => void;
  onMarkAsUnread?: (email: Email) => void;
  onToggleStar?: (email: Email) => void;
  onDelete?: (email: Email) => void;
  onArchive?: (email: Email) => void;
  onReply?: (email: Email) => void;
  onForward?: (email: Email) => void;
}

export function EmailContextMenu({
  email,
  isOpen,
  onOpenChange,
  position,
  onMarkAsRead,
  onMarkAsUnread,
  onToggleStar,
  onDelete,
  onArchive,
  onReply,
  onForward,
}: EmailContextMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    setMenuVisible(isOpen);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setMenuVisible(false);
    onOpenChange(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuVisible) {
      setMenuVisible(false);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (menuVisible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [menuVisible]);

  if (!menuVisible) return null;

  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200), // Prevent overflow
    y: Math.min(position.y, window.innerHeight - 300), // Prevent overflow
  };

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 w-48"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Read/Unread Actions */}
      {email.isRead ? (
        <div 
          onClick={() => onMarkAsUnread && handleAction(() => onMarkAsUnread(email))}
          className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
        >
          <Mail className="h-4 w-4 mr-2" />
          Mark as Unread
        </div>
      ) : (
        <div 
          onClick={() => onMarkAsRead && handleAction(() => onMarkAsRead(email))}
          className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
        >
          <MailOpen className="h-4 w-4 mr-2" />
          Mark as Read
        </div>
      )}

      {/* Star/Unstar */}
      <div 
        onClick={() => onToggleStar && handleAction(() => onToggleStar(email))}
        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
      >
        <Star className={`h-4 w-4 mr-2 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        {email.isStarred ? 'Remove Star' : 'Add Star'}
      </div>

      <div className="h-px bg-border my-1" />

      {/* Email Actions */}
      <div 
        onClick={() => onReply && handleAction(() => onReply(email))}
        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
      >
        <Reply className="h-4 w-4 mr-2" />
        Reply
      </div>

      <div 
        onClick={() => onForward && handleAction(() => onForward(email))}
        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
      >
        <Forward className="h-4 w-4 mr-2" />
        Forward
      </div>

      <div className="h-px bg-border my-1" />

      {/* Organization Actions */}
      <div 
        onClick={() => onArchive && handleAction(() => onArchive(email))}
        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
      >
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </div>

      <div 
        onClick={() => onDelete && handleAction(() => {
          console.log('🗑️ Context menu delete clicked for email:', email.subject);
          onDelete(email);
        })}
        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-red-600 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </div>
    </div>
  );
} 