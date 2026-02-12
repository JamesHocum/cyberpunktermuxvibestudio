
# Projects Dashboard Page

## Overview
Create a dedicated `/projects` page that shows all your projects in a card grid layout -- similar to how Lovable shows a list of projects when you first log in. When you click a project, it opens it in the IDE. The current `/` route will check if a project is loaded and redirect to `/projects` if not.

## What You'll See
- A full-page dashboard with your project cards in a responsive grid
- Each card shows the project name, description, last updated time, and action buttons (Open, Delete)
- A "New Project" card/button to create projects inline
- Clicking a project navigates to the IDE (`/`) with that project loaded

## Technical Approach

### 1. Create `/projects` route and page
New file: `src/pages/Projects.tsx`
- Full-page layout with cyberpunk styling
- Header with "CYBERPUNK TERMUX" branding and user controls
- Responsive grid of project cards (1 col mobile, 2 col tablet, 3 col desktop)
- "Create New Project" card with inline name/description inputs
- Uses `useProject` hook for data (already fetches from database on mount)
- On project click: call `loadProject(id)` then navigate to `/`

### 2. Update routing in App.tsx
- Add `/projects` route (protected)
- Both `/` and `/projects` are behind `ProtectedRoute`

### 3. Update StudioLayout to redirect when no project
- If no `currentProject` is loaded and the user hits `/`, show a prompt or redirect to `/projects`
- Add a "Back to Projects" button in the header

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Projects.tsx` | Projects dashboard page with card grid |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/projects` route |
| `src/components/StudioHeader.tsx` | Add "Projects" navigation button |
| `src/components/StudioLayout.tsx` | Redirect to `/projects` if no project loaded |
