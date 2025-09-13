import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, User, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange: (avatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarUpload({
  currentAvatar,
  userName,
  onAvatarChange,
  size = 'md',
  className = ''
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // In a real implementation, you would upload to Firebase Storage
      // For now, we'll use the object URL
      onAvatarChange(url);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    toast.info('Avatar removed');
  };

  const avatarUrl = previewUrl || currentAvatar;
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1e40af&color=fff&size=128`;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden group`}>
          <img
            src={avatarUrl || fallbackUrl}
            alt={userName}
            className="w-full h-full object-cover bg-dark-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackUrl;
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          
          {/* Remove Button */}
          {avatarUrl && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-error-500 text-white shadow-lg"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex items-center space-x-3">
          <label className="btn-secondary cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          
          {avatarUrl && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveAvatar}
              className="btn-secondary text-error-400 hover:text-error-300"
            >
              Remove
            </motion.button>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Recommended: Square image, max 5MB
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Supports JPG, PNG, GIF formats
          </p>
        </div>
      </div>
    </div>
  );
}