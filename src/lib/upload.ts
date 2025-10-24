import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

export interface UploadConfig {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  category?: string;
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

// Default configuration
const DEFAULT_CONFIG: Required<UploadConfig> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/webp'],
  category: 'general'
};

// File filter function
export function validateFile(file: File, config: UploadConfig = {}): { valid: boolean; error?: string } {
  const { maxFileSize = DEFAULT_CONFIG.maxFileSize, allowedTypes = DEFAULT_CONFIG.allowedTypes } = config;

  // Check file size
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only image files are allowed (jpg, jpeg, png, gif, svg, webp)'
    };
  }

  return { valid: true };
}

// Generate unique filename
export function generateFilename(originalName: string, category: string): string {
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  return `${category}_${timestamp}${extension}`;
}

// Ensure directory exists
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Save file to disk
export async function saveFile(
  file: File, 
  category: string = 'general',
  config: UploadConfig = {}
): Promise<UploadedFile> {
  const { maxFileSize = DEFAULT_CONFIG.maxFileSize } = config;
  
  // Validate file
  const validation = validateFile(file, { maxFileSize, allowedTypes: config.allowedTypes });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate filename and path
  const filename = generateFilename(file.name, category);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
  const filePath = path.join(uploadDir, filename);

  // Ensure directory exists
  ensureDirectoryExists(uploadDir);

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  fs.writeFileSync(filePath, buffer);

  return {
    originalName: file.name,
    filename,
    path: filePath,
    url: `/uploads/${category}/${filename}`,
    size: file.size,
    mimetype: file.type
  };
}

// Handle multiple file uploads
export async function saveFiles(
  files: File[],
  category: string = 'general',
  config: UploadConfig = {}
): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];
  
  for (const file of files) {
    if (file.size > 0) {
      try {
        const result = await saveFile(file, category, config);
        results.push(result);
      } catch (error) {
        console.error(`Failed to save file ${file.name}:`, error);
        throw error;
      }
    }
  }
  
  return results;
}

// Extract files from FormData
export function extractFiles(formData: FormData, fieldName: string): File[] {
  const files: File[] = [];
  
  // Handle single file
  const singleFile = formData.get(fieldName) as File;
  if (singleFile && singleFile.size > 0) {
    files.push(singleFile);
  }
  
  // Handle multiple files
  const multipleFiles = formData.getAll(fieldName) as File[];
  for (const file of multipleFiles) {
    if (file && file.size > 0 && !files.some(f => f.name === file.name && f.size === file.size)) {
      files.push(file);
    }
  }
  
  return files;
}

// Delete file from disk
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Delete file by URL
export function deleteFileByUrl(url: string): boolean {
  try {
    const filePath = path.join(process.cwd(), 'public', url);
    return deleteFile(filePath);
  } catch (error) {
    console.error('Failed to delete file by URL:', error);
    return false;
  }
}
