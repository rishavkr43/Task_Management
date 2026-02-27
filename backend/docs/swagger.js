const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description:
        'REST API for Task Management with JWT auth, role-based access, and AES-encrypted task payloads. Built with Node.js, Express, and MongoDB.',
      contact: {
        name: 'GitHub Repository',
        url: 'https://github.com/rishavkr43/Task_Management'
      }
    },
    servers: [
      {
        url: 'https://task-management-alpha-peach-74.vercel.app/api/v1',
        description: 'Production'
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT stored as HTTP-only cookie (set automatically on login)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64abc123def456' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64abc123def789' },
            title: { type: 'string', example: 'Fix login bug' },
            description: { type: 'string', example: 'Check token expiry logic' },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              example: 'pending'
            },
            userId: { type: 'string', example: '64abc123def456' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 3 },
            totalTasks: { type: 'integer', example: 25 },
            limit: { type: 'integer', example: 10 }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descriptive error message' }
          }
        }
      }
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'user@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error or email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT cookie',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful — sets HTTP-only cookie `token`',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout — clears the JWT cookie',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Logout successful' }
          }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get currently authenticated user',
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: 'Current user info',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
            },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'Get all tasks (paginated, with search & filter)',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'all'] } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by title (case-insensitive)' }
          ],
          responses: {
            200: {
              description: 'Task list with pagination metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a new task',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Fix login bug' },
                    description: { type: 'string', example: 'Check token expiry logic' },
                    status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Task created — description is AES-256 encrypted at rest' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Get a single task by ID',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Task object' },
            404: { description: 'Task not found' }
          }
        },
        put: {
          tags: ['Tasks'],
          summary: 'Update a task',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Task updated' },
            404: { description: 'Task not found' }
          }
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Task deleted' },
            404: { description: 'Task not found' }
          }
        }
      },
      '/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all users (admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: {
            200: { description: 'Paginated user list' },
            403: { description: 'Forbidden — not an admin' }
          }
        }
      },
      '/admin/tasks': {
        get: {
          tags: ['Admin'],
          summary: 'List all tasks across all users (admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'all'] } },
            { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Filter tasks by a specific user ID' }
          ],
          responses: {
            200: { description: 'Paginated task list with user info' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/admin/users/{id}/role': {
        patch: {
          tags: ['Admin'],
          summary: 'Change a user\'s role (admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['user', 'admin'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Role updated' },
            400: { description: 'Invalid role or self-demotion attempt' },
            403: { description: 'Forbidden' },
            404: { description: 'User not found' }
          }
        }
      },
      '/admin/users/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Delete a user and all their tasks (admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User and tasks deleted' },
            403: { description: 'Forbidden' },
            404: { description: 'User not found' }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
