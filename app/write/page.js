'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WritePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/');
    }
  }, [user, isLoaded, router]);

  // Save Blog to Firestore
  const saveBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required!');
      return;
    }

    setIsSaving(true);

    try {
      const blogsCollection = collection(db, 'blogs');
      await addDoc(blogsCollection, {
        title: title.trim(),
        content: content.trim(),
        author: user?.emailAddresses?.[0]?.emailAddress || 'Anonymous',
        createdAt: serverTimestamp(),
      });

      alert('Blog saved successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error saving blog:', error.message);
      alert(`Failed to save blog: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 px-8 py-6">
        <h1 className="text-4xl font-bold mb-6">Write a New Blog</h1>

        {/* Blog Title */}
        <input
          type="text"
          placeholder="Enter your title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl border-b mb-4 focus:outline-none p-2"
        />

        {/* Blog Content */}
        <textarea
          placeholder="Write your blog content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 border mb-4 focus:outline-none p-2 resize-none"
        />

        {/* Save Button */}
        <button
          onClick={saveBlog}
          disabled={isSaving}
          className={`mt-4 px-4 py-2 rounded-md text-white ${
            isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Blog'}
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
