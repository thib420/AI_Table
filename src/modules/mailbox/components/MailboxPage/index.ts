// Mailbox module entry point

export * from './MailboxList';
export * from './MailboxSidebar';
export * from './MailboxDetail';
export * from './EmailContextMenu';
// Export the progressive mailbox hook instead
export { useProgressiveMailbox, type Email, type MailboxFolder } from '../../hooks/useProgressiveMailbox'; 