import { Email } from '../hooks/useProgressiveMailbox';
import { GraphCRMService } from '@/modules/crm/services/GraphCRMService';
import { Contact } from '@/modules/crm/types';
import { contactSyncSettings } from './ContactSyncSettings';

export class ContactSyncService {
  private crmService: GraphCRMService;
  private syncedEmails = new Set<string>(); // Track which emails we've already synced
  private isCurrentlySyncing = false; // Prevent multiple concurrent syncs
  private lastSyncTime = 0; // Track last sync time to prevent too frequent syncs

  constructor() {
    this.crmService = new GraphCRMService();
  }

  /**
   * Sync all contacts from emails to CRM automatically
   */
  async syncEmailContactsToCRM(emails: Email[]): Promise<{
    synced: number;
    skipped: number;
    errors: number;
  }> {
    console.log(`🔄 ContactSyncService: Starting sync for ${emails.length} emails`);
    
    let synced = 0;
    let skipped = 0;
    let errors = 0;
    
    // Extract all unique email addresses from the emails
    const emailAddresses = this.extractUniqueEmailAddresses(emails);
    console.log(`📧 ContactSyncService: Found ${emailAddresses.length} unique email addresses`);

    for (const emailAddress of emailAddresses) {
      try {
        const result = await this.syncSingleContact(emailAddress);
        if (result === 'synced') {
          synced++;
        } else if (result === 'skipped') {
          skipped++;
        } else if (result === 'rate-limited') {
          console.log('🕒 ContactSyncService: Rate limited, stopping manual sync');
          break; // Stop processing if rate limited
        }
      } catch (error) {
        console.error(`❌ ContactSyncService: Error syncing ${emailAddress}:`, error);
        errors++;
      }
    }

    console.log(`✅ ContactSyncService: Sync complete - Synced: ${synced}, Skipped: ${skipped}, Errors: ${errors}`);
    
    return { synced, skipped, errors };
  }

  /**
   * Extract all unique email addresses from emails (senders and recipients)
   */
  private extractUniqueEmailAddresses(emails: Email[]): string[] {
    const emailSet = new Set<string>();
    
    emails.forEach(email => {
      // Add sender email
      if (email.senderEmail && this.isValidEmail(email.senderEmail)) {
        emailSet.add(email.senderEmail.toLowerCase());
      }

      // Add recipient emails from Graph message if available
      if (email.graphMessage) {
        // Add TO recipients
        email.graphMessage.toRecipients?.forEach(recipient => {
          if (recipient.emailAddress?.address && this.isValidEmail(recipient.emailAddress.address)) {
            emailSet.add(recipient.emailAddress.address.toLowerCase());
          }
        });

        // Add CC recipients
        email.graphMessage.ccRecipients?.forEach(recipient => {
          if (recipient.emailAddress?.address && this.isValidEmail(recipient.emailAddress.address)) {
            emailSet.add(recipient.emailAddress.address.toLowerCase());
          }
        });

        // Add BCC recipients (if available)
        email.graphMessage.bccRecipients?.forEach(recipient => {
          if (recipient.emailAddress?.address && this.isValidEmail(recipient.emailAddress.address)) {
            emailSet.add(recipient.emailAddress.address.toLowerCase());
          }
        });
      }
    });

    // Filter out emails based on settings
    return Array.from(emailSet).filter(email => !contactSyncSettings.shouldExcludeEmail(email));
  }

  /**
   * Sync a single contact to CRM with rate limiting and retry logic
   */
  private async syncSingleContact(emailAddress: string): Promise<'synced' | 'skipped' | 'rate-limited'> {
    try {
      // Add small delay to prevent overwhelming the API
      await this.delay(100);
      
      // Check if contact already exists in CRM
      const existingContacts = await this.searchContactsWithRetry(emailAddress);
      const existingContact = existingContacts.find(c => 
        c.email.toLowerCase() === emailAddress.toLowerCase()
      );

      if (existingContact) {
        console.log(`⏭️ ContactSyncService: Contact already exists: ${emailAddress}`);
        return 'skipped';
      }

      console.log(`👤 ContactSyncService: Creating new contact for: ${emailAddress}`);

      // Create new contact with minimal API calls
      const newContact: Partial<Contact> = {
        name: this.extractNameFromEmail(emailAddress),
        email: emailAddress,
        phone: '',
        company: this.extractCompanyFromEmail(emailAddress),
        position: '',
        location: '',
        status: 'lead',
        lastContact: new Date().toISOString().split('T')[0],
        dealValue: 0,
        tags: ['auto-sync', 'from-mailbox'],
        source: 'Mailbox Auto-Sync'
      };

      await this.createContactWithRetry(newContact);
      console.log(`✅ ContactSyncService: Contact created successfully: ${emailAddress}`);
      
      return 'synced';
    } catch (error: any) {
      console.error(`❌ ContactSyncService: Error syncing contact ${emailAddress}:`, error);
      
      // Check if it's a rate limiting error
      if (error?.status === 429 || error?.message?.includes('Too Many Requests')) {
        console.log(`🕒 ContactSyncService: Rate limited for ${emailAddress}, will retry later`);
        return 'rate-limited';
      }
      
      throw error;
    }
  }

