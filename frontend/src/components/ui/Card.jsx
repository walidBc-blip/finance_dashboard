import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title = null, 
  subtitle = null,
  padding = 'p-6',
  shadow = 'shadow-sm',
  hover = false,
  border = true
}) => {
  const baseClasses = `
    bg-white rounded-lg 
    ${border ? 'border border-gray-200' : ''}
    ${shadow}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${padding}
  `;

  return (
    <div className={`${baseClasses} ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;