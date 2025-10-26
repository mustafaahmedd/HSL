# File Upload System

This Next.js application includes a comprehensive file upload system that uses **Cloudinary** for cloud-based image storage. This is the recommended approach for production deployments, especially on platforms like Vercel.

## Features

- **Cloud Storage**: Files are stored in Cloudinary cloud storage
- **File Validation**: Automatic validation of file types and sizes
- **Multiple Categories**: Organized uploads by category (events, players, registrations, auctions)
- **React Hooks**: Easy-to-use hooks for file uploads
- **Reusable Components**: Pre-built upload components
- **Error Handling**: Comprehensive error handling and validation
- **CDN Delivery**: Fast image delivery via Cloudinary's global CDN

## Setup

Before using the upload system, you need to:

1. Create a Cloudinary account at [https://cloudinary.com](https://cloudinary.com)
2. Get your credentials from the Cloudinary dashboard
3. Add environment variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

For detailed setup instructions, see [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md).
For folder structure and organization details, see [CLOUDINARY_FOLDER_SETUP.md](CLOUDINARY_FOLDER_SETUP.md).

## API Endpoints

### Upload Files
- **POST** `/api/upload` - Upload files to Cloudinary
- **GET** `/api/upload` - Get upload configuration

### Updated API Routes
- **POST** `/api/events` - Now handles image uploads via Cloudinary
- **POST** `/api/register` - Now handles photo uploads via Cloudinary

## Usage Examples

### 1. Using the FileUpload Component

```tsx
import { FileUpload } from '@/components/ui';

function MyComponent() {
  const handleFilesUploaded = (files) => {
    console.log('Uploaded files:', files);
  };

  return (
    <FileUpload
      category="events"
      multiple={true}
      onFilesUploaded={handleFilesUploaded}
      onError={(error) => console.error(error)}
    />
  );
}
```

### 2. Using the useUpload Hook

```tsx
import { useUpload } from '@/hooks/useUpload';

function MyComponent() {
  const { uploadFiles, isUploading, error } = useUpload({
    category: 'events',
    onSuccess: (files) => console.log('Success:', files),
    onError: (error) => console.error('Error:', error)
  });

  const handleFileSelect = (files) => {
    uploadFiles(files);
  };

  return (
    <input
      type="file"
      multiple
      onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
    />
  );
}
```

### 3. Direct API Usage

```tsx
const uploadFiles = async (files) => {
  const formData = new FormData();
  formData.append('category', 'events');
  
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();
  return result.files;
};
```

## Configuration

### File Validation
- **Max File Size**: 5MB (configurable)
- **Allowed Types**: jpg, jpeg, png, gif, svg, webp
- **Categories**: events, players, registrations, auctions, general

### Upload Configuration
```typescript
interface UploadConfig {
  maxFileSize?: number;     // Default: 5MB
  allowedTypes?: string[];  // Default: image types
  category?: string;        // Default: 'general'
}
```

## File Storage and URLs

### Cloudinary Storage
Files are stored in Cloudinary with the following structure:
- Folder-based organization by category
- Automatic unique naming: `{category}_{timestamp}`
- Secure HTTPS URLs for all images

### Example Cloudinary URLs
```
https://res.cloudinary.com/your_cloud_name/image/upload/events/events_1703123456789.jpg
https://res.cloudinary.com/your_cloud_name/image/upload/players/players_1703123456789.jpg
```

### File Naming Convention
Files are automatically renamed using the pattern:
```
{category}_{timestamp}
```

Example: `events_1703123456789.jpg` stored in the `events` folder

## Benefits of Cloudinary

### ✅ **Global CDN**
- Images delivered via Cloudinary's CDN
- Fast loading times worldwide
- Reduced server load

### ✅ **Automatic Optimization**
- Automatic format optimization (WebP, AVIF)
- Responsive image generation
- Quality optimization

### ✅ **Serverless Compatible**
- No local file storage needed
- Perfect for Vercel, Netlify, and similar platforms
- No disk space limitations

### ✅ **Free Tier**
- 25GB storage
- 25GB monthly bandwidth
- Unlimited transformations

## Migration from Local Storage

If you previously used local file storage:

### Before (Local Storage):
```typescript
// Files stored locally
url: `/uploads/events/events_1703123456789.jpg`
```

### After (Cloudinary):
```typescript
// Files stored in Cloudinary
url: `https://res.cloudinary.com/your_cloud_name/image/upload/events/events_1703123456789.jpg`
```

### Migration Steps:
1. Upload existing images to Cloudinary
2. Update database URLs from local paths to Cloudinary URLs
3. Test image access in production

## Security Considerations

- Files are validated before upload
- Authentication is required for uploads
- File types are restricted to images
- File sizes are limited
- Cloudinary uses secure HTTPS URLs

## Troubleshooting

### Common Issues

1. **Upload fails**: Check Cloudinary credentials in environment variables
2. **Authentication error**: Ensure admin token is present
3. **Missing environment variables**: Verify all Cloudinary credentials are set
4. **File not found**: Check Cloudinary Media Library for uploaded files

### Debug Mode

Enable debug logging by checking the browser console and server logs for detailed error messages.

## Support

For more information about Cloudinary:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Setup Instructions](CLOUDINARY_SETUP.md)
- [Cloudinary Console](https://console.cloudinary.com/)