  /**
   * Search contacts with retry logic for rate limiting
   */
  private async searchContactsWithRetry(email: string, retries = 3): Promise<Contact[]> {
    try {
      return await this.crmService.searchContacts(email);
    } catch (error: any) {
      if ((error?.status === 429 || error?.message?.includes('Too Many Requests')) && retries > 0) {
        console.log(`🕒 Rate limited when searching contacts, retrying in ${3 ** (4 - retries)}s...`);
        await this.delay(3 ** (4 - retries) * 1000); // Exponential backoff: 3s, 9s, 27s
        return this.searchContactsWithRetry(email, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Create contact with retry logic for rate limiting
   */
  private async createContactWithRetry(contact: Partial<Contact>, retries = 3): Promise<Contact> {
    try {
      return await this.crmService.createContact(contact);
    } catch (error: any) {
      if ((error?.status === 429 || error?.message?.includes('Too Many Requests')) && retries > 0) {
        console.log(`🕒 Rate limited when creating contact, retrying in ${3 ** (4 - retries)}s...`);
        await this.delay(3 ** (4 - retries) * 1000); // Exponential backoff: 3s, 9s, 27s
        return this.createContactWithRetry(contact, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Helper method to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    
    // Handle common patterns
    if (localPart.includes('.')) {
      return localPart.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    
    if (localPart.includes('_')) {
      return localPart.split('_').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    
    // Default to capitalizing the first letter
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  /**
   * Extract company from email domain
   */
  private extractCompanyFromEmail(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return '';
    
    // Remove common TLDs and subdomains
    const domainParts = domain.split('.');
    const companyPart = domainParts[0];
    
    // Capitalize first letter
    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }



  /**
   * Sync contacts in the background with batching and rate limiting
   */
  async syncContactsInBackground(emails: Email[]): Promise<void> {
    try {
      console.log('🔄 ContactSyncService: Starting background contact sync...');
      
      // Check if auto-sync is enabled
      if (!contactSyncSettings.isAutoSyncEnabled()) {
        console.log('⏭️ ContactSyncService: Auto-sync is disabled, skipping background sync');
        return;
      }

      // Prevent multiple concurrent syncs
      if (this.isCurrentlySyncing) {
        console.log('⏭️ ContactSyncService: Sync already in progress, skipping');
        return;
      }

      // Rate limit: Don't sync more than once every 30 seconds
      const now = Date.now();
      if (now - this.lastSyncTime < 30000) {
        console.log('⏭️ ContactSyncService: Too soon since last sync, skipping');
        return;
      }

      this.isCurrentlySyncing = true;
      this.lastSyncTime = now;

      // Process in batches using settings
      const settings = contactSyncSettings.getSettings();
      const batchSize = settings.batchSize;
      const emailAddresses = this.extractUniqueEmailAddresses(emails);
      
      // Limit to first 20 emails to avoid overwhelming the API
      const limitedEmails = emailAddresses.slice(0, 20);
      console.log(`📧 ContactSyncService: Processing ${limitedEmails.length} emails (limited from ${emailAddresses.length} total)`);
      
      for (let i = 0; i < limitedEmails.length; i += batchSize) {
        const batch = limitedEmails.slice(i, i + batchSize);
        console.log(`📦 ContactSyncService: Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(limitedEmails.length / batchSize)}`);
        
        // Process batch sequentially to avoid overwhelming API
        for (const email of batch) {
          try {
            const result = await this.syncSingleContact(email);
            if (result === 'rate-limited') {
              console.log('🕒 ContactSyncService: Rate limited, stopping batch processing');
              break;
            }
          } catch (error) {
            console.error(`Error in batch sync for ${email}:`, error);
          }
        }
        
        // Longer delay between batches based on settings
        if (i + batchSize < limitedEmails.length) {
          console.log(`⏳ ContactSyncService: Waiting ${settings.delayBetweenBatches}ms before next batch...`);
          await this.delay(settings.delayBetweenBatches);
        }
      }
      
      console.log('✅ ContactSyncService: Background sync complete');
    } catch (error) {
      console.error('❌ ContactSyncService: Background sync failed:', error);
    } finally {
      this.isCurrentlySyncing = false;
    }
  }
}

export const contactSyncService = new ContactSyncService(); 