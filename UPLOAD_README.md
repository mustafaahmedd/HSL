# File Upload System

This Next.js application includes a comprehensive file upload system that handles local storage similar to your Node.js multer middleware.

## Features

- **Local File Storage**: Files are stored in the `public/uploads/` directory
- **File Validation**: Automatic validation of file types and sizes
- **Multiple Categories**: Organized uploads by category (events, players, registrations, auctions)
- **React Hooks**: Easy-to-use hooks for file uploads
- **Reusable Components**: Pre-built upload components
- **Error Handling**: Comprehensive error handling and validation

## Directory Structure

```
public/
  uploads/
    events/          # Event images
    players/         # Player photos
    registrations/   # Registration photos
    auctions/        # Auction-related images
    general/         # General uploads
```

## API Endpoints

### Upload Files
- **POST** `/api/upload`
- **GET** `/api/upload` - Get upload configuration

### Updated API Routes
- **POST** `/api/events` - Now handles image uploads
- **POST** `/api/register` - Now handles photo uploads

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

## File Naming Convention

Files are automatically renamed using the pattern:
```
{category}_{timestamp}{extension}
```

Example: `events_1703123456789.jpg`

## Error Handling

The system provides comprehensive error handling:

- **File Size Validation**: Files exceeding the size limit
- **File Type Validation**: Unsupported file types
- **Authentication**: Required for uploads
- **Storage Errors**: Disk space or permission issues

## Migration from Previous System

The new system is backward compatible. Existing code that stores file names will continue to work, but now files are actually saved to disk.

### Before (storing only filenames):
```typescript
const fileName = `event-${Date.now()}-${file.name}`;
images.push({
  url: `/uploads/events/${fileName}`,
  caption: `Event image ${i + 1}`,
  isPrimary: i === 0
});
```

### After (actual file upload):
```typescript
const uploadedFiles = await saveFiles(imageFiles, 'events');
uploadedFiles.forEach((file, index) => {
  images.push({
    url: file.url,
    caption: `Event image ${index + 1}`,
    isPrimary: index === 0
  });
});
```

## Security Considerations

- Files are validated before upload
- Authentication is required for uploads
- File types are restricted to images
- File sizes are limited
- Files are stored outside the application root

## Troubleshooting

### Common Issues

1. **Upload fails**: Check file size and type
2. **Authentication error**: Ensure admin token is present
3. **Directory permissions**: Ensure write permissions on `public/uploads/`
4. **File not found**: Check if file was actually saved to disk

### Debug Mode

Enable debug logging by checking the browser console and server logs for detailed error messages.
