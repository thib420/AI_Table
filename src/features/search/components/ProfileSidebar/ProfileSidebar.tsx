"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, X, Building, Briefcase, User, Info } from 'lucide-react';
import { EnrichedExaResultItem } from '../../services/ai-column-generator';
import { Badge } from '@/components/ui/badge';

interface ProfileSidebarProps {
  profile: EnrichedExaResultItem | null;
  onClose: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ profile, onClose }) => {
  if (!profile) {
    return null;
  }

  const getCompanyLogoUrl = (companyUrl?: string): string | null => {
    if (!companyUrl || companyUrl === 'N/A') return null;
    try {
      const fullUrl = companyUrl.startsWith('http') ? companyUrl : `https://` + companyUrl;
      const url = new URL(fullUrl);
      return `https://logo.clearbit.com/${url.hostname}`;
    } catch (e) {
      return null;
    }
  };

  const fallbackLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.company?.charAt(0) || 'C')}&size=40&background=e5e7eb&color=374151&bold=true&format=png`;
  const logoUrl = getCompanyLogoUrl(profile.companyUrl) || fallbackLogoUrl;

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-1/3 lg:w-1/4 bg-background border-l z-50 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Profile Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-start space-x-4">
          <img
            src={String(profile.image || profile.profilePicture)}
            alt={`${profile.author} profile`}
            className="w-16 h-16 rounded-full border-2 border-primary"
          />
          <div className="pt-2">
            <h3 className="text-xl font-bold">{profile.author}</h3>
            <p className="text-md text-muted-foreground">{profile.cleanTitle}</p>
          </div>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Briefcase className="h-5 w-5 mr-3 text-primary" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${profile.company} logo`}
                className="w-10 h-10 rounded-md object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallbackLogoUrl) {
                    target.src = fallbackLogoUrl;
                  }
                }}
              />
              <span className="font-semibold text-md">{profile.company}</span>
            </div>
            {profile.companyUrl && profile.companyUrl !== 'N/A' && (
              <a href={profile.companyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                {profile.companyUrl}
              </a>
            )}
          </CardContent>
        </Card>
        
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Info className="h-5 w-5 mr-3 text-primary" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.cleanDescription}
            </p>
          </CardContent>
        </Card>
        
        {/* Raw Text for context */}
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-3 text-primary" />
              Raw Profile Data
            </CardTitle>
             <CardDescription>The raw text from the profile for context.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed max-h-48 overflow-y-auto">
              {profile.text}
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="p-4 border-t mt-auto">
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on LinkedIn
          </Button>
        </a>
      </div>
    </div>
  );
}; 