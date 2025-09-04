export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

export function validateNumber(value: string | number, fieldName: string, min?: number, max?: number): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`;
  if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`;
  
  return null;
}

export function validateSKU(sku: string): string | null {
  if (!sku) return null; // SKU is optional
  if (!/^[A-Z0-9-_]+$/i.test(sku)) return 'SKU can only contain letters, numbers, hyphens, and underscores';
  if (sku.length > 50) return 'SKU must be 50 characters or less';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) return 'Please enter a valid phone number';
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be 20 characters or less';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, hyphens, and underscores';
  return null;
}

export function validateAge(dateOfBirth: string): string | null {
  if (!dateOfBirth) return 'Date of birth is required';
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 13) return 'You must be at least 13 years old to register';
  if (age > 120) return 'Please enter a valid date of birth';
  
  return null;
}