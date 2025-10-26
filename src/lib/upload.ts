import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadConfig {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  category?: string;
  baseFolder?: string;
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Default configuration
const DEFAULT_CONFIG: Required<UploadConfig> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/webp'],
  category: 'general',
  baseFolder: process.env.CLOUDINARY_BASE_FOLDER || 'hikmah-auction'
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
  const extension = originalName.split('.').pop();
  return `${category}_${timestamp}.${extension}`;
}

// Upload file to Cloudinary
export async function uploadToCloudinary(
  file: File,
  category: string = 'general',
  config: UploadConfig = {}
): Promise<UploadedFile> {
  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Convert buffer to base64
  const base64String = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64String}`;

  // Generate filename
  const filename = generateFilename(file.name, category);

  // Build folder path: {baseFolder}/{category}
  const baseFolder = config.baseFolder || DEFAULT_CONFIG.baseFolder;
  const folderPath = `${baseFolder}/${category}`;

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: folderPath,
        public_id: filename,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }

        resolve({
          originalName: file.name,
          filename: result.public_id,
          path: result.public_id,
          url: result.secure_url,
          size: file.size,
          mimetype: file.type
        });
      }
    );
  });
}

// Save file to Cloudinary
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

  // Upload to Cloudinary with config
  return await uploadToCloudinary(file, category, config);
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

// Delete file from Cloudinary
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // Extract public_id from path or URL
    let publicId = filePath;
    
    // If it's a URL, extract the public_id
    if (filePath.includes('cloudinary.com')) {
      const urlParts = filePath.split('/');
      const filename = urlParts[urlParts.length - 1];
      publicId = filename.split('.')[0];
    }

    return new Promise((resolve) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error || !result) {
          console.error('Failed to delete file from Cloudinary:', error);
          resolve(false);
          return;
        }
        resolve(result.result === 'ok');
      });
    });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Delete file by URL (Cloudinary URL)
export async function deleteFileByUrl(url: string): Promise<boolean> {
  try {
    // Extract public_id from Cloudinary URL
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // If there's a folder in the URL, include it in the public_id
    const uploadIndex = parts.indexOf('upload');
    let publicIdWithFolder = publicId;
    
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
      const folder = parts[uploadIndex + 1];
      publicIdWithFolder = `${folder}/${publicId}`;
    }

    return new Promise((resolve) => {
      cloudinary.uploader.destroy(publicIdWithFolder, (error, result) => {
        if (error || !result) {
          console.error('Failed to delete file from Cloudinary:', error);
          resolve(false);
          return;
        }
        resolve(result.result === 'ok');
      });
    });
  } catch (error) {
    console.error('Failed to delete file by URL:', error);
    return false;
  }
}
