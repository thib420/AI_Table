"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, X, Building, Briefcase, User, Info, Mail, Globe, Sparkles, MapPin, Calendar, Award } from 'lucide-react';
import { EnrichedExaResultItem } from '../../services/ai-column-generator';

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

  const formatCompanyUrl = (companyUrl?: string): string | undefined => {
    if (!companyUrl || companyUrl === 'N/A') return undefined;
    if (companyUrl.startsWith('http')) return companyUrl;
    return `https://` + companyUrl;
  };

  const fallbackLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.company?.charAt(0) || 'C')}&size=40&background=e5e7eb&color=374151&bold=true&format=png`;
  const logoUrl = getCompanyLogoUrl(profile.companyUrl) || fallbackLogoUrl;
  const formattedCompanyUrl = formatCompanyUrl(profile.companyUrl);

  // Extract AI-generated fields (fields that are not part of the base ExaResultItem)
  const baseFields = new Set(['id', 'title', 'url', 'publishedDate', 'author', 'score', 'text', 'image']);
  const knownEnhancedFields = new Set(['cleanTitle', 'company', 'companyUrl', 'cleanDescription', 'profilePicture', 'cleanPosition', 'extractedCompany']);
  
  const aiGeneratedFields = Object.entries(profile)
    .filter(([key, value]) => 
      !baseFields.has(key) && 
      !knownEnhancedFields.has(key) && 
      value && 
      value !== 'N/A' && 
      value !== 'Processing...' &&
      typeof value === 'string'
    );

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-2/5 lg:w-1/3 bg-background border-l z-50 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-muted/20">
        <h2 className="text-xl font-semibold">Profile Details</h2>
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
            className="w-20 h-20 rounded-full border-4 border-primary/20 shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.author || 'User')}&size=80&background=6366f1&color=fff&bold=true&format=png`;
            }}
          />
          <div className="flex-1 pt-2">
            <h3 className="text-2xl font-bold leading-tight">{profile.author}</h3>
            <p className="text-lg text-muted-foreground mt-1">{profile.cleanTitle || profile.title}</p>
            {profile.score && (
              <Badge variant="secondary" className="mt-2">
                <Award className="h-3 w-3 mr-1" />
                Score: {profile.score.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View LinkedIn
          </a>
          {formattedCompanyUrl && (
            <a
              href={formattedCompanyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Globe className="h-4 w-4 mr-2" />
              Company Site
            </a>
          )}
        </div>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Briefcase className="h-5 w-5 mr-3 text-primary" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${profile.company} logo`}
                className="w-12 h-12 rounded-lg object-contain border border-border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallbackLogoUrl) {
                    target.src = fallbackLogoUrl;
                  }
                }}
              />
              <div>
                <p className="font-semibold text-lg">{profile.company}</p>
                {formattedCompanyUrl && (
                   <a
                    href={formattedCompanyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {profile.companyUrl}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Professional Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Info className="h-5 w-5 mr-3 text-primary" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {profile.cleanDescription || 'No professional summary available.'}
            </p>
          </CardContent>
        </Card>

        {/* AI-Generated Insights */}
        {aiGeneratedFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="h-5 w-5 mr-3 text-purple-500" />
                AI Insights
              </CardTitle>
              <CardDescription>Additional information extracted using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiGeneratedFields.map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    {key.toLowerCase().includes('email') && <Mail className="h-4 w-4 text-blue-500" />}
                    {key.toLowerCase().includes('location') && <MapPin className="h-4 w-4 text-green-500" />}
                    {!key.toLowerCase().includes('email') && !key.toLowerCase().includes('location') && (
                      <Info className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="font-medium text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {String(value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* LinkedIn Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-3 text-primary" />
              LinkedIn Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Profile URL:</span>
                <a 
                  href={profile.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline truncate inline-block max-w-[200px]"
                >
                  {profile.url}
                </a>
              </div>
              {profile.publishedDate && (
                <div>
                  <span className="font-medium text-muted-foreground">Profile Date:</span>
                  <span className="ml-2">{new Date(profile.publishedDate).toLocaleDateString()}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Original Title:</span>
                <span className="ml-2">{profile.title}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Raw Profile Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-3 text-primary" />
              Full Profile Content
            </CardTitle>
            <CardDescription>Complete text content from LinkedIn profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto bg-muted/30 rounded-lg p-4">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {profile.text}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 