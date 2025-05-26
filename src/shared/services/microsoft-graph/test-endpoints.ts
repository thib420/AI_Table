// Test script to validate Microsoft Graph API endpoints
import { graphClientService } from './core/GraphClientService';

export async function testGraphEndpoints() {
  console.log('🧪 Testing Microsoft Graph API endpoints...');
  
  try {
    // Test if client is authenticated
    if (!graphClientService.isAuthenticated()) {
      console.log('❌ Not authenticated - cannot test endpoints');
      return false;
    }

    // Test basic user endpoint
    console.log('Testing /me endpoint...');
    const user = await graphClientService.getCurrentUser();
    console.log('✅ User endpoint works:', user.displayName);

    // Test mail endpoint
    console.log('Testing /me/messages endpoint...');
    const messages = await graphClientService.makePaginatedRequest('/me/messages', {
      select: ['id', 'subject', 'receivedDateTime'],
      top: 5
    });
    console.log(`✅ Mail endpoint works: ${messages.length} messages retrieved`);

    return true;
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
    return false;
  }
}

// Export for use in components
export default testGraphEndpoints; 