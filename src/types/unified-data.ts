// Unified type definitions for the new DataService
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
  folder: string;
  folderId: string;
  avatarUrl: string;
  displayTime: string;
  webLink?: string;
  graphMessage?: any;
}

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: string;
  lastContact: string;
  dealValue: number;
  avatar: string;
  tags: string[];
  source?: string;
  graphType?: string;
}

export interface Meeting {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  attendees: any[];
  organizerEmail: string | null;
  location: string | null;
  isOnlineMeeting: boolean;
}

export interface MailboxFolder {
  id: string;
  displayName: string;
  unreadCount: number;
  totalCount: number;
  isSystemFolder: boolean;
  icon: string;
  graphId: string;
} 