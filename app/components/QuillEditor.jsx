'use client';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const QuillEditor = ({ value, onChange }) => {
    return (
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            placeholder="Start writing your blog..."
            className="text-2xl font-light focus:outline-none border-none"
        />
    );
};

export default QuillEditor;
