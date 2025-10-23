import React from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
                {...props}
                onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (props.onChange) {
                        const syntheticEvent = {
                            ...e,
                            target: {
                                ...e.target,
                                value: value
                            }
                        };
                        props.onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
                    }
                }}
            />
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
