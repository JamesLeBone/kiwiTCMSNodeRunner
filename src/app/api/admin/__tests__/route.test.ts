/**
 * @jest-environment node
 */

import { GET, POST } from '../route.js'
import { NextRequest } from 'next/server'

// Mock the dependencies
jest.mock('@server/lib/Users', () => ({
  list: jest.fn(),
  create: jest.fn(),
  setPassword: jest.fn(),
  login: jest.fn(),
}))

jest.mock('@server/db/Database', () => ({
  dbi: {
    fetch: jest.fn(),
    update: jest.fn(),
    run: jest.fn(),
  }
}))

// Mock environment variables
const originalEnv = process.env

describe('/api/admin Route Tests', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_KEY: 'test-admin-key'
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET /api/admin', () => {
    it('should return 401 for invalid auth key', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin?action=users', {
        headers: {
          'authkey': 'invalid-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorised')
    })

    it('should return users list with valid auth', async () => {
      const mockUsers = [
        { id: 1, username: 'testuser', email: 'test@example.com' }
      ]

      const Users = require('@server/lib/Users')
      Users.list.mockReturnValue(mockUsers)

      const request = new NextRequest('http://localhost:3000/api/admin?action=users', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockUsers)
      expect(Users.list).toHaveBeenCalled()
    })

    it('should return 404 when no users found', async () => {
      const Users = require('@server/lib/Users')
      Users.list.mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/admin?action=users', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('No users found')
    })

    it('should handle server errors gracefully', async () => {
      const Users = require('@server/lib/Users')
      Users.list.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/admin?action=users', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Database connection failed')
    })

    it('should return unknown action for unrecognized actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin?action=invalid_action', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Unknown action')
    })

    it('should handle logins action', async () => {
      const mockLogins = [
        { id: 1, username: 'testuser', login_time: '2023-01-01' }
      ]

      const { db } = require('@server/db/Database.ts')
      db.fetch.mockReturnValue(mockLogins)

      const request = new NextRequest('http://localhost:3000/api/admin?action=logins', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual(mockLogins)
      expect(db.fetch).toHaveBeenCalledWith('SELECT * FROM logins')
    })

    it('should return 404 when no logins found', async () => {
      const { db } = require('@server/db/Database.ts')
      db.fetch.mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/admin?action=logins', {
        headers: {
          'authkey': 'test-admin-key'
        }
      })

      const response = await GET(request)
      
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('No logins found')
    })
  })

  describe('POST /api/admin', () => {
    it('should handle user login', async () => {
      const Users = require('@server/lib/Users')
      Users.login.mockReturnValue({ success: true, user: { id: 1, username: 'testuser' } })

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          params: {
            username: 'testuser',
            password: 'password123'
          }
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('OK')
      expect(Users.login).toHaveBeenCalledWith('testuser', 'password123')
    })

    it('should return 400 for missing parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          params: {
            username: 'testuser'
            // missing password
          }
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing parameters')
    })

    it('should return 415 for invalid content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'text/plain'
        },
        body: 'invalid content'
      })

      const response = await POST(request)
      
      expect(response.status).toBe(415)
      expect(await response.text()).toBe('Invalid content type')
    })

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid JSON')
    })
  })

  describe('PUT /api/admin', () => {
    // Import PUT method
    const { PUT } = require('../route.js')

    it('should handle addUser action', async () => {
      const Users = require('@server/lib/Users')
      Users.create.mockReturnValue({ isError: false, data: { id: 1, username: 'newuser' } })
      Users.setPassword.mockReturnValue(true)

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'addUser',
          params: {
            username: 'newuser',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
            email: 'newuser@example.com'
          }
        })
      })

      const response = await PUT(request)
      
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('User added successfully')
      expect(Users.create).toHaveBeenCalledWith('newuser', 'New', 'User', 'newuser@example.com')
      expect(Users.setPassword).toHaveBeenCalledWith('newuser', 'password123', false)
    })

    it('should return 400 for missing parameters in addUser', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'addUser',
          params: {
            username: 'newuser'
            // missing other required fields
          }
        })
      })

      const response = await PUT(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing parameters')
    })
  })

  describe('DELETE /api/admin', () => {
    // Import DELETE method
    const { DELETE } = require('../route.js')

    it('should handle users deletion', async () => {
      const { db } = require('@server/db/Database.ts')
      db.run.mockReturnValue(1) // Mock successful deletions
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'DELETE',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'users',
          params: {
            userId: [1, 2]
          }
        })
      })

      const response = await DELETE(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData).toEqual({
        users: 2,
        logins: 2,
        sessions: 2
      })
      
      // Verify transaction calls
      expect(db.run).toHaveBeenCalledWith('BEGIN')
      expect(db.run).toHaveBeenCalledWith('COMMIT')
    })

    it('should rollback when nothing is deleted', async () => {
      const { db } = require('@server/db/Database.ts')
      db.run.mockReturnValue(0) // Mock no deletions
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'DELETE',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'users',
          params: {
            userId: [999]
          }
        })
      })

      const response = await DELETE(request)
      
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('Nothing deleted')
      expect(db.run).toHaveBeenCalledWith('ROLLBACK')
    })

    it('should return 400 for missing userId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'DELETE',
        headers: {
          'authkey': 'test-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'users',
          params: {}
        })
      })

      const response = await DELETE(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing parameters')
    })
  })
})