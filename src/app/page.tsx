'use client';

import dynamic from 'next/dynamic';

const EditorLayout = dynamic(
  () => import('@/components/layout/EditorLayout').then((m) => m.EditorLayout),
  { ssr: false }
);

export default function Home() {
  return <EditorLayout />;
}
