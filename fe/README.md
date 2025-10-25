# Frontend - Medical AI Learning Platform

Next.js-based frontend for the Medical AI Learning Platform, providing an intuitive interface for students and teachers to interact with the AI-powered medical education system.

## Features

- **Authentication**: Secure login and registration with JWT
- **Role-Based Access**: Separate interfaces for students and teachers
- **Interactive Chat**: Real-time chatbot for medical questions
- **Fracture Detection**: Visual interface for X-ray analysis and annotation
- **Document Upload**: Upload medical documents for RAG-enhanced learning
- **Resizable Panels**: Flexible layout with adjustable panels
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: Modern state management

## Project Structure

```
fe/
├── app/
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── student/           # Student dashboard
│   ├── teacher/           # Teacher dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── chat/              # Chatbot components
│   ├── fracture/          # Fracture detection components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
│   └── api.ts             # API client functions
├── types/
    └── index.ts           # TypeScript type definitions
```

## Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Running backend server

### Setup Steps

1. **Install dependencies**:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Start development server**:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
