import React, { useState } from 'react';
import { 
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { graphCRMService } from '../services/GraphCRMService';
import { Contact } from '../types';
import { getStatusColor, generateProfilePicture } from '../utils/helpers';

interface ContactsViewProps {
  onContactView: (contactId: string) => void;
}

export function ContactsView({ onContactView }: ContactsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const contactsData = await graphCRMService.getAllContacts();
        setContacts(contactsData);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus('all')}>All Contacts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('lead')}>Leads</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('prospect')}>Prospects</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('customer')}>Customers</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          contacts
            .filter((contact: Contact) => 
              selectedStatus === 'all' || contact.status === selectedStatus
            )
            .filter((contact: Contact) =>
              searchQuery === '' || 
              contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              contact.company.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onContactView(contact.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={generateProfilePicture(contact.name)} alt={contact.name} />
                      <AvatarFallback>{contact.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{contact.name}</h3>
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onContactView(contact.id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">${contact.dealValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Deal value</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {contact.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Add "View Details" overlay on hover */}
                <div className="mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onContactView(contact.id); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Customer 360
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 