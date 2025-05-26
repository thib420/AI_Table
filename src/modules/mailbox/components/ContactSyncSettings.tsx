import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Settings, X } from 'lucide-react';
import { contactSyncSettings, ContactSyncSettings } from '../services/ContactSyncSettings';

interface ContactSyncSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSyncSettingsDialog({ isOpen, onClose }: ContactSyncSettingsProps) {
  const [settings, setSettings] = useState<ContactSyncSettings>(contactSyncSettings.getSettings());
  const [excludeDomainsText, setExcludeDomainsText] = useState('');
  const [excludePrefixesText, setExcludePrefixesText] = useState('');
  const [includePrefixesText, setIncludePrefixesText] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentSettings = contactSyncSettings.getSettings();
      setSettings(currentSettings);
      setExcludeDomainsText(currentSettings.excludeDomains.join(', '));
      setExcludePrefixesText(currentSettings.excludePrefixes.join(', '));
      setIncludePrefixesText(currentSettings.includePrefixes.join(', '));
    }
  }, [isOpen]);

  const handleSave = () => {
    const updatedSettings: ContactSyncSettings = {
      ...settings,
      excludeDomains: excludeDomainsText.split(',').map(d => d.trim()).filter(d => d),
      excludePrefixes: excludePrefixesText.split(',').map(p => p.trim()).filter(p => p),
      includePrefixes: includePrefixesText.split(',').map(p => p.trim()).filter(p => p),
    };

    contactSyncSettings.updateSettings(updatedSettings);
    onClose();
  };

  const handleReset = () => {
    contactSyncSettings.resetToDefaults();
    const defaultSettings = contactSyncSettings.getSettings();
    setSettings(defaultSettings);
    setExcludeDomainsText(defaultSettings.excludeDomains.join(', '));
    setExcludePrefixesText(defaultSettings.excludePrefixes.join(', '));
    setIncludePrefixesText(defaultSettings.includePrefixes.join(', '));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contact Sync Settings
          </DialogTitle>
          <DialogDescription>
            Configure how email contacts are automatically synced to your CRM
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync email contacts to CRM
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={settings.autoSyncEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSyncEnabled: checked })}
            />
          </div>

          {/* Sync on Startup */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sync-startup">Sync on Startup</Label>
              <p className="text-sm text-muted-foreground">
                Sync contacts when mailbox loads
              </p>
            </div>
            <Switch
              id="sync-startup"
              checked={settings.syncOnStartup}
              onCheckedChange={(checked) => setSettings({ ...settings, syncOnStartup: checked })}
            />
          </div>

          {/* Exclude System Emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="exclude-system">Exclude System Emails</Label>
              <p className="text-sm text-muted-foreground">
                Skip noreply, admin, and system emails
              </p>
            </div>
            <Switch
              id="exclude-system"
              checked={settings.excludeSystemEmails}
              onCheckedChange={(checked) => setSettings({ ...settings, excludeSystemEmails: checked })}
            />
          </div>

          {/* Batch Size */}
          <div className="space-y-2">
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              min="1"
              max="50"
              value={settings.batchSize}
              onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) || 10 })}
            />
            <p className="text-sm text-muted-foreground">
              Number of contacts to process at once
            </p>
          </div>

          {/* Excluded Domains */}
          <div className="space-y-2">
            <Label htmlFor="exclude-domains">Exclude Domains</Label>
            <Textarea
              id="exclude-domains"
              placeholder="gmail.com, yahoo.com"
              value={excludeDomainsText}
              onChange={(e) => setExcludeDomainsText(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated list of domains to exclude
            </p>
          </div>

          {/* Excluded Prefixes */}
          <div className="space-y-2">
            <Label htmlFor="exclude-prefixes">Exclude Prefixes</Label>
            <Textarea
              id="exclude-prefixes"
              placeholder="noreply, support, admin"
              value={excludePrefixesText}
              onChange={(e) => setExcludePrefixesText(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated list of email prefixes to exclude
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContactSyncSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="w-full justify-start"
      >
        <Settings className="h-4 w-4 mr-2" />
        Sync Settings
      </Button>
      <ContactSyncSettingsDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
} 