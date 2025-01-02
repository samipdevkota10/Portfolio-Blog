"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase";
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
} from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentBlogs, setRecentBlogs] = useState([]);

  // Fetch Blog Details and Comments
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        // Fetch Blog Details
        const docRef = doc(db, "Blogs", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.warn("Blog not found");
        }

        // Fetch Comments
        const commentsRef = collection(db, "Blogs", id, "comments");
        const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"));
        const commentsSnapshot = await getDocs(commentsQuery);

        const fetchedComments = commentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);

        // Fetch Recent Blogs
        const recentBlogsQuery = query(
          collection(db, "Blogs"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentBlogsQuery);
        setRecentBlogs(
          recentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error fetching blog:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [id]);

  // Add a New Comment
  const handleAddComment = async () => {
    if (!commentInput || !commentAuthor) {
      alert("Please enter your name and comment.");
      return;
    }
    try {
      const commentsRef = collection(db, "Blogs", id, "comments");
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
      setCommentInput("");
      setCommentAuthor("");
    } catch (error) {
      console.error("Error adding comment:", error.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!blog) return <p>Blog not found!</p>;

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Blog Content */}
        <div className="col-span-2">
          <h1 className="text-4xl font-bold">{blog.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(blog.createdAt?.toDate()).toLocaleDateString()} •{" "}
            {blog.author}
          </p>
          <div className="mt-4 text-gray-700">{blog.content}</div>
        </div>

        {/* Sidebar - Recent Blogs */}
        <div>
          <h3 className="text-xl font-bold mb-4">Recent Blogs</h3>
          <ul className="space-y-2">
            {recentBlogs.map((blog) => (
              <li key={blog.id}>
                <a
                  href={`/Blogs/${blog.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {blog.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Comments Section */}
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
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-md"
            />
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
      key={comment.id || `comment-${index}`} // Fallback to index if no ID
      className="p-2 border rounded-md shadow-sm text-gray-700"
    >
      <p className="text-gray-800">{comment.content}</p>
      <div className="text-sm text-gray-500 flex justify-between mt-1">
        <span>Author: {comment.author || "Anonymous"}</span>
        <span>
          {comment.createdAt?.toDate
            ? new Date(comment.createdAt.toDate()).toLocaleDateString()
            : "Unknown Date"}
        </span>
      </div>
    </li>
  ))}
</ul>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
