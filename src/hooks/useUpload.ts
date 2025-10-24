import { useState, useCallback } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface UseUploadOptions {
  category?: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setError('No files selected');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add category if provided
      if (options.category) {
        formData.append('category', options.category);
      }

      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Get auth token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedFiles(result.files);
      options.onSuccess?.(result.files);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const uploadSingleFile = useCallback(async (file: File) => {
    return uploadFiles([file]);
  }, [uploadFiles]);

  const reset = useCallback(() => {
    setUploadedFiles([]);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    uploadFiles,
    uploadSingleFile,
    isUploading,
    uploadedFiles,
    error,
    reset
  };
}

// Utility function to validate files before upload
export function validateFiles(files: File[], maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/webp'];
  
  for (const file of files) {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File ${file.name} exceeds ${maxSize / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File ${file.name} is not a supported image type`
      };
    }
  }

  return { valid: true };
}
