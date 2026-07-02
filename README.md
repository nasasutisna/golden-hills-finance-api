# Golden Hills Finance Management System

A comprehensive, production-ready NestJS backend for managing residents, employees, invoicing, payments, inventory, salaries, and community events for Golden Hills.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Permission-based access control
  - Refresh token support
  - Email verification

- **User Management**
  - User CRUD operations
  - Role assignment
  - User activation/deactivation
  - Soft delete support

- **Resident Management**
  - Resident profiles with house assignment
  - House/Block management
  - Payment history tracking
  - Balance tracking

- **Employee Management**
  - Employee profiles
  - Position/Department management
  - Employment status tracking
  - Salary management

- **Financial Management**
  - Fee type management
  - Invoice generation
  - Payment processing
  - Cash transaction tracking
  - Transaction categories
  - Approval workflows

- **Inventory Management**
  - Stock management
  - Reorder level tracking
  - Inventory requests
  - Approval workflows

- **Salary Management**
  - Salary components
  - Payroll generation
  - Cash advance management
  - Salary calculation

- **Community Features**
  - Event management
  - Notification system
  - File attachments

## 📋 Tech Stack

- **Framework**: NestJS (latest)
- **Language**: TypeScript
- **Database**: MySQL 8
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Validation**: Class Validator + Class Transformer
- **API Documentation**: Swagger
- **File Upload**: Multer
- **Password Hashing**: Bcrypt

## 📦 Prerequisites

- Node.js 18+ and npm
- MySQL 8+
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd golden-hills-finance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - Database connection
   - JWT secrets
   - Application settings

4. **Setup database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed database (optional)
   npm run prisma:seed
   ```

5. **Start the application**
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## 🌐 API Documentation

Once the application is running, access Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🔐 Default Credentials

After seeding the database, you can login with:

**Admin User:**
- Username: `admin`
- Password: `Admin@123`

**Employee User:**
- Username: `johnson`
- Password: `Employee@123`

## 📁 Project Structure

```
golden-hills-finance/
├── src/
│   ├── auth/                    # Authentication module
│   ├── users/                   # User management
│   ├── roles/                   # Role management
│   ├── residents/               # Resident management
│   ├── house-blocks/            # House/block management
│   ├── employee-positions/      # Employee positions
│   ├── employees/               # Employee management
│   ├── fee-types/               # Fee type management
│   ├── resident-invoices/       # Invoice management
│   ├── resident-payments/       # Payment management
│   ├── transaction-categories/  # Transaction categories
│   ├── cash-transactions/       # Cash transactions
│   ├── inventories/             # Inventory management
│   ├── inventory-requests/      # Inventory requests
│   ├── approval-histories/      # Approval audit trail
│   ├── salary-components/       # Salary components
│   ├── employee-salary-headers/ # Salary headers
│   ├── employee-salary-details/ # Salary details
│   ├── employee-cash-advances/  # Cash advances
│   ├── community-events/        # Community events
│   ├── notifications/           # Notifications
│   ├── file-attachments/        # File attachments
│   ├── common/                  # Shared utilities
│   ├── config/                  # Configuration
│   ├── prisma/                  # Prisma service
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application entry
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed data
├── .env.example                 # Environment template
├── nest-cli.json               # NestJS CLI config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/verify-email` - Verify email

### Users
- `POST /api/v1/users` - Create user (Admin)
- `GET /api/v1/users` - Get all users (Admin, Manager)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user (Admin)
- `DELETE /api/v1/users/:id` - Soft delete user (Admin)
- `PATCH /api/v1/users/:id/restore` - Restore user (Admin)
- `PATCH /api/v1/users/:id/activate` - Activate user (Admin)
- `PATCH /api/v1/users/:id/deactivate` - Deactivate user (Admin)

### Roles
- `POST /api/v1/roles` - Create role (Admin)
- `GET /api/v1/roles` - Get all roles (Admin, Manager)
- `GET /api/v1/roles/:id` - Get role by ID
- `PATCH /api/v1/roles/:id` - Update role (Admin)
- `DELETE /api/v1/roles/:id` - Soft delete role (Admin)
- `PATCH /api/v1/roles/:id/restore` - Restore role (Admin)

## 🔍 Query Parameters

All list endpoints support:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort order: asc or desc (default: desc)
- `search` - Search keyword
- `searchFields` - Comma-separated fields to search in
- `filters` - JSON object with filter conditions
- `fields` - Comma-separated fields to include

Example:
```
GET /api/v1/users?page=1&limit=20&sortBy=firstName&sortOrder=asc&search=John&searchFields=firstName,lastName,isActive=true
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Bcrypt hashing
- **Role-Based Access Control**: Multiple user roles
- **Permission-Based Access**: Granular permissions
- **Soft Delete**: Data protection with soft deletes
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Prisma ORM protection
- **CORS Configuration**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling (configurable)

## 📝 Available Scripts

- `npm run start` - Start application
- `npm run start:dev` - Start with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:cov` - Generate test coverage
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## 🔧 Configuration

Key configuration options in `.env`:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT token expiration
- `UPLOAD_PATH` - File upload directory
- `MAX_FILE_SIZE` - Max file size in bytes

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using NestJS
# golden-hills-finance-api
