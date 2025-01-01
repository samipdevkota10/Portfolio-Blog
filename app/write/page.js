'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WritePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!user || user?.emailAddresses[0]?.emailAddress !== 'samip.devkota@gmail.com') {
      router.push('/');
    }
  }, [user, isLoaded, router]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const saveBlog = async () => {
    const content = editor?.getHTML() || '';
    await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, author: user?.emailAddresses[0]?.emailAddress, imageUrl }),
    });
    router.push('/');
  };

  return (
    <div>
      <Navbar />
      <div className="px-8 pt-6">
        <input
          type="text"
          placeholder="Enter your title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl border-b mb-4 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border-b mb-4 focus:outline-none"
        />
        <EditorContent editor={editor} />
        <button
          onClick={saveBlog}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Save Blog
        </button>
      </div>
      <Footer />
    </div>
  );
}
