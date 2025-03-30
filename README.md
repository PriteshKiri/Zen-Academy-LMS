# Zen Academy LMS

Zen Academy is an AI-powered Learning Management System (LMS) designed for structured learning with a simple, intuitive interface. Built with Vite React and Tailwind CSS for the frontend and Supabase for the backend.

## Features

- **User Authentication**: Email and password login with role-based access
- **Role-Based Access Control**: Admin and normal user roles with different permissions
- **Learning Interface**: YouTube video player with module and chapter navigation
- **Course Management**: Admins can create, edit, and delete modules and chapters
- **User Management**: Admins can create, edit, and delete users
- **Profile Settings**: Users can update their profile information

## Tech Stack

- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Authentication, Database)
- **State Management**: React Context API
- **Routing**: React Router
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/zen-academy-lms.git
   cd zen-academy-lms
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project and set up the following tables:

   **Users Table**:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

   **Modules Table**:
   ```sql
   CREATE TABLE modules (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     title TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

   **Chapters Table**:
   ```sql
   CREATE TABLE chapters (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     title TEXT NOT NULL,
     module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
     youtube_link TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('draft', 'live')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. Create a `.env` file based on `.env.example` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Deploy the contents of the `dist` folder to your hosting provider of choice.

## License

This project is licensed under the MIT License - see the LICENSE file for details.