import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[#e8732c] hover:bg-[#f5882e] text-white shadow-lg shadow-[#e8732c]/10 gold-glow',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-[#e8732c]/50',
    danger: 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20',
    ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
