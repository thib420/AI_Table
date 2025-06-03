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
  MapPin,
  Grid3X3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { graphCRMService } from '../services/GraphCRMService';
import { Contact } from '../types';
import { getStatusColor, generateProfilePicture } from '../utils/helpers';
import { EditContactDialog } from './EditContactDialog';
import { crmCache } from '../services/crmCache';

interface ContactsViewProps {
  onContactView: (contactId: string) => void;
}

type ViewMode = 'card' | 'table';
type SortField = 'name' | 'company' | 'status' | 'dealValue' | 'lastContact';
type SortDirection = 'asc' | 'desc';

export function ContactsView({ onContactView }: ContactsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortField, setSortField] = useState<SortField>('lastContact');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    const loadContacts = async () => {
      // **OPTIMIZATION: Check in-memory cache first**
      const cachedContacts = crmCache.getContacts();
      if (cachedContacts && cachedContacts.length > 0) {
        console.log('⚡ Using CRM contacts cache - instant load!');
        setContacts(cachedContacts);
        setLoading(false);
        
        // Load fresh data in background
        console.log('🔄 Starting background sync for contacts...');
        loadContactsInBackground();
        return;
      }

      // No cache available, show loading and load fresh data
      try {
        setLoading(true);
        console.log('📥 No contacts cache available, loading fresh data...');
        const contactsData = await graphCRMService.getAllContacts();
        setContacts(contactsData);
        
        // Update cache with fresh data
        crmCache.setContacts(contactsData);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadContactsInBackground = async () => {
      try {
        console.log('🔄 Background contacts sync started...');
        const contactsData = await graphCRMService.getAllContacts();
        
        // Update cache and state with fresh data
        crmCache.setContacts(contactsData);
        setContacts(contactsData);
        
        console.log('✅ Background contacts sync completed');
      } catch (error) {
        console.error('❌ Background contacts sync failed:', error);
      }
    };

    loadContacts();
  }, []);

  // Get unique categories from all contacts
  const allCategories = React.useMemo(() => {
    const categorySet = new Set<string>();
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => categorySet.add(tag));
      }
    });
    const categories = Array.from(categorySet).sort();
    console.log('Available categories:', categories);
    console.log('Total contacts:', contacts.length);
    return categories;
  }, [contacts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditDialogOpen(true);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      console.log(`🗑️ Deleting contact: ${contactToDelete.name} (ID: ${contactToDelete.id})`);
      
      // Delete from Microsoft Graph
      await graphCRMService.deleteContact(contactToDelete.id);
      
      console.log(`✅ Contact ${contactToDelete.name} deleted successfully from Graph`);
      
      // Update local state
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.id !== contactToDelete.id)
      );
      
      // Close dialog
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      
    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteContact = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
    setDeleteError(null);
  };

  // Check if a contact can be deleted (only contacts from Graph Contacts API can be deleted)
  const canDeleteContact = (contact: Contact | null): boolean => {
    if (!contact) return false;
    // Check graphType - only "contact" type can be deleted
    return contact.graphType === 'contact';
  };

  const getDeleteTooltip = (contact: Contact | null): string => {
    if (!contact) return 'Contact not available';
    
    if (canDeleteContact(contact)) {
      return 'Delete this contact from Outlook';
    }
    
    if (contact.graphType === 'person') {
      return 'Cannot delete - This contact is from your organization directory';
    }
    
    if (contact.graphType === 'user') {
      return 'Cannot delete - This is an organizational user account';
    }
    
    return 'Cannot delete - This contact is from external sources';
  };

  const handleCategoryToggle = (category: string) => {
    console.log('Toggling category:', category);
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category];
      console.log('New selected categories:', newCategories);
      return newCategories;
    });
  };

  const clearCategoryFilters = () => {
    console.log('Clearing category filters');
    setSelectedCategories([]);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedContacts = contacts
    .filter((contact: Contact) => 
      selectedStatus === 'all' || contact.status === selectedStatus
    )
    .filter((contact: Contact) =>
      selectedCategories.length === 0 || 
      selectedCategories.some(category => contact.tags.includes(category))
    )
    .filter((contact: Contact) =>
      searchQuery === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: Contact, b: Contact) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'dealValue') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'lastContact') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Helper function to format date
  const formatLastContact = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
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
            
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="ml-2 h-5 text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  <div className="flex items-center space-x-2">
                    <span>All Contacts</span>
                    {selectedStatus === 'all' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedStatus('lead')}>
                  <div className="flex items-center space-x-2">
                    <span>Leads</span>
                    {selectedStatus === 'lead' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('prospect')}>
                  <div className="flex items-center space-x-2">
                    <span>Prospects</span>
                    {selectedStatus === 'prospect' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('customer')}>
                  <div className="flex items-center space-x-2">
                    <span>Customers</span>
                    {selectedStatus === 'customer' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('partner')}>
                  <div className="flex items-center space-x-2">
                    <span>Partners</span>
                    {selectedStatus === 'partner' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('vendor')}>
                  <div className="flex items-center space-x-2">
                    <span>Vendors</span>
                    {selectedStatus === 'vendor' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('employee')}>
                  <div className="flex items-center space-x-2">
                    <span>Employees</span>
                    {selectedStatus === 'employee' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('contractor')}>
                  <div className="flex items-center space-x-2">
                    <span>Contractors</span>
                    {selectedStatus === 'contractor' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('intern')}>
                  <div className="flex items-center space-x-2">
                    <span>Interns</span>
                    {selectedStatus === 'intern' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('inactive')}>
                  <div className="flex items-center space-x-2">
                    <span>Inactive</span>
                    {selectedStatus === 'inactive' && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Categories Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 text-xs">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Select Categories</span>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCategoryFilters();
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {allCategories.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">
                        No categories available
                        <br />
                        <span className="text-xs">Categories will appear as you add tags to contacts</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allCategories.map(category => (
                          <label
                            key={category}
                            className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-muted rounded-sm transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCategoryToggle(category);
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-2"
                            />
                            <span className="text-sm flex-1">{category}</span>
                            <Badge variant="outline" className="text-xs">
                              {contacts.filter(c => c.tags?.includes(category)).length}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Active Filters Display */}
            {(selectedStatus !== 'all' || selectedCategories.length > 0) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {selectedStatus !== 'all' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>{selectedStatus}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStatus('all')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedCategories.map(category => (
                  <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                    <span>{category}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryToggle(category)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedContacts.length} of {contacts.length} contacts
          </p>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'card' ? (
          /* Contacts Grid */
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
              filteredAndSortedContacts.map((contact: Contact) => (
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditContact(contact); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={`${canDeleteContact(contact) ? 'text-red-600' : 'text-muted-foreground'}`}
                            disabled={!canDeleteContact(contact)}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (canDeleteContact(contact)) {
                                handleDeleteContact(contact);
                              }
                            }}
                            title={getDeleteTooltip(contact)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                            {!canDeleteContact(contact) && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                ({contact.graphType === 'person' ? 'Org' : 
                                  contact.graphType === 'user' ? 'User' : 'External'})
                              </span>
                            )}
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
        ) : (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Contact</span>
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('company')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Company</span>
                        {getSortIcon('company')}
                      </div>
                    </TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('lastContact')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Last Contact</span>
                        {getSortIcon('lastContact')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('dealValue')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Deal Value</span>
                        {getSortIcon('dealValue')}
                      </div>
                    </TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center space-x-3 animate-pulse">
                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredAndSortedContacts.map((contact: Contact) => (
                      <TableRow 
                        key={contact.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onContactView(contact.id)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={generateProfilePicture(contact.name)} alt={contact.name} />
                              <AvatarFallback className="text-xs">
                                {contact.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.position}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.company}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-48">{contact.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(contact.status)}>
                            {contact.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{formatLastContact(contact.lastContact)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(contact.lastContact).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">${contact.dealValue.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-32">
                            {contact.tags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
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
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditContact(contact); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className={`${canDeleteContact(contact) ? 'text-red-600' : 'text-muted-foreground'}`}
                                disabled={!canDeleteContact(contact)}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (canDeleteContact(contact)) {
                                    handleDeleteContact(contact);
                                  }
                                }}
                                title={getDeleteTooltip(contact)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                                {!canDeleteContact(contact) && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    ({contact.graphType === 'person' ? 'Org' : 
                                      contact.graphType === 'user' ? 'User' : 'External'})
                                  </span>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Contact Dialog */}
      <EditContactDialog
        contact={editingContact}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingContact(null);
        }}
        onSave={handleContactUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete Contact</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {contactToDelete?.name}? This action cannot be undone.
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                {contactToDelete ? getDeleteTooltip(contactToDelete) : 'This will permanently remove the contact from Microsoft Outlook and your CRM.'}
              </span>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteContact}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteContact}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 