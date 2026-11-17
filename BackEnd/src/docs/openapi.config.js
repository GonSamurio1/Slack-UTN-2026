import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'
import ENVIROMMENT from '../config/enviromment.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/*
Configuracion de la documentacion OpenAPI 3.0 servida con Swagger UI.

- La definicion global (info, servers, tags, esquemas reutilizables) vive acá.
- Los paths de cada endpoint se declaran con comentarios JSDoc "@openapi"
  junto a la definicion de sus rutas (src/routes/*.router.js).

Ruta de la UI:  /api/docs
Spec cruda JSON: /api/docs.json
*/

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'UTN Slack API',
    version: '1.0.0',
    description: `
API del clon simplificado de Slack: espacios de trabajo (Workspaces) con miembros y roles.

**Convención de respuesta:** todos los endpoints devuelven JSON con las propiedades
\`ok\`, \`status\`, \`message\` y (cuando aplica) \`data\`.

**Autenticación:** los endpoints protegidos esperan el header
\`Authorization: Bearer <authToken>\`, donde \`authToken\` es el JWT que devuelve
\`POST /api/auth/login\` (vence a los 7 días). Usá el botón **Authorize** de la UI para pegarlo y probarlos.

**Errores:** manejados por un middleware central. Errores controlados responden su código
(400/401/403/404) con \`ok: false\`; errores inesperados responden \`500\`; si falla la conexión
a MongoDB responde \`503\`.
`.trim()
  },

  // Servidor de producción tomado de la variable de entorno URL_BACKEND (si esta definida)
  servers: [
    { url: 'http://localhost:3000', description: 'Desarrollo local' },
    ...(ENVIROMMENT.URL_BACKEND
      ? [{
          url: ENVIROMMENT.URL_BACKEND,
          description: ENVIROMMENT.URL_BACKEND.includes('localhost')
            ? 'Backend local (URL_BACKEND de .env)'
            : 'Producción (Vercel)'
        }]
      : [])
  ],

  tags: [
    { name: 'Auth', description: 'Autenticación y gestión de cuentas (públicos, sin token)' },
    { name: 'Users', description: 'Consulta de usuarios registrados (requieren token JWT)' },
    { name: 'Workspaces', description: 'Espacios de trabajo y gestión de miembros (requieren token JWT)' }
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT devuelto por POST /api/auth/login (data.authToken). Header: Authorization: Bearer <token>'
      }
    },

    // Esquemas reutilizables (formatos de entrada/salida) -->
    schemas: {
      // Envelope común de toda respuesta exitosa (sin data)
      Envelope: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          status: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Mensaje descriptivo' }
        }
      },

      // Envelope de error (400/401/403/404/500/503)
      ApiError: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          status: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Mensaje del error' }
        }
      },

      // Usuario (el hash de password nunca se devuelve: select: false en el modelo)
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c9e2f4a3b0012345678' },
          nombre: { type: 'string', example: 'Gonza' },
          email: { type: 'string', format: 'email', example: 'gonza@mail.com' },
          fecha_creacion: { type: 'string', format: 'date-time' },
          activo: { type: 'boolean', example: true },
          emailVerificado: { type: 'boolean', example: true }
        }
      },

      // Espacio de trabajo
      Workspace: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c9e2f4a3b0012345679' },
          name: { type: 'string', maxLength: 30, example: 'Equipo Backend' },
          description: { type: 'string', maxLength: 1000, example: 'Workspace del equipo de backend' },
          fecha_creacion: { type: 'string', format: 'date-time' }
        }
      },

      // Membresía (miembro de un workspace con su rol)
      Member: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c9e2f4a3b0012345680' },
          id_usuario: { type: 'string', description: 'ObjectId del usuario', example: '665f1c9e2f4a3b0012345678' },
          espacio_trabajo: { type: 'string', description: 'ObjectId del workspace', example: '665f1c9e2f4a3b0012345679' },
          rol: { type: 'string', enum: ['owner', 'admin', 'user'], example: 'owner' },
          fecha_creacion: { type: 'string', format: 'date-time' },
          invitacion_aceptada: { type: 'boolean', example: true }
        }
      },

      // Membresía con datos del usuario poblados (GET /:workspace_id/members)
      MemberWithUser: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c9e2f4a3b0012345680' },
          id_usuario: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '665f1c9e2f4a3b0012345678' },
              nombre: { type: 'string', example: 'Gonza' },
              email: { type: 'string', format: 'email', example: 'gonza@mail.com' }
            }
          },
          espacio_trabajo: { type: 'string', example: '665f1c9e2f4a3b0012345679' },
          rol: { type: 'string', enum: ['owner', 'admin', 'user'], example: 'owner' },
          fecha_creacion: { type: 'string', format: 'date-time' },
          invitacion_aceptada: { type: 'boolean', example: true }
        }
      },

      // Item de GET /api/workspace (membresía + datos resumidos del workspace)
      UserWorkspaceItem: {
        type: 'object',
        properties: {
          member_id: { type: 'string', example: '665f1c9e2f4a3b0012345680' },
          member_rol: { type: 'string', enum: ['owner', 'admin', 'user'], example: 'owner' },
          workspace_id: { type: 'string', example: '665f1c9e2f4a3b0012345679' },
          workspace_nombre: { type: 'string', example: 'Equipo Backend' },
          workspace_fecha_creacion: { type: 'string', format: 'date-time' }
        }
      },

      // data de POST /api/workspace
      CreatedWorkspaceData: {
        type: 'object',
        properties: {
          workspace: { $ref: '#/components/schemas/Workspace' },
          membership: { $ref: '#/components/schemas/Member' }
        }
      },

      // data de POST /api/auth/login
      AuthTokenData: {
        type: 'object',
        properties: {
          authToken: {
            type: 'string',
            description: 'JWT de sesión (payload: id, name, email). Vence a los 7 días.',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      }
    },

    // Respuestas de error comunes a todos los endpoints -->
    responses: {
      Unauthorized401: {
        description: 'Token JWT inválido o expirado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { ok: false, status: 401, message: 'Auth token is invalid!' }
          }
        }
      },
      InternalError500: {
        description: 'Error inesperado no controlado (registrado por consola)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { ok: false, status: 500, message: 'Internal server error' }
          }
        }
      },
      ServiceUnavailable503: {
        description: 'No se pudo conectar a MongoDB',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: { ok: false, status: 503, message: 'No se pudo conectar a la base de datos' }
          }
        }
      }
    }
  }
}

const swaggerSpec = swaggerJsdoc({
  definition,
  // Paths declarados con comentarios @openapi en los routers.
  // Ruta absoluta construida desde este archivo para que funcione igual
  // en local y en Vercel (donde el cwd puede variar).
  apis: [
    path.resolve(__dirname, '../routes/auth.router.js').replace(/\\/g, '/'),
    path.resolve(__dirname, '../routes/user.router.js').replace(/\\/g, '/'),
    path.resolve(__dirname, '../routes/workspace.router.js').replace(/\\/g, '/')
  ]
})

export default swaggerSpec
