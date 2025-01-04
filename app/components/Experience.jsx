'use client';
import { useState, useEffect, useReducer } from "react";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { useUser } from '@clerk/nextjs';

// 🔄 Animation Variants
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

// 🔄 Initial State for New Experience
const initialState = {
  role: '',
  company: '',
  description: '',
  description2: '',
  year: '',
  technologies: [],
};

// 🔑 Reducer for Form Management
const experienceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'ADD_TECH':
      return { ...state, technologies: [...state.technologies, action.value] };
    case 'REMOVE_TECH':
      return {
        ...state,
        technologies: state.technologies.filter((_, index) => index !== action.index),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newTechnology, setNewTechnology] = useState('');
  const [formState, dispatch] = useReducer(experienceReducer, initialState);
  const { user } = useUser();

  // 🔄 Fetch Experiences
  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      try {
        const experienceQuery = query(
          collection(db, "Experiences"),
          orderBy("year", "desc"),
          limit(3)
        );
        const querySnapshot = await getDocs(experienceQuery);
        const experiencesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExperiences(experiencesList);
      } catch (error) {
        console.error("Error fetching experiences:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  // 📝 Add New Experience
  const handleAddExperience = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!formState.year || !formState.role || !formState.company || !formState.description) {
      setFormError("All required fields must be filled!");
      setFormLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "Experiences"), {
        ...formState,
        year: String(formState.year),
        createdAt: serverTimestamp(),
      });

      dispatch({ type: 'RESET' });
      setFormVisible(false);
      alert("Experience added successfully!");

      // Refresh Experiences
      const experienceQuery = query(
        collection(db, "Experiences"),
        orderBy("year", "desc"),
        limit(3)
      );
      const querySnapshot = await getDocs(experienceQuery);
      const experiencesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExperiences(experiencesList);
    } catch (error) {
      console.error("Error adding experience:", error.message);
      setFormError("Failed to add experience. Try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // 🔧 Handle Technology Input
  const handleAddTechnology = () => {
    if (newTechnology.trim()) {
      dispatch({ type: 'ADD_TECH', value: newTechnology.trim() });
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (index) => {
    dispatch({ type: 'REMOVE_TECH', index });
  };

  return (
    <section id="Experience" className="relative bg-white text-black overflow-hidden py-8 lg:py-16 border-t border-neutral-200">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Title and Add Button */}
        <div className="flex justify-between items-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-6xl font-thin tracking-tight"
          >
            Experience
          </motion.h1>
          {user && (
            <button
              onClick={() => setFormVisible(!formVisible)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {formVisible ? 'Cancel' : 'Add Experience'}
            </button>
          )}
        </div>

        {/* Add Experience Form */}
        {formVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-12 p-6 border rounded-md shadow-md"
          >
            <form onSubmit={handleAddExperience} className="space-y-4">
              {['role', 'company', 'description', 'description2', 'year'].map((field) => (
                <input
                  key={field}
                  type="text"
                  value={formState[field]}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field, value: e.target.value })}
                  className="w-full rounded-md border p-2"
                  required={field !== 'description2'}
                />
              ))}
              <div>
                <input
                  type="text"
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  placeholder="Add Technology"
                  className="w-full rounded-md border p-2"
                />
                <button type="button" onClick={handleAddTechnology} className="mt-2 px-4 py-2 bg-gray-300 rounded-md">
                  Add Tech
                </button>
                <div className="flex flex-wrap mt-2">
                  {formState.technologies.map((tech, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-200 rounded-md m-1">
                      {tech}
                      <button onClick={() => handleRemoveTechnology(index)} className="ml-2 text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white p-2 rounded-md">
                {formLoading ? 'Saving...' : 'Add Experience'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Experience List */}
        <div className="space-y-12">
          {loading ? (
            <p>Loading...</p>
          ) : (
            experiences.map((experience) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row items-start gap-6"
              >
                <div className="w-full lg:w-1/4 text-neutral-500 text-sm font-medium">
                  <p>{experience.year}</p>
                </div>
                <div className="w-full lg:w-3/4 space-y-2">
                  <h6 className="text-xl font-semibold">
                    {experience.role} - {experience.company}
                  </h6>
                  <p>{experience.description}</p>
                  <p>{experience.description2}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Experience;
