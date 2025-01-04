'use client';

import { useState, useEffect, useReducer } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

// 🔄 Animation Variants
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

// 🔄 Initial State for New Project
const initialState = {
  Name: '',
  description: '',
  tech: [],
  githubUrl: '',
};

// 🔧 Reducer for Form State Management
const projectReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'ADD_TECH':
      return { ...state, tech: [...state.tech, action.value] };
    case 'REMOVE_TECH':
      return { ...state, tech: state.tech.filter((_, index) => index !== action.index) };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newTech, setNewTech] = useState('');
  const [formState, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useUser();

  // 🔄 Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectQuery = query(
          collection(db, 'projects'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const querySnapshot = await getDocs(projectQuery);
        const projectsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsList);
      } catch (error) {
        console.error('Error fetching projects:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 📝 Handle Add Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!formState.Name || !formState.description || !formState.githubUrl) {
      setFormError('All required fields must be filled!');
      setFormLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'projects'), {
        ...formState,
        createdAt: serverTimestamp(),
      });

      dispatch({ type: 'RESET' });
      setFormVisible(false);
      alert('Project added successfully!');

      // Refresh Projects
      const projectQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const querySnapshot = await getDocs(projectQuery);
      const projectsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsList);
    } catch (error) {
      console.error('Error adding project:', error.message);
      setFormError('Failed to add project. Try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // 🛠️ Handle Adding Technology
  const handleAddTech = () => {
    if (newTech.trim()) {
      dispatch({ type: 'ADD_TECH', value: newTech.trim() });
      setNewTech('');
    }
  };

  const handleRemoveTech = (index) => {
    dispatch({ type: 'REMOVE_TECH', index });
  };

  return (
    <section id="Projects" className="relative bg-white text-black overflow-hidden py-8 lg:py-16 border-t border-neutral-200">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Title and Add Button */}
        <div className="flex justify-between items-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-6xl font-thin tracking-tight"
          >
            Projects
          </motion.h1>
          {user && (
            <button
              onClick={() => setFormVisible(!formVisible)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {formVisible ? 'Cancel' : 'Add Project'}
            </button>
          )}
        </div>

        {/* Add Project Form */}
        {formVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-12 p-6 border rounded-md shadow-md"
          >
            <form onSubmit={handleAddProject} className="space-y-4">
              {['Name', 'description', 'githubUrl'].map((field) => (
                <input
                  key={field}
                  type="text"
                  value={formState[field]}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field, value: e.target.value })}
                  className="w-full rounded-md border p-2"
                  required
                />
              ))}
              <div>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="Add Technology"
                  className="w-full rounded-md border p-2"
                />
                <button type="button" onClick={handleAddTech} className="mt-2 px-4 py-2 bg-gray-300 rounded-md">
                  Add Tech
                </button>
                <div className="flex flex-wrap mt-2">
                  {formState.tech.map((tech, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-200 rounded-md m-1">
                      {tech}
                      <button onClick={() => handleRemoveTech(index)} className="ml-2 text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white p-2 rounded-md">
                {formLoading ? 'Saving...' : 'Add Project'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Project List */}
        <div className="space-y-12">
          {loading ? (
            <p>Loading...</p>
          ) : (
            projects.map((project) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-xl font-bold">{project.Name}</h3>
                <p>{project.description}</p>
                <a href={project.githubUrl} target="_blank" className="text-blue-500 hover:underline">
                  View on GitHub
                </a>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Projects;
