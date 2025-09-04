import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange: (avatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export default function AvatarUpload({
  currentAvatar,
  userName,
  onAvatarChange,
  size = 'md',
  editable = true
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // In a real app, you would upload to a storage service here
      // For now, we'll simulate an upload and use the data URL
      setTimeout(() => {
        onAvatarChange(result);
        setIsUploading(false);
        toast.success('Avatar updated successfully');
      }, 1000);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Avatar removed');
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Avatar Display */}
        <motion.div
          whileHover={editable ? { scale: 1.05 } : {}}
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-primary-500/20 bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center relative group`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${userName}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-dark-700 text-gray-300">
              {userName ? (
                <span className={`font-bold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}`}>
                  {getInitials(userName)}
                </span>
              ) : (
                <User className={iconSizes[size]} />
              )}
            </div>
          )}

          {/* Upload Overlay */}
          {editable && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
              onClick={triggerFileSelect}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Remove Button */}
        {editable && previewUrl && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemoveAvatar}
            className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center text-white hover:bg-error-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Upload Controls */}
      {editable && (
        <div className="flex flex-col items-center space-y-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Upload className="w-4 h-4" />
            {previewUrl ? 'Change Avatar' : 'Upload Avatar'}
          </motion.button>
          
          <p className="text-xs text-gray-500 text-center">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}