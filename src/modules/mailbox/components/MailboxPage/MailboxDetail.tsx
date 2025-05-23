import React from 'react';
import { Email } from './useMailbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Users, Reply, Forward, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MailboxDetailProps {
  email: Email | null;
  onViewCustomer?: (email: string) => void;
}

export function MailboxDetail({ email, onViewCustomer }: MailboxDetailProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <Mail className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Select an email</h3>
          <p className="text-sm text-muted-foreground">
            Choose an email from the list to view its content
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={email.avatarUrl} alt={email.sender} />
              <AvatarFallback>{email.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{email.sender}</p>
              <p className="text-sm text-muted-foreground">{email.senderEmail}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Forward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-lg font-semibold">{email.subject}</h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground">
            {email.displayTime}
          </p>
          {onViewCustomer && (
            <Button variant="outline" size="sm" onClick={() => onViewCustomer(email.senderEmail)}>
              <Users className="h-4 w-4 mr-2" />
              View Customer 360
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="prose max-w-none">
          <p>{email.preview}</p>
          <br />
          <p>This is a preview of the email content. In a real implementation, this would show the full email body with proper formatting, attachments, and embedded content.</p>
        </div>
      </div>
    </>
  );
} 