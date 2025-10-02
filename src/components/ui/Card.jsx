// ============================================
// FILE: src/components/ui/Card.jsx
// ============================================
import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);