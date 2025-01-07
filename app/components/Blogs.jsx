"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase"; // Ensure correct firebase.js path
import { motion } from "framer-motion";
import Link from "next/link";
import DOMPurify from "dompurify";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay },
  },
});

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 Fetch Blogs with Metadata and Content from Firestore and Storage
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsQuery = query(
          collection(db, "Blogs"),
          orderBy("createdAt", "desc"),
          limit(3) // Fetch the latest 3 blogs
        );
        const querySnapshot = await getDocs(blogsQuery);

        // Fetch blog metadata and content
        const blogsList = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const blogData = {
              id: doc.id,
              ...doc.data(),
            };

            // Fetch content from Storage using contentURL
            if (blogData.contentURL) {
              try {
                const response = await fetch(blogData.contentURL);
                if (!response.ok) {
                  throw new Error(`Failed to fetch content for ${blogData.title}`);
                }
                const contentText = await response.text();
                blogData.content = DOMPurify.sanitize(contentText); // Sanitize HTML content
              } catch (error) {
                console.warn(
                  `Failed to fetch content for blog: ${blogData.title}`,
                  error.message
                );
                blogData.content = "Failed to load content.";
              }
            } else {
              blogData.content = "No content available.";
            }

            return blogData;
          })
        );

        setBlogs(blogsList);
      } catch (error) {
        console.error("Error fetching blogs:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <section className="border-b border-neutral-900 py-12">
      {/* 📚 Section Title */}
      <motion.h1
        variants={fadeIn(0)}
        initial="hidden"
        animate="visible"
        className="text-center text-4xl font-bold mb-8"
      >
        Recent Blogs
      </motion.h1>

      {/* 📦 Blog List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading blogs...</p>
      ) : blogs.length === 0 ? (
        <p className="text-center text-gray-500">No blogs found.</p>
      ) : (
        <div className="container mx-auto px-6 lg:px-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              variants={fadeIn(index * 0.2)}
              initial="hidden"
              animate="visible"
              className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 📝 Blog Title */}
              <h3 className="text-xl font-semibold mb-2">
                {blog.title || "Untitled Blog"}
              </h3>

              {/* 📅 Blog Date */}
              <p className="text-sm text-gray-500 mb-2">
                {blog.createdAt?.toDate
                  ? blog.createdAt.toDate().toLocaleDateString()
                  : "Unknown Date"}
              </p>

              {/* 📝 Blog Content Preview */}
              <div
                className="text-gray-700 mb-4 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html:
                    blog.content?.length > 100
                      ? `${blog.content.substring(0, 100)}...`
                      : blog.content || "No content available",
                }}
              ></div>

              {/* 🔗 Read More Link */}
              <Link
                href={`/Blogs/${blog.id}`}
                className="text-blue-600 hover:underline"
              >
                Read More →
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🔄 Load More Button */}
      <div className="text-center mt-8">
        <Link
          href="/Blogs"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Load More Blogs
        </Link>
      </div>
    </section>
  );
};

export default Blogs;
