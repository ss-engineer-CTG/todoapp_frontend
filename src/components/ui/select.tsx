import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options = [], children, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <select
          id={id}
          ref={ref}
          className={cn(
            "w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 bg-white",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          {options.length > 0
            ? options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            : children}
        </select>
        
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };

export interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string;
  children: React.ReactNode;
}

const SelectOption = forwardRef<HTMLOptionElement, SelectOptionProps>(
  ({ className, ...props }, ref) => {
    return <option ref={ref} className={className} {...props} />;
  }
);

SelectOption.displayName = 'SelectOption';

export { SelectOption };

export interface SelectGroupProps extends React.OptgroupHTMLAttributes<HTMLOptGroupElement> {
  label: string;
  children: React.ReactNode;
}

const SelectGroup = forwardRef<HTMLOptGroupElement, SelectGroupProps>(
  ({ className, ...props }, ref) => {
    return <optgroup ref={ref} className={className} {...props} />;
  }
);

SelectGroup.displayName = 'SelectGroup';

export { SelectGroup };