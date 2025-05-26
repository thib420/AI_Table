// Microsoft Graph Services - Centralized API Management

// Service Manager (Recommended)
export { GraphServiceManager, graphServiceManager } from './GraphServiceManager';

// Core Authentication & Client
export { GraphAuthService, graphAuthService } from './core/GraphAuthService';
export { GraphClientService, graphClientService } from './core/GraphClientService';

// API Services
export { ContactsService } from './api/ContactsService';
export { PeopleService } from './api/PeopleService';
export { UsersService } from './api/UsersService';
export { MailService } from './api/MailService';
export { CalendarService } from './api/CalendarService';

// Types
export type * from './types';

// Utils
export { graphErrorHandler, formatGraphError, withRetry } from './utils/errorHandler';
export { graphDataTransformers } from './utils/dataTransformers'; 