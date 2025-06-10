"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, X, Building, Briefcase, User, Info, Mail, Globe, Sparkles, MapPin, Calendar, Award, GraduationCap, MessageSquare, Languages, Shield, Clock, Phone, Copy } from 'lucide-react';
import { EnrichedExaResultItem } from '../../services/ai-column-generator';

interface ProfileSidebarProps {
  profile: EnrichedExaResultItem | null;
  onClose: () => void;
}

interface ParsedExperience {
  title: string;
  company: string;
  duration: string;
  location?: string;
}

interface ParsedEducation {
  institution: string;
  degree: string[];
  duration?: string;
}

interface ParsedLanguage {
  language: string;
  proficiency: string;
}

interface ParsedCertification {
  name: string;
  institution?: string;
  time?: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  companyPhone?: string;
  location?: string;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Parse profile text content
  const parseProfileContent = (text: string) => {
    const sections = {
      connections: '',
      bio: '',
      experiences: [] as ParsedExperience[],
      education: [] as ParsedEducation[],
      languages: [] as ParsedLanguage[],
      certifications: [] as ParsedCertification[],
      recommendations: [] as string[],
      contactInfo: {} as ContactInfo
    };

    // Extract contact information
    const emailMatch = text.match(/email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      sections.contactInfo.email = emailMatch[1];
    }

    const phoneMatch = text.match(/phone[:\s]*([+]?[\d\s\-\(\)\.]{10,})/i);
    if (phoneMatch) {
      sections.contactInfo.phone = phoneMatch[1].trim();
    }

    const companyPhoneMatch = text.match(/company[_\s]*phone[:\s]*([+]?[\d\s\-\(\)\.]{10,})/i);
    if (companyPhoneMatch) {
      sections.contactInfo.companyPhone = companyPhoneMatch[1].trim();
    }

    // Extract location from various patterns
    const locationPatterns = [
      /Location[:\s]*([^.\n]+)/i,
      /Based in[:\s]*([^.\n]+)/i,
      /Located in[:\s]*([^.\n]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = text.match(pattern);
      if (locationMatch && locationMatch[1].trim() !== 'N/A') {
        sections.contactInfo.location = locationMatch[1].trim();
        break;
      }
    }

    // Extract connections
    const connectionsMatch = text.match(/Number of connections:\s*(.+)/);
    if (connectionsMatch) {
      sections.connections = connectionsMatch[1].trim();
    }

    // Extract bio
    const bioMatch = text.match(/Bio:\s*(.+?)(?:\n|Current Job Info:)/);
    if (bioMatch && bioMatch[1].trim() !== 'None') {
      sections.bio = bioMatch[1].trim();
    }

    // Extract experiences
    const experienceSection = text.match(/Experiences:\s*([\s\S]*?)(?=Education:|Languages:|$)/);
    if (experienceSection) {
      const experienceLines = experienceSection[1].split('\n').filter(line => line.trim());
      experienceLines.forEach(line => {
        const match = line.match(/(.+?)\s+at\s+(.+?)\s+from\s+(.+?)(?:\.\s*Location:\s*(.+?))?\.?$/);
        if (match) {
          sections.experiences.push({
            title: match[1].trim(),
            company: match[2].trim(),
            duration: match[3].trim(),
            location: match[4]?.trim()
          });
        }
      });
    }

    // Extract education
    const educationSection = text.match(/Education:\s*([\s\S]*?)(?=Languages:|Certifications:|$)/);
    if (educationSection) {
      const educationEntries = educationSection[1].split('Institution:').filter(entry => entry.trim());
      educationEntries.forEach(entry => {
        const institutionMatch = entry.match(/(.+?)\.\s*Degree:\s*\[(.+?)\]/);
        if (institutionMatch) {
          const degrees = institutionMatch[2].split(',').map(d => d.replace(/['"]/g, '').trim());
          sections.education.push({
            institution: institutionMatch[1].trim(),
            degree: degrees
          });
        }
      });
    }

    // Extract languages
    const languageSection = text.match(/Languages:\s*([\s\S]*?)(?=Certifications:|Recommendations:|$)/);
    if (languageSection) {
      const languageEntries = languageSection[1].split('language:').filter(entry => entry.trim());
      languageEntries.forEach(entry => {
        const langMatch = entry.match(/(.+?)\s*proficiency:\s*(.+)/);
        if (langMatch) {
          sections.languages.push({
            language: langMatch[1].trim(),
            proficiency: langMatch[2].trim()
          });
        }
      });
    }

    // Extract certifications
    const certificationSection = text.match(/Certifications:\s*([\s\S]*?)(?=Recommendations:|$)/);
    if (certificationSection) {
      const certEntries = certificationSection[1].split('certification_name:').filter(entry => entry.trim());
      certEntries.forEach(entry => {
        const certMatch = entry.match(/(.+?)\s*institution_name:\s*(.+?)\s*time:\s*(.+)/);
        if (certMatch) {
          sections.certifications.push({
            name: certMatch[1].trim(),
            institution: certMatch[2].trim() !== 'None' ? certMatch[2].trim() : undefined,
            time: certMatch[3].trim() !== 'None' ? certMatch[3].trim() : undefined
          });
        }
      });
    }

    // Extract recommendations
    const recommendationSection = text.match(/Recommendations:\s*([\s\S]*)$/);
    if (recommendationSection) {
      const recommendations = recommendationSection[1]
        .split(/(?=\b(?:I had|Very|Great|During|J'ai|As|Mayda)\b)/)
        .filter(rec => rec.trim().length > 50)
        .map(rec => rec.trim());
      sections.recommendations = recommendations;
    }

    return sections;
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

  const parsedContent = parseProfileContent(profile.text || '');

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-2/5 lg:w-1/3 bg-background border-l z-50 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-muted/20">
        <h2 className="text-xl font-semibold">Contact Profile</h2>
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
            <div className="flex items-center gap-3 mt-2">
              {profile.score && (
                <Badge variant="secondary">
                  <Award className="h-3 w-3 mr-1" />
                  Score: {profile.score.toFixed(2)}
                </Badge>
              )}
              {parsedContent.connections && (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  {parsedContent.connections}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Company & Contact Information - Compact */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base text-blue-800">
              <Building className="h-4 w-4 mr-2" />
              Company & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Company */}
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${profile.company} logo`}
                className="w-10 h-10 rounded object-contain border border-border flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallbackLogoUrl) {
                    target.src = fallbackLogoUrl;
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900 truncate">{profile.company}</p>
                <p className="text-sm text-blue-700 truncate">{profile.cleanPosition || profile.cleanTitle}</p>
              </div>
            </div>

            <Separator />

            {/* AI-Generated Email */}
            {(profile as any).ai_email && (profile as any).ai_email !== 'N/A' && (profile as any).ai_email !== 'Error' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm truncate">{(profile as any).ai_email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard((profile as any).ai_email)}
                  className="text-green-600 hover:text-green-800 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* AI-Generated Phone */}
            {(profile as any).ai_phone && (profile as any).ai_phone !== 'N/A' && (profile as any).ai_phone !== 'Error' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm truncate">{(profile as any).ai_phone}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard((profile as any).ai_phone)}
                  className="text-green-600 hover:text-green-800 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Fallback to parsed email if no AI email */}
            {!(profile as any).ai_email && parsedContent.contactInfo.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm truncate">{parsedContent.contactInfo.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(parsedContent.contactInfo.email!)}
                  className="text-green-600 hover:text-green-800 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Fallback to parsed phone if no AI phone */}
            {!(profile as any).ai_phone && parsedContent.contactInfo.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm truncate">{parsedContent.contactInfo.phone}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(parsedContent.contactInfo.phone!)}
                  className="text-green-600 hover:text-green-800 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* No contact info message */}
            {!(profile as any).ai_email && !(profile as any).ai_phone && !parsedContent.contactInfo.email && !parsedContent.contactInfo.phone && (
              <div className="text-center py-2 text-muted-foreground">
                <p className="text-xs">No contact information available</p>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Bio Section */}
        {parsedContent.bio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Info className="h-5 w-5 mr-3 text-primary" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{parsedContent.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Experience Section */}
        {parsedContent.experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Briefcase className="h-5 w-5 mr-3 text-orange-500" />
                Work Experience
              </CardTitle>
              <CardDescription>{parsedContent.experiences.length} positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedContent.experiences.slice(0, 5).map((exp, index) => (
                <div key={index} className="border-l-2 border-orange-200 pl-4 pb-4 last:pb-0">
                  <h4 className="font-semibold text-sm">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {exp.duration}
                    </div>
                    {exp.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {exp.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {parsedContent.experiences.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{parsedContent.experiences.length - 5} more positions
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Education Section */}
        {parsedContent.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="h-5 w-5 mr-3 text-green-500" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedContent.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <h4 className="font-semibold text-sm">{edu.institution}</h4>
                  <div className="space-y-1">
                    {edu.degree.map((degree, degreeIndex) => (
                      <p key={degreeIndex} className="text-sm text-muted-foreground">{degree}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Languages Section - Collapsed by default */}
        {parsedContent.languages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Languages className="h-5 w-5 mr-3 text-blue-500" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {parsedContent.languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{lang.language}</span>
                    <Badge variant="outline" className="text-xs">
                      {lang.proficiency.split(' ')[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 