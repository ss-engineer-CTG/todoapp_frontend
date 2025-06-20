# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform desktop task management application called "階層型ToDoリストアプリケーション" (Hierarchical Todo List Application). It combines Electron, React/TypeScript frontend, and Python FastAPI backend to provide hierarchical task management with timeline visualization.

## Architecture

- **Desktop**: Electron 27.0.0 wrapper with main/renderer processes
- **Frontend**: React 18.2.0 + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend**: Python FastAPI 0.104.1 + SQLite + Uvicorn
- **Structure**: Feature-based organization with clean separation of concerns

## Essential Commands

### Development
```bash
npm run dev                 # Start all services (frontend + backend + electron)
npm run dev:frontend        # React dev server only (localhost:3000)
npm run dev:backend         # FastAPI server only (localhost:8000)
npm run dev:electron        # Electron app only
```

### Testing & Quality
```bash
npm run test               # Run all tests
npm run test:frontend      # Frontend tests
npm run test:backend       # Backend tests (pytest)
npm run lint               # Lint all code
npm run lint:frontend      # ESLint for frontend
npm run lint:backend       # Flake8 for backend
cd frontend && npm run type-check  # TypeScript checking
```

### Build & Package
```bash
npm run build              # Build all components
npm run package            # Create distributable packages
npm run clean              # Clean build artifacts
```

### Backend Development
```bash
cd backend
python app.py              # Start FastAPI development server
pip install -r requirements.txt  # Install Python dependencies
python -m pytest          # Run backend tests
```

## Key Architecture Patterns

### Frontend Structure
- **Feature modules**: `src/features/{feature}/` with components, hooks, types, utils
- **Core utilities**: `src/core/` for shared components, services, hooks
- **Component composition**: Radix UI primitives with custom styling
- **State management**: Custom React hooks, no external state library
- **API layer**: Centralized service in `src/core/services/api.ts`

### Backend Structure
- **Clean architecture**: Features separated into models, routes, schemas, services
- **Database**: SQLite with custom database manager in `core/database.py`
- **API routing**: FastAPI with feature-based route organization
- **Path aliases**: Comprehensive alias system for clean imports

### Electron Integration
- **Multi-process**: Main process manages Python backend, renderer for UI
- **Security**: Context isolation with preload scripts
- **Backend integration**: Automatic Python server startup and health checking
- **Cross-platform**: Windows, macOS, Linux support

## Database & API

### Database
- **Location**: `backend/todo.db` (SQLite)
- **Tables**: `projects`, `tasks` with hierarchical relationships
- **Auto-initialization**: Database created on first run

### API Endpoints
- **Base URL**: http://localhost:8000/api
- **Health**: `GET /api/health`
- **Projects**: CRUD operations at `/api/projects`
- **Tasks**: CRUD operations at `/api/tasks` with project filtering
- **Docs**: http://localhost:8000/docs (Swagger UI)

## Development Workflow

1. **Dependencies**: Install with `npm install` (handles frontend via postinstall)
2. **Backend setup**: `cd backend && pip install -r requirements.txt`
3. **Development**: `npm run dev` starts all services concurrently
4. **Frontend**: Vite dev server with hot reload on localhost:3000
5. **Backend**: FastAPI with auto-reload on localhost:8000
6. **Electron**: Desktop app launches after frontend/backend are ready

## Key Technologies & Libraries

### Frontend
- **UI**: Tailwind CSS + Radix UI components
- **Date handling**: date-fns
- **Icons**: lucide-react
- **Utilities**: clsx, tailwind-merge, class-variance-authority

### Backend
- **Web framework**: FastAPI
- **Server**: Uvicorn
- **Validation**: Pydantic
- **Date utilities**: python-dateutil

### Development Tools
- **Process management**: concurrently
- **Build**: electron-builder
- **Cross-platform scripts**: cross-env
- **Cleanup**: rimraf

## Process Flow Documentation

For detailed understanding of application processes and component interactions, refer to:
- **@sequence-diagrams.md** - Complete sequence diagrams showing data flow between Electron, React components, FastAPI backend, and SQLite database for all major operations (app startup, task creation, hierarchical operations, timeline drag & drop, project management, error handling)

## Important Notes

- **Port usage**: Frontend (3000), Backend (8000)
- **Process management**: Use `wait-on` for service readiness
- **Database location**: `backend/todo.db` (excluded from builds)
- **Log files**: `backend/logs/app.log`
- **Virtual environment**: Recommended for Python development
- **Node version**: Requires Node.js ≥16.0.0, npm ≥8.0.0