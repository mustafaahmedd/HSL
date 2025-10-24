import React, { useState } from 'react';
import { FileUpload } from '@/components/ui';
import { useUpload } from '@/hooks/useUpload';

// Example component showing how to use the new upload functionality
export default function UploadExample() {
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

    const { uploadFiles, isUploading, error } = useUpload({
        category: 'events',
        onSuccess: (files) => {
            setUploadedFiles(prev => [...prev, ...files]);
            console.log('Files uploaded successfully:', files);
        },
        onError: (error) => {
            console.error('Upload error:', error);
        }
    });

    const handleFilesUploaded = (files: any[]) => {
        setUploadedFiles(prev => [...prev, ...files]);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">File Upload Example</h2>

            {/* Using the FileUpload component */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Method 1: Using FileUpload Component</h3>
                <FileUpload
                    category="events"
                    multiple={true}
                    onFilesUploaded={handleFilesUploaded}
                    onError={(error) => console.error('Upload error:', error)}
                />
            </div>

            {/* Using the useUpload hook directly */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Method 2: Using useUpload Hook</h3>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                            uploadFiles(files);
                        }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {isUploading && <p className="mt-2 text-blue-600">Uploading...</p>}
                {error && <p className="mt-2 text-red-600">{error}</p>}
            </div>

            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <img
                                    src={file.url}
                                    alt={file.originalName}
                                    className="w-full h-32 object-cover rounded mb-2"
                                />
                                <p className="text-sm font-medium">{file.originalName}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)}KB
                                </p>
                                <p className="text-xs text-blue-600">{file.url}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
