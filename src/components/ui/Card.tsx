import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  id,
}) => {
  return (
    <div id={id} className={`bg-white rounded-lg shadow-md ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
