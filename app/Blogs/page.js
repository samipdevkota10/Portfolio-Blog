'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // 📦 Fetch Blogs from Firestore
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, 'Blogs');
        const querySnapshot = await getDocs(blogsCollection);
        const blogsList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(blog => typeof blog.content === 'string');
        setBlogs(blogsList);
      } catch (error) {
        console.error('Error fetching blogs:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // 🗑️ Delete Blog
  const handleDelete = async (blogId) => {
    const confirmDelete = confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'Blogs', blogId));
      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
      alert('Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog:', error.message);
      alert('Failed to delete blog. Please try again later.');
    }
  };

  // ✏️ Edit Blog
  const handleEdit = (blog) => {
    router.push(
      `/write?id=${blog.id}&title=${encodeURIComponent(blog.title)}&content=${encodeURIComponent(blog.content)}`
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 📚 Navbar */}
      <Navbar />

      {/* 📝 Main Content */}
      <main className="flex-1 px-8 py-6 w-full max-w-screen-lg mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-left">Blogs</h1>

        {/* 📦 Loading or Empty State */}
        {loading ? (
          <p className="text-gray-500 text-center">Loading blogs...</p>
        ) : blogs.length === 0 ? (
          <p className="text-gray-500 text-center">No blogs found.</p>
        ) : (
          <ul className="space-y-4">
            {blogs.map((blog) => (
              <li
                key={blog.id}
                className="p-6 border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white flex flex-col md:flex-row justify-between items-start w-full overflow-hidden"
              >
                {/* 📄 Blog Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/Blogs/${blog.id}`} className="block hover:underline">
                    <h1 className="text-xl font-bold text-blue-700 mb-2 truncate break-words">
                      {blog.title || 'Untitled Blog'}
                    </h1>
                  </Link>

                  <p className="text-gray-600 mt-2 line-clamp-2 break-words">
                    {blog.content || 'No content available'}
                  </p>

                  <p className="text-sm text-gray-400 mt-2">
                    Posted on:{' '}
                    {blog.createdAt?.toDate
                      ? blog.createdAt.toDate().toLocaleDateString()
                      : 'Unknown Date'}
                  </p>
                </div>

                {/* 🛠️ Edit/Delete Buttons */}
                {user && (
                  <div className="flex flex-row md:flex-col gap-2 ml-0 md:ml-6 mt-4 md:mt-0">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="px-4 py-2 text-sm text-gray-800 bg-yellow-100 hover:bg-yellow-200 rounded-md"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-4 py-2 text-sm text-red-600 bg-red-100 hover:bg-red-200 rounded-md"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* 📃 Footer */}
      <Footer />
    </div>
  );
}
