'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, storage} from '@/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import DOMPurify from 'dompurify'; // Sanitize HTML
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentBlogs, setRecentBlogs] = useState([]);

  /**
   * 🚀 Fetch Blog Metadata, Content, Comments, and Recent Blogs
   */
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);

        // 👉 Fetch Blog Metadata from Firestore
        const docRef = doc(db, 'Blogs', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const blogData = { id: docSnap.id, ...docSnap.data() };
          setBlog(blogData);

          // 👉 Fetch Blog Content from Storage using contentURL
          if (blogData.contentURL) {
            const response = await fetch(blogData.contentURL);
            if (!response.ok) {
              throw new Error('Failed to fetch blog content from Firebase Storage');
            }
            const contentText = await response.text();
            setBlog((prevBlog) => ({
              ...prevBlog,
              content: contentText,
            }));
          }
        } else {
          console.warn('Blog not found');
          setBlog(null);
        }

        // 👉 Fetch Comments
        const commentsRef = collection(db, 'Blogs', id, 'comments');
        const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        setComments(
          commentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        // 👉 Fetch Recent Blogs
        const recentBlogsQuery = query(
          collection(db, 'Blogs'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentBlogsQuery);
        setRecentBlogs(
          recentSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error('Error fetching blog data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [id]);

  /**
   * 📝 Add a New Comment
   */
  const handleAddComment = async () => {
    if (!commentInput || !commentAuthor) {
      alert('Please enter your name and comment.');
      return;
    }
    try {
      const commentsRef = collection(db, 'Blogs', id, 'comments');
      await addDoc(commentsRef, {
        content: commentInput,
        author: commentAuthor,
        createdAt: serverTimestamp(),
      });
      setComments((prev) => [
        {
          content: commentInput,
          author: commentAuthor,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setCommentInput('');
      setCommentAuthor('');
    } catch (error) {
      console.error('Error adding comment:', error.message);
    }
  };

  /**
   * 📦 Loading State
   */
  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!blog) return <p className="text-center text-red-500">Blog not found!</p>;

  /**
   * 🖥️ Render Page
   */
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 📝 Main Blog Content */}
        <div className="col-span-2">
          <h1 className="text-4xl font-bold mb-2">{blog.title}</h1>
          <p className="text-sm text-gray-500 mb-4">
            {blog.createdAt?.toDate
              ? new Date(blog.createdAt.toDate()).toLocaleDateString()
              : 'Unknown Date'}{' '}
            • {blog.author || 'Anonymous'}
          </p>
          {/* Render Sanitized HTML Content */}
          <div
            className="mt-4 text-gray-700 prose"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(blog.content || 'No content available'),
            }}
          />
        </div>

        {/* 📚 Sidebar - Recent Blogs */}
        <div>
          <h3 className="text-xl font-bold mb-4">Recent Blogs</h3>
          <ul className="space-y-2">
            {recentBlogs.map((recentBlog) => (
              <li key={recentBlog.id}>
                <a
                  href={`/Blogs/${recentBlog.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {recentBlog.title || 'Untitled Blog'}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 💬 Comments Section */}
        <div className="col-span-2 mt-8">
          <h3 className="text-xl font-bold mb-4">Comments</h3>
          <div>
            <input
              type="text"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full p-2 border rounded-md mb-2"
            />
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-md"
            ></textarea>
            <button
              onClick={handleAddComment}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Comment
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {comments.map((comment, index) => (
              <li
                key={comment.id || `comment-${index}`}
                className="p-2 border rounded-md shadow-sm text-gray-700"
              >
                <p className="text-gray-800">{comment.content}</p>
                <div className="text-sm text-gray-500 mt-1">
                  <span>Author: {comment.author || 'Anonymous'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
