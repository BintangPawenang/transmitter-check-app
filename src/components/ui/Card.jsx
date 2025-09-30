// ============================================
// FILE: src/components/ui/Card.jsx
// ============================================
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);