# Portfolio Website - Tools & Automation Engineer

A minimalist, engineering-focused portfolio website built with Next.js 14+, TypeScript, and Tailwind CSS, designed with Apple's Dark Mode aesthetic.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Design System

- **Background**: #000000 (Pure Black)
- **Surface**: #1C1C1E (Card backgrounds)
- **Border**: #2C2C2E
- **Text Primary**: #F5F5F7
- **Text Secondary**: #86868B
- **Accent**: #2997FF (Apple System Blue)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Deploy (Vercel will auto-detect Next.js configuration)

## Project Structure

```
portfolio_APPLE/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page with Hero and Projects
│   └── globals.css      # Global styles
├── components/
│   ├── BentoGrid.tsx    # Grid container for projects
│   └── Card.tsx         # Individual project card
├── constants/
│   └── data.ts          # Project data
└── ...config files
```

## Customization

Update project data in `constants/data.ts` to modify the projects displayed in the Bento Grid.

