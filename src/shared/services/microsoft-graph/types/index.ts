// Microsoft Graph Types

// Core Graph Types
export interface GraphUser {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  businessPhones?: string[];
  mobilePhone?: string;
  companyName?: string;
  manager?: GraphUser;
}

export interface GraphContact {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: EmailAddress[];
  businessPhones?: string[];
  homePhones?: string[];
  mobilePhone?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  officeLocation?: string;
  businessAddress?: PhysicalAddress;
  homeAddress?: PhysicalAddress;
  personalNotes?: string;
  categories?: string[];
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  parentFolderId?: string;
}

export interface GraphPerson {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  scoredEmailAddresses?: ScoredEmailAddress[];
  phones?: Phone[];
  postalAddresses?: PhysicalAddress[];
  websites?: Website[];
  jobTitle?: string;
  companyName?: string;
  yomiCompany?: string;
  department?: string;
  officeLocation?: string;
  profession?: string;
  userPrincipalName?: string;
  imAddress?: string;
  personType?: PersonType;
  personNotes?: string;
  isFavorite?: boolean;
  birthday?: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface ScoredEmailAddress {
  address: string;
  relevanceScore: number;
}

export interface Phone {
  type?: string;
  number: string;
}

export interface PhysicalAddress {
  street?: string;
  city?: string;
  state?: string;
  countryOrRegion?: string;
  postalCode?: string;
}

export interface Website {
  address?: string;
  displayName?: string;
  type?: string;
}

export interface PersonType {
  class: string;
  subclass: string;
}

// CRM-specific types that map to Graph data
export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  lastContact: string;
  dealValue: number;
  avatar?: string;
  tags: string[];
  source: string;
  // Graph-specific fields
  graphId?: string;
  graphType?: 'contact' | 'person' | 'user';
  lastModified?: string;
  notes?: string;
}

export interface CRMCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  contactCount: number;
  dealValue: number;
  status: 'active' | 'prospect' | 'inactive';
  // Graph-derived data
  primaryContact?: CRMContact;
  employees?: GraphUser[];
}

// API Response Types
export interface GraphApiResponse<T> {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
  value: T[];
}

export interface GraphError {
  code: string;
  message: string;
  innerError?: {
    code: string;
    message: string;
    'request-id': string;
    date: string;
  };
}

// Search and Filter Types
export interface PeopleSearchOptions {
  search?: string;
  top?: number;
  skip?: number;
  orderBy?: string;
  select?: string[];
  filter?: string;
}

export interface ContactsSearchOptions {
  search?: string;
  top?: number;
  skip?: number;
  orderBy?: string;
  select?: string[];
  filter?: string;
  folderId?: string;
}

export interface UsersSearchOptions {
  search?: string;
  top?: number;
  skip?: number;
  orderBy?: string;
  select?: string[];
  filter?: string;
}

// Service Configuration
export interface GraphServiceConfig {
  scopes: string[];
  baseUrl?: string;
  version?: 'v1.0' | 'beta';
} 