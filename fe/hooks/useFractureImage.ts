import { useState, useCallback } from 'react';
import { uploadFractureImage } from '@/lib/fracture-api';

interface UseFractureImageReturn {
  image: HTMLImageElement | null;
  imageFile: File | null;
  isUploading: boolean;
  error: string | null;
  uploadImage: (file: File, token: string) => Promise<any>;
  clearImage: () => void;
  setError: (error: string | null) => void;
}

export function useFractureImage(): UseFractureImageReturn {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File, token: string) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPEG, PNG, BMP, or TIFF)');
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 20MB');
    }

    setIsUploading(true);
    setError(null);

    try {
      const prediction = await uploadFractureImage(file, token);
      setImageFile(file);

      // Load image for display
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setImage(img);
            resolve(prediction);
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setImageFile(null);
    setError(null);
  }, []);

  return {
    image,
    imageFile,
    isUploading,
    error,
    uploadImage,
    clearImage,
    setError
  };
}