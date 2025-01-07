'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  /**
   * 🚀 Fetch Blogs from Firestore and Content from Storage
   */
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, 'Blogs');
        const querySnapshot = await getDocs(blogsCollection);

        const blogsList = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const blogData = {
              id: doc.id,
              ...doc.data(),
            };

            // Fetch content from Storage if contentURL exists
            if (blogData.contentURL) {
              try {
                const response = await fetch(blogData.contentURL);
                if (!response.ok) {
                  throw new Error('Failed to fetch blog content');
                }
                const contentText = await response.text();
                blogData.content = DOMPurify.sanitize(contentText); // Sanitize HTML content
              } catch (error) {
                console.warn(
                  `Failed to fetch content for blog: ${blogData.title}`,
                  error.message
                );
                blogData.content = 'Failed to load content';
              }
            } else {
              blogData.content = 'No content available';
            }

            return blogData;
          })
        );

        setBlogs(blogsList);
      } catch (error) {
        console.error('Error fetching blogs:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  /**
   * 🗑️ Delete Blog
   */
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

  /**
   * ✏️ Edit Blog
   */
  const handleEdit = (blog) => {
    router.push(
      `/write?id=${blog.id}&title=${encodeURIComponent(blog.title)}&content=${encodeURIComponent(blog.content)}`
    );
  };

  /**
   * 📦 Render Component
   */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 📚 Navbar */}
      <Navbar />

      {/* 📝 Main Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 w-full max-w-screen-lg mx-auto">
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
                className="p-6 border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 w-full overflow-hidden"
              >
                {/* 📄 Blog Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/Blogs/${blog.id}`} className="block hover:underline">
                    <h1 className="text-xl font-bold text-blue-700 mb-2 break-words whitespace-normal md:line-clamp-2">
                      {blog.title || 'Untitled Blog'}
                    </h1>
                  </Link>
              
                  {/* 📝 Blog Content */}
                  <div
                    className="text-gray-600 mt-2 line-clamp-4 break-words whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: blog.content || 'No content available' }}
                  />
              
                  <p className="text-sm text-gray-400 mt-2">
                    Posted on:{' '}
                    {blog.createdAt?.toDate
                      ? blog.createdAt.toDate().toLocaleDateString()
                      : 'Unknown Date'}{' '}
                    • {blog.author || 'Anonymous'}
                  </p>
                </div>
              
                {/* 🛠️ Edit/Delete Buttons */}
                {user && (
                  <div className="flex flex-row md:flex-col gap-2 items-center md:items-start">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="w-full md:w-auto px-4 py-2 text-sm text-gray-800 bg-yellow-100 hover:bg-yellow-200 rounded-md"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="w-full md:w-auto px-4 py-2 text-sm text-red-600 bg-red-100 hover:bg-red-200 rounded-md"
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
