# Modern PDF Editor - Frontend

This is a modern, feature-rich PDF Editor built with Next.js, React, and Tailwind CSS.

## Features

- **Full PDF Editing:** Add text, signatures, shapes, and images to PDFs completely client-side.
- **Robust Theming:** A seamlessly integrated Dark Mode that adapts the entire UI interface.
- **Stamping Engine:** Apply standard stamps (Draft, Approved, Confidential, Final, Void) or create your own custom text stamps.
- **Copyright Protection:** Includes an overlaid UI watermark to discourage unauthorized copying of the web application.
- **Web Analytics:** Pre-configured with Google Analytics (GA4) integration. (Just add your Measurement ID to `.env.local`).

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Add your Google Analytics ID (Optional):
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the editor.
