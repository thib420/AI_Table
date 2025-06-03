import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Crown, 
  Building2, 
  Mail, 
  Phone, 
  TrendingUp, 
  Calendar,
  Eye
} from 'lucide-react';
import { Contact } from '../../types';
import { getStatusColor, generateProfilePicture } from '../../utils/helpers';

interface TopContactsProps {
  contacts: Contact[];
}

export function TopContacts({ contacts }: TopContactsProps) {
  // Sort contacts by deal value (highest first) and take top 6
  const topContacts = contacts
    .filter(contact => contact.dealValue > 0) // Only contacts with deal value
    .sort((a, b) => b.dealValue - a.dealValue)
    .slice(0, 6);

  // If we don't have enough contacts with deal values, fill with recent contacts
  if (topContacts.length < 6) {
    const recentContacts = contacts
      .filter(contact => !topContacts.find(tc => tc.id === contact.id)) // Exclude already selected
      .sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime())
      .slice(0, 6 - topContacts.length);
    
    topContacts.push(...recentContacts);
  }

  const formatLastContact = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}mo ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getContactIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (index === 1) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    if (index === 2) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return null;
  };

  const handleContactAction = (contact: Contact, action: string) => {
    // Handle contact actions (view, email, call)
    console.log(`${action} contact:`, contact);
    
    switch (action) {
      case 'email':
        window.open(`mailto:${contact.email}`, '_blank');
        break;
      case 'call':
        window.open(`tel:${contact.phone}`, '_blank');
        break;
      case 'view':
        // This would typically navigate to contact details
        console.log('View contact details for:', contact.id);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Contacts</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your most valuable customer relationships
            </p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topContacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Contacts Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your top contacts will appear here once you start building relationships.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topContacts.map((contact, index) => (
              <div key={contact.id} className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors group">
                {/* Ranking/Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={generateProfilePicture(contact.name)} alt={contact.name} />
                    <AvatarFallback className="text-sm">
                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {getContactIcon(index) && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      {getContactIcon(index)}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${contact.dealValue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Deal value</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate max-w-32">
                        {contact.company}
                      </span>
                    </div>
                    <Badge className={getStatusColor(contact.status)} variant="outline">
                      {contact.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatLastContact(contact.lastContact)}
                      </span>
                    </div>
                    
                    {/* Quick Actions - visible on hover */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactAction(contact, 'view');
                        }}
                        title="View Details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactAction(contact, 'email');
                        }}
                        title="Send Email"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      {contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactAction(contact, 'call');
                          }}
                          title="Call Contact"
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {topContacts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {topContacts.length}
                </div>
                <div className="text-xs text-muted-foreground">Top Contacts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  ${topContacts.reduce((sum, c) => sum + c.dealValue, 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  ${Math.round(topContacts.reduce((sum, c) => sum + c.dealValue, 0) / topContacts.length).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Avg Value</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 