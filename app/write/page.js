'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
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

  const saveBlog = async () => {
    if (!title || !content) {
      alert('Title and content are required!');
      return;
    }

    setIsSaving(true);

    try {
      const blogsCollection = collection(db, 'blogs');
      await addDoc(blogsCollection, {
        title,
        content,
        author: user?.emailAddresses[0]?.emailAddress || 'Anonymous',
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
      <Navbar />
      <div className="flex-1 px-8 py-6">
        <input
          type="text"
          placeholder="Enter your title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl border-b mb-4 focus:outline-none"
        />
        <textarea
          placeholder="Write your blog content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 border-b mb-4 focus:outline-none resize-none"
        />
        <button
          onClick={saveBlog}
          disabled={isSaving}
          className={`mt-4 px-4 py-2 rounded-md ${
            isSaving ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isSaving ? 'Saving...' : 'Save Blog'}
        </button>
      </div>
      <Footer />
    </div>
  );
}
