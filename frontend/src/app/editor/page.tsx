import type { Metadata } from 'next';
import { EditorLayout } from '@/components/editor/EditorLayout';

export const metadata: Metadata = {
  title: 'PDF Editor — Edit Your PDF Now',
  description:
    'Open your PDF and start editing instantly. Add text, draw annotations, insert images, apply stamps, sign documents, and download — free, no login required.',
  alternates: {
    canonical: '/editor',
  },
  openGraph: {
    title: 'PDF Editor — Edit Your PDF Now',
    description:
      'Open your PDF and start editing instantly. Free, private, no installation needed.',
    url: 'https://pdf-editor-f1av.vercel.app/editor',
  },
};

export default function EditorPage() {
  return <EditorLayout />;
}
