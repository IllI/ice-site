import { File } from '@web-std/file';

interface MegaCredentials {
  email: string;
  password: string;
}

export async function uploadToMega(file: File, credentials: MegaCredentials) {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // First, get the upload URL from your backend
    const response = await fetch('/api/mega/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        base64Data: base64,
        credentials
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload file');
    }

    if (!data.fileUrl) {
      throw new Error('No file URL returned from upload');
    }

    return data.fileUrl;
  } catch (error) {
    console.error('Error uploading to Mega:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
} 