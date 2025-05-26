export interface ContactSyncSettings {
  autoSyncEnabled: boolean;
  syncOnStartup: boolean;
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  excludeSystemEmails: boolean;
  excludeDomains: string[];
  includePrefixes: string[];
  excludePrefixes: string[];
}

export const defaultContactSyncSettings: ContactSyncSettings = {
  autoSyncEnabled: false, // Disabled by default to prevent API overload
  syncOnStartup: false, // Disabled by default
  batchSize: 3, // Reduced from 10 to 3 to be gentler on API
  delayBetweenBatches: 5000, // Increased from 1000ms to 5000ms (5 seconds)
  excludeSystemEmails: true,
  excludeDomains: ['microsoft.com', 'outlook.com'], // Optional: exclude big providers
  includePrefixes: [], // Optional: only include emails with these prefixes
  excludePrefixes: ['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'system', 'admin', 'support']
};

class ContactSyncSettingsManager {
  private settings: ContactSyncSettings;
  private readonly storageKey = 'contactSyncSettings';

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): ContactSyncSettings {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return { ...defaultContactSyncSettings };
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultContactSyncSettings, ...parsed };
      }
    } catch (error) {
      console.error('Error loading contact sync settings:', error);
    }
    return { ...defaultContactSyncSettings };
  }

  private saveSettings(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving contact sync settings:', error);
    }
  }

  getSettings(): ContactSyncSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<ContactSyncSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = { ...defaultContactSyncSettings };
    this.saveSettings();
  }

  isAutoSyncEnabled(): boolean {
    return this.settings.autoSyncEnabled;
  }

  shouldExcludeEmail(email: string): boolean {
    const emailLower = email.toLowerCase();
    
    // Check excluded prefixes
    if (this.settings.excludeSystemEmails || this.settings.excludePrefixes.length > 0) {
      const excludePrefixes = this.settings.excludeSystemEmails 
        ? [...defaultContactSyncSettings.excludePrefixes, ...this.settings.excludePrefixes]
        : this.settings.excludePrefixes;
      
      if (excludePrefixes.some(prefix => emailLower.startsWith(prefix.toLowerCase()))) {
        return true;
      }
    }

    // Check excluded domains
    if (this.settings.excludeDomains.length > 0) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain && this.settings.excludeDomains.some(excludeDomain => 
        domain === excludeDomain.toLowerCase() || domain.endsWith('.' + excludeDomain.toLowerCase())
      )) {
        return true;
      }
    }

    // Check included prefixes (if any are specified, only include emails with these prefixes)
    if (this.settings.includePrefixes.length > 0) {
      const hasIncludedPrefix = this.settings.includePrefixes.some(prefix => 
        emailLower.startsWith(prefix.toLowerCase())
      );
      if (!hasIncludedPrefix) {
        return true;
      }
    }

    return false;
  }
}

export const contactSyncSettings = new ContactSyncSettingsManager(); 