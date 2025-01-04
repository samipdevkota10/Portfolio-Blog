'use client';

import { Suspense, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';

function WriteContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Initialize searchParams only on the client side
  const [searchParams, setSearchParams] = useState(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blogId, setBlogId] = useState(null);
  const [wordCount, setWordCount] = useState(0);

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) router.push('/');
  }, [user, isLoaded, router]);

  // Fetch search params and initialize blog editing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const id = searchParams.get('id');
      if (id) {
        setBlogId(id);
        setIsEditing(true);
        fetchBlog(id);
      }
    }
  }, [searchParams]);

  const fetchBlog = async (id) => {
    try {
      const blogRef = doc(db, 'Blogs', id);
      const blogSnap = await getDoc(blogRef);
      if (blogSnap.exists()) {
        const data = blogSnap.data();
        setTitle(data.title || '');
        setContent(data.content || '');
        setWordCount(data.content?.split(' ').length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch blog:', error.message);
    }
  };

  const saveBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required!');
      return;
    }

    setIsSaving(true);

    try {
      const blogsCollection = collection(db, 'Blogs');
      if (isEditing && blogId) {
        const blogRef = doc(db, 'Blogs', blogId);
        await updateDoc(blogRef, {
          title: title.trim(),
          content: content.trim(),
          author:  'Samip Devkota',
          updatedAt: serverTimestamp(),
        });
        alert('Blog updated successfully!');
      } else {
        await addDoc(blogsCollection, {
          title: title.trim(),
          content: content.trim(),
          author: user?.emailAddresses?.[0]?.emailAddress || 'Anonymous',
          createdAt: serverTimestamp(),
        });
        alert('Blog saved successfully!');
      }

      router.push('/');
    } catch (error) {
      console.error('Error saving/updating blog:', error.message);
      alert(`Failed to save blog: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setWordCount(e.target.value.split(' ').filter(Boolean).length);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 max-w-screen-lg mx-auto">
        <input
          type="text"
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl font-bold focus:outline-none mb-6 placeholder-gray-400 text-left"
        />

        <textarea
          placeholder="Write your blog content here..."
          value={content}
          onChange={handleContentChange}
          className="w-full h-[60vh] text-lg focus:outline-none placeholder-gray-400 text-left p-4 bg-white rounded-lg shadow-sm"
        />

        <div className="text-gray-500 text-sm mt-2 text-left">
          Word Count: {wordCount}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-8 flex justify-start gap-4 shadow-md">
        <button
          onClick={() => router.push('/')}
          className="text-lg font-medium hover:underline"
        >
          Cancel
        </button>
        <button
          onClick={saveBlog}
          disabled={isSaving}
          className={`text-lg font-medium ${
            isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:underline'
          }`}
        >
          {isSaving ? (isEditing ? 'Updating...' : 'Saving...') : isEditing ? 'Update Blog' : 'Save Blog'}
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WriteContent />
    </Suspense>
  );
}
