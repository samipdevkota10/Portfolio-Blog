"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function WriteContent() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState(null);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blogId, setBlogId] = useState(null);

  // Ref for the editable content
  const contentRef = useRef(null);

  /**
   * 📥 Fetch query parameters
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  /**
   * 📥 Fetch blog data for editing
   */
  useEffect(() => {
    if (searchParams) {
      const id = searchParams.get("id");
      if (id) {
        setBlogId(id);
        setIsEditing(true);
        fetchBlog(id);
      }
    }
  }, [searchParams]);

  const fetchBlog = async (id) => {
    try {
      const blogRef = doc(db, "Blogs", id);
      const blogSnap = await getDoc(blogRef);
      if (blogSnap.exists()) {
        const data = blogSnap.data();
        setTitle(data.title || "");
        if (data.contentURL) {
          const response = await fetch(data.contentURL);
          const textContent = await response.text();
          if (contentRef.current) {
            contentRef.current.innerHTML = textContent;
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error.message);
    }
  };

  /**
   * 📤 Upload content to Firebase Storage
   */
  const uploadToStorage = async (file, folder, fileType = "text/html") => {
    try {
      const contentBlob = new Blob([file], { type: fileType });
      const fileName = `${folder}/${title.replace(/\s/g, "_")}_${Date.now()}.html`;

      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, contentBlob, { contentType: fileType });
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error(`Failed to upload ${folder}:`, error.message);
      throw error;
    }
  };

  /**
   * 📤 Upload Image
   */
  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageURL = await getDownloadURL(storageRef);

      // Insert image into the content editor
      if (contentRef.current) {
        contentRef.current.innerHTML += `<img src="${imageURL}" alt="Uploaded Image" style="max-width: 100%; height: auto;" />`;
      }
    } catch (error) {
      console.error("Failed to upload image:", error.message);
    }
  };

  /**
   * 💾 Save Blog
   */
  const saveBlog = async () => {
    if (!title.trim() || !contentRef.current.innerHTML.trim()) {
      alert("Title and content are required!");
      return;
    }

    setIsSaving(true);

    try {
      const contentHTML = contentRef.current.innerHTML;
      const contentURL = await uploadToStorage(contentHTML, "blogs");

      const blogData = {
        title: title.trim(),
        contentURL,
        author: "Samip Devkota",
        updatedAt: serverTimestamp(),
      };

      if (isEditing && blogId) {
        const blogRef = doc(db, "Blogs", blogId);
        await updateDoc(blogRef, blogData);
        alert("Blog updated successfully!");
      } else {
        const blogsCollection = collection(db, "Blogs");
        blogData.createdAt = serverTimestamp();
        const docRef = await addDoc(blogsCollection, blogData);
        console.log("Blog saved with ID:", docRef.id);
        alert("Blog saved successfully!");
      }

      router.push("/");
    } catch (error) {
      console.error("Error saving blog:", error.message);
      alert(`Failed to save blog: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Toolbar Actions
   */
  const formatText = (command) => {
    document.execCommand(command, false, null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Blog Editor */}
      <div className="flex-1 px-8 py-6 mx-auto w-full max-w-screen-xl">
        {/* Title Input */}
        <input
          type="text"
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl font-bold mb-6 p-2 border-b border-gray-300 focus:outline-none"
        />

        {/* Toolbar */}
        <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
          <button onClick={() => formatText("bold")}>Bold</button>
          <button onClick={() => formatText("insertUnorderedList")}>Bullet List</button>
          <button onClick={() => formatText("insertOrderedList")}>Ordered List</button>
          <input type="file" onChange={uploadImage} />
        </div>

        {/* Content Editor */}
        <div
          ref={contentRef}
          contentEditable
          className="w-full min-h-[400px] border border-gray-300 rounded-lg p-4 bg-white shadow-md"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end gap-4 p-4 bg-white border-t">
        <button onClick={() => router.push("/")}>Cancel</button>
        <button onClick={saveBlog}>{isSaving ? "Saving..." : "Save Blog"}</button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
