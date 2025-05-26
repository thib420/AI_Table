// CRM module exports

// Components
export { CRMPage } from './components/CRMPage';
export { DashboardView } from './components/DashboardView';
export { ContactsView } from './components/ContactsView';
export { DealsView } from './components/DealsView';
export { CompaniesView } from './components/CompaniesView';

// Services
export { graphCRMService } from './services/GraphCRMService';

// Types
export type { Contact, Deal, Company, CRMView, CRMPageProps } from './types';

// Utils
export { getStatusColor, getStageColor, generateProfilePicture } from './utils/helpers';
export { mockContacts, mockDeals, mockCompanies } from './utils/mockData'; 