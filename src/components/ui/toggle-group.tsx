import React, { createContext, useContext, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

type ToggleGroupContextValue = {
  value: string | string[];
  onChange: (value: string) => void;
  type: 'single' | 'multiple';
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | undefined>(undefined);

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
}

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ 
    type = 'single', 
    value, 
    defaultValue, 
    onValueChange, 
    disabled = false, 
    variant = 'default', 
    size = 'default',
    className, 
    children, 
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState<string | string[]>(
      value || defaultValue || (type === 'single' ? '' : [])
    );

    const actualValue = value !== undefined ? value : internalValue;

    const handleValueChange = (itemValue: string) => {
      if (disabled) return;

      let newValue: string | string[];
      if (type === 'single') {
        newValue = itemValue;
      } else {
        const values = actualValue as string[];
        if (values.includes(itemValue)) {
          newValue = values.filter(v => v !== itemValue);
        } else {
          newValue = [...values, itemValue];
        }
      }

      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    const contextValue = {
      value: actualValue,
      onChange: handleValueChange,
      type
    };

    return (
      <ToggleGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'inline-flex rounded overflow-hidden',
            variant === 'default' ? 'border' : 'bg-transparent',
            size === 'default' ? '' : size === 'sm' ? 'text-sm' : 'text-lg',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = 'ToggleGroup';

export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, disabled = false, className, children, ...props }, ref) => {
    const context = useContext(ToggleGroupContext);

    if (!context) {
      throw new Error('ToggleGroupItem must be used within a ToggleGroup');
    }

    const { value: groupValue, onChange, type } = context;
    const isSelected = type === 'single' 
      ? groupValue === value 
      : (groupValue as string[]).includes(value);

    return (
      <button
        ref={ref}
        type="button"
        role="button"
        aria-pressed={isSelected}
        disabled={disabled}
        onClick={() => onChange(value)}
        className={cn(
          'px-3 py-2 border-r last:border-r-0 focus:outline-none transition-colors',
          isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = 'ToggleGroupItem';