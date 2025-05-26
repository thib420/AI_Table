import { GraphClientService } from '@/shared/services/microsoft-graph/core/GraphClientService'
import { GraphAuthService } from '@/shared/services/microsoft-graph/core/GraphAuthService'

// Mock the GraphAuthService
jest.mock('@/shared/services/microsoft-graph/core/GraphAuthService')
const mockGraphAuthService = GraphAuthService as jest.Mocked<typeof GraphAuthService>

// Mock the Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: jest.fn(() => ({
      api: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        expand: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  },
}))

describe('GraphClientService', () => {
  let graphClientService: GraphClientService
  let mockAuthService: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock auth service instance
    mockAuthService = {
      getAccessToken: jest.fn(),
      isSignedIn: jest.fn(),
    }

    // Mock the getInstance method
    mockGraphAuthService.getInstance = jest.fn(() => mockAuthService)

    // Get a fresh instance
    graphClientService = GraphClientService.getInstance()
  })

  describe('initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = GraphClientService.getInstance()
      const instance2 = GraphClientService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should initialize with default config', () => {
      expect(graphClientService).toBeDefined()
    })
  })

  describe('authentication', () => {
    it('should check authentication status', () => {
      mockAuthService.isSignedIn.mockReturnValue(true)
      expect(graphClientService.isAuthenticated()).toBe(true)

      mockAuthService.isSignedIn.mockReturnValue(false)
      expect(graphClientService.isAuthenticated()).toBe(false)
    })

    it('should throw error when no access token is available', async () => {
      mockAuthService.getAccessToken.mockResolvedValue(null)

      await expect(graphClientService.getClient()).rejects.toThrow(
        'No access token available for Microsoft Graph'
      )
    })
  })

  describe('makeRequest', () => {
    beforeEach(() => {
      mockAuthService.getAccessToken.mockResolvedValue('mock-token')
    })

    it('should make a GET request with proper endpoint versioning', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.get.mockResolvedValue({ data: 'test' })

      const result = await graphClientService.makeRequest('/me')

      expect(mockClient.api).toHaveBeenCalledWith('/v1.0/me')
      expect(mockRequest.get).toHaveBeenCalled()
      expect(result).toEqual({ data: 'test' })
    })

    it('should handle endpoints that already include version', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.get.mockResolvedValue({ data: 'test' })

      await graphClientService.makeRequest('/v1.0/me/messages')

      expect(mockClient.api).toHaveBeenCalledWith('/v1.0/me/messages')
    })

    it('should apply query parameters correctly', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.get.mockResolvedValue({ data: 'test' })

      await graphClientService.makeRequest('/me', {
        select: ['id', 'displayName'],
        filter: 'startswith(displayName,\'John\')',
        orderBy: 'displayName',
        top: 10,
        skip: 5,
      })

      expect(mockRequest.select).toHaveBeenCalledWith('id,displayName')
      expect(mockRequest.filter).toHaveBeenCalledWith('startswith(displayName,\'John\')')
      expect(mockRequest.orderby).toHaveBeenCalledWith('displayName')
      expect(mockRequest.top).toHaveBeenCalledWith(10)
      expect(mockRequest.skip).toHaveBeenCalledWith(5)
    })

    it('should handle POST requests', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.post.mockResolvedValue({ id: 'new-item' })

      const body = { name: 'Test Item' }
      const result = await graphClientService.makeRequest('/me/contacts', {
        method: 'POST',
        body,
      })

      expect(mockRequest.post).toHaveBeenCalledWith(body)
      expect(result).toEqual({ id: 'new-item' })
    })

    it('should handle PATCH requests', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.patch.mockResolvedValue({ updated: true })

      const updates = { displayName: 'Updated Name' }
      const result = await graphClientService.makeRequest('/me/contacts/123', {
        method: 'PATCH',
        body: updates,
      })

      expect(mockRequest.patch).toHaveBeenCalledWith(updates)
      expect(result).toEqual({ updated: true })
    })

    it('should handle DELETE requests', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.delete.mockResolvedValue(undefined)

      await graphClientService.makeRequest('/me/contacts/123', {
        method: 'DELETE',
      })

      expect(mockRequest.delete).toHaveBeenCalled()
    })

    it('should throw error for unsupported HTTP methods', async () => {
      await expect(
        graphClientService.makeRequest('/me', {
          method: 'PUT' as any,
        })
      ).rejects.toThrow('Unsupported HTTP method: PUT')
    })

    it('should handle API errors gracefully', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      const apiError = new Error('API Error')
      mockRequest.get.mockRejectedValue(apiError)

      await expect(graphClientService.makeRequest('/me')).rejects.toThrow('API Error')
    })
  })

  describe('makePaginatedRequest', () => {
    beforeEach(() => {
      mockAuthService.getAccessToken.mockResolvedValue('mock-token')
    })

    it('should handle single page response', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      mockRequest.get.mockResolvedValue({
        value: [{ id: '1' }, { id: '2' }],
      })

      const result = await graphClientService.makePaginatedRequest('/me/contacts')

      expect(result).toEqual([{ id: '1' }, { id: '2' }])
    })

    it('should handle multiple pages', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()

      // First page
      mockRequest.get
        .mockResolvedValueOnce({
          value: [{ id: '1' }, { id: '2' }],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/contacts?$skip=2',
        })
        // Second page
        .mockResolvedValueOnce({
          value: [{ id: '3' }, { id: '4' }],
        })

      const result = await graphClientService.makePaginatedRequest('/me/contacts')

      expect(result).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }])
      expect(mockClient.api).toHaveBeenCalledTimes(2)
    })

    it('should respect maxPages limit', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()

      mockRequest.get.mockResolvedValue({
        value: [{ id: '1' }],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/contacts?$skip=1',
      })

      const result = await graphClientService.makePaginatedRequest('/me/contacts', {
        maxPages: 1,
      })

      expect(result).toEqual([{ id: '1' }])
      expect(mockClient.api).toHaveBeenCalledTimes(1)
    })

    it('should handle nextLink URLs correctly', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()

      mockRequest.get
        .mockResolvedValueOnce({
          value: [{ id: '1' }],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/contacts?$skip=1&$top=1',
        })
        .mockResolvedValueOnce({
          value: [{ id: '2' }],
        })

      await graphClientService.makePaginatedRequest('/me/contacts')

      expect(mockClient.api).toHaveBeenNthCalledWith(1, '/v1.0/me/contacts')
      expect(mockClient.api).toHaveBeenNthCalledWith(2, '/v1.0/me/contacts?$skip=1&$top=1')
    })
  })

  describe('getCurrentUser', () => {
    beforeEach(() => {
      mockAuthService.getAccessToken.mockResolvedValue('mock-token')
    })

    it('should get current user with correct fields', async () => {
      const mockClient = require('@microsoft/microsoft-graph-client').Client.init()
      const mockRequest = mockClient.api()
      const mockUser = {
        id: '123',
        displayName: 'John Doe',
        mail: 'john@example.com',
      }
      mockRequest.get.mockResolvedValue(mockUser)

      const result = await graphClientService.getCurrentUser()

      expect(mockClient.api).toHaveBeenCalledWith('/v1.0/me')
      expect(mockRequest.select).toHaveBeenCalledWith(
        'id,displayName,mail,userPrincipalName,jobTitle,department'
      )
      expect(result).toEqual(mockUser)
    })
  })
}) 