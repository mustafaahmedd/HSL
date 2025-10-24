import React, { useState, useRef } from 'react';
import { useUpload, validateFiles } from '@/hooks/useUpload';

interface FileUploadProps {
    category?: string;
    multiple?: boolean;
    accept?: string;
    maxSize?: number;
    onFilesUploaded?: (files: any[]) => void;
    onError?: (error: string) => void;
    className?: string;
    disabled?: boolean;
}

export default function FileUpload({
    category = 'general',
    multiple = false,
    accept = 'image/*',
    maxSize = 5 * 1024 * 1024, // 5MB
    onFilesUploaded,
    onError,
    className = '',
    disabled = false
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadFiles, isUploading, error, reset } = useUpload({
        category,
        onSuccess: (files) => {
            setPreviewFiles([]);
            onFilesUploaded?.(files);
        },
        onError: (error) => {
            onError?.(error);
        }
    });

    const handleFiles = (files: FileList | File[]) => {
        const fileArray = Array.from(files);

        // Validate files
        const validation = validateFiles(fileArray, maxSize);
        if (!validation.valid) {
            onError?.(validation.error!);
            return;
        }

        setPreviewFiles(fileArray);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleUpload = () => {
        if (previewFiles.length > 0) {
            uploadFiles(previewFiles);
        }
    };

    const handleRemoveFile = (index: number) => {
        setPreviewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleReset = () => {
        setPreviewFiles([]);
        reset();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`file-upload ${className}`}>
            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <div className="space-y-2">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                            Click to upload
                        </span>
                        {' '}or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                        Images up to {maxSize / (1024 * 1024)}MB
                    </p>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
                disabled={disabled}
            />

            {/* Preview Files */}
            {previewFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    {previewFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {previewFiles.length > 0 && (
                <div className="mt-4 flex space-x-2">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || disabled}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isUploading || disabled}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Reset
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
}
