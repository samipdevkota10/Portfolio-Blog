'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase'; // Ensure your firebase.js path is correct
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Blogs from Firestore
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, 'Blogs'); // Ensure collection name matches Firestore
        const querySnapshot = await getDocs(blogsCollection);
        const blogsList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(blog => typeof blog.content === 'string'); // Filter invalid blogs
        setBlogs(blogsList);

        // Debugging: Log invalid blogs
        querySnapshot.docs.forEach(doc => {
          if (!doc.data().content) {
            console.warn(`Blog with ID ${doc.id} is missing content.`);
          }
        });
      } catch (error) {
        console.error('Error fetching blogs:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
        <h1 className="text-4xl font-bold mb-6">Blogs</h1>

        {loading ? (
          <p>Loading blogs...</p>
        ) : blogs.length === 0 ? (
          <p>No blogs found.</p>
        ) : (
          <ul className="space-y-4">
            {blogs.map((blog) => (
              <li key={blog.id} className="p-4 border rounded-md shadow-sm">
                {/* Blog Title */}
                <h2 className="text-2xl font-semibold">{blog.title || 'Untitled Blog'}</h2>

                {/* Blog Content */}
                <p className="text-gray-600 mt-2">
                  {blog.content && blog.content.length > 100
                    ? `${blog.content.substring(0, 100)}...`
                    : blog.content || 'No content available'}
                </p>

                {/* Blog Date */}
                <p className="text-sm text-gray-500 mt-2">
                  Posted on:{' '}
                  {blog.createdAt?.toDate
                    ? blog.createdAt.toDate().toLocaleDateString()
                    : 'Unknown Date'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
