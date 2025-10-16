import React, { useState, useRef, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { Search, Plus, AlertTriangle, CheckCircle, Clock, Camera, X, Home, List, Settings, Bell, ArrowLeft, Edit2, Trash2, WifiOff, Wifi } from 'lucide-react';
import { z } from 'zod';

// ============================================
// DESIGN TOKENS (small improvements)
// ============================================
const designTokens = {
  colors: {
    primary: { main: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
    success: { main: '#16a34a', light: '#dcfce7', dark: '#15803d' },
    warning: { main: '#ca8a04', light: '#fef9c3', dark: '#a16207' },
    danger: { main: '#dc2626', light: '#fee2e2', dark: '#b91c1c' },
    gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 600: '#4b5563', 900: '#111827' }
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
  fontSize: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px' }
};

if (typeof document !== 'undefined') {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', designTokens.colors.primary.main);
  root.style.setProperty('--color-success', designTokens.colors.success.main);
  root.style.setProperty('--spacing-md', designTokens.spacing.md);
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================
const transmitterSchema = z.object({
  id: z.string().min(1, 'ID is required').regex(/^[A-Z]{2}-\d{3}$/, 'Format: XX-000'),
  name: z.string().min(5, 'Name must be at least 5 characters'),
  type: z.enum(['Pressure', 'Flow', 'Level', 'Temperature']),
  location: z.string().min(5, 'Location is required'),
  status: z.enum(['active', 'warning', 'critical']),
  range: z.string().min(3, 'Range is required'),
  accuracy: z.string().min(2, 'Accuracy is required'),
  lastCalibration: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  nextCalibrationDue: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
});

const inspectionSchema = z.object({
  deviceId: z.string(),
  inspector: z.string().min(3, 'Inspector name required'),
  checklist: z.record(z.any()),
  photos: z.array(z.any()),
  signature: z.string().min(10, 'Signature required'),
});

// ============================================
// DATA CONTEXT (CRUD) - optimized
// ============================================
const DataContext = createContext();

const safeParseJSON = (str, fallback) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

const defaultTransmitters = [
  {
    id: 'PT-001',
    name: 'Pressure Transmitter 001',
    type: 'Pressure',
    location: 'Unit A - Reactor',
    status: 'active',
    lastCalibration: '2024-01-15',
    nextCalibrationDue: '2025-01-15',
    healthIndicator: 'good',
    range: '0-100 bar',
    accuracy: '±0.1%'
  },
  {
    id: 'FT-002',
    name: 'Flow Transmitter 002',
    type: 'Flow',
    location: 'Unit B - Pipeline',
    status: 'warning',
    lastCalibration: '2023-08-20',
    nextCalibrationDue: '2024-08-20',
    healthIndicator: 'fair',
    range: '0-500 L/min',
    accuracy: '±0.2%'
  },
  {
    id: 'LT-003',
    name: 'Level Transmitter 003',
    type: 'Level',
    location: 'Tank C - Storage',
    status: 'critical',
    lastCalibration: '2023-06-10',
    nextCalibrationDue: '2024-06-10',
    healthIndicator: 'poor',
    range: '0-10 m',
    accuracy: '±0.15%'
  }
];

const DataProvider = ({ children }) => {
  const [transmitters, setTransmitters] = useState(() => {
    if (typeof localStorage === 'undefined') return defaultTransmitters;
    const saved = localStorage.getItem('transmitters');
    return saved ? safeParseJSON(saved, defaultTransmitters) : defaultTransmitters;
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSync, setPendingSync] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSync) {
        // pretend to sync
        setTimeout(() => setPendingSync(false), 1200);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync]);

  useEffect(() => {
    // debounce localStorage writes to avoid frequent syncs
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('transmitters', JSON.stringify(transmitters));
      } catch (e) {
        console.warn('Failed to save transmitters to localStorage', e);
      }
    }, 300);

    if (!isOnline) setPendingSync(true);

    return () => clearTimeout(saveTimer.current);
  }, [transmitters, isOnline]);

  const createTransmitter = useCallback((data) => {
    try {
      transmitterSchema.parse(data);
      setTransmitters(prev => [...prev, data]);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error.flatten().fieldErrors };
      }
      return { success: false, errors: { general: 'Unknown error' } };
    }
  }, []);

  const updateTransmitter = useCallback((id, data) => {
    try {
      transmitterSchema.parse(data);
      setTransmitters(prev => prev.map(t => (t.id === id ? data : t)));
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error.flatten().fieldErrors };
      }
      return { success: false, errors: { general: 'Unknown error' } };
    }
  }, []);

  const deleteTransmitter = useCallback((id) => {
    setTransmitters(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{
      transmitters,
      isOnline,
      pendingSync,
      createTransmitter,
      updateTransmitter,
      deleteTransmitter
    }}>
      {children}
    </DataContext.Provider>
  );
};
const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

// ============================================
// UI Primitives - memoized for performance
// ============================================
const Button = React.memo(({ variant = 'primary', size = 'md', children, className = '', icon: Icon, ariaLabel, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <Icon className={children ? 'mr-2' : ''} size={18} />}
      {children}
    </button>
  );
});

const Input = React.memo(({ label, error, required, id, ...props }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
    )}
    <input
      id={id}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
    {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
  </div>
));

const Select = React.memo(({ label, error, required, id, options = [], ...props }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
    )}
    <select
      id={id}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
  </div>
));

const Card = React.memo(({ children, className = '', onClick, ariaLabel }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    aria-label={ariaLabel}
  >
    {children}
  </div>
));

const Badge = React.memo(({ variant = 'default', children }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
});

const Modal = React.memo(({ isOpen, onClose, title, children, size = 'sm' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white rounded-2xl w-full ${sizes[size]} shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
});

// ============================================
// Offline banner
// ============================================
const OfflineBanner = React.memo(() => {
  const { isOnline, pendingSync } = useData();
  if (isOnline && !pendingSync) return null;
  return (
    <div className={`${isOnline ? 'bg-green-500' : 'bg-yellow-500'} text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2`} role="alert">
      {isOnline ? (
        <><Wifi size={16} />Syncing data...</>
      ) : (
        <><WifiOff size={16} />You are offline. Changes will sync when reconnected.</>
      )}
    </div>
  );
});

// ============================================
// SignaturePad - improved for DPR and cleanup
// ============================================
const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    if (onSave) onSave(dataURL);
  };

  return (
    <div className="border rounded-lg p-3">
      <div style={{ height: 150 }}>
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded cursor-crosshair w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Signature pad - draw your signature"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" onClick={clearCanvas} size="sm" className="flex-1">Clear</Button>
        <Button onClick={saveSignature} size="sm" className="flex-1">Save</Button>
      </div>
    </div>
  );
};

// ============================================
// Create/Edit Modal - minor UX improvements
// ============================================
const CreateEditTransmitterModal = ({ isOpen, onClose, device = null }) => {
  const { createTransmitter, updateTransmitter } = useData();

  const initialFormData = useMemo(() => ({
    id: '',
    name: '',
    type: '',
    location: '',
    status: 'active',
    range: '',
    accuracy: '',
    lastCalibration: '',
    nextCalibrationDue: '',
  }), []);

  const [formData, setFormData] = useState(device || initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(device || initialFormData);
      setErrors({});
    }
  }, [isOpen, device, initialFormData]);

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = device ? updateTransmitter(device.id, formData) : createTransmitter(formData);
    if (result.success) {
      handleClose();
    } else {
      setErrors(result.errors || {});
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={device ? 'Edit Device' : 'Create Device'} size="md">
      <form onSubmit={handleSubmit}>
        <Input
          id="device-id"
          label="Device ID"
          value={formData.id}
          onChange={(e) => setFormData(prev => ({...prev, id: e.target.value.toUpperCase()}))}
          error={errors.id?.[0]}
          placeholder="Format: XX-000"
          required
        />
        <Input
          id="device-name"
          label="Device Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
          error={errors.name?.[0]}
          required
        />
        <Select
          id="device-type"
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
          options={[{ value: 'Pressure', label: 'Pressure' },{ value: 'Flow', label: 'Flow' },{ value: 'Level', label: 'Level' },{ value: 'Temperature', label: 'Temperature' }]}
          error={errors.type?.[0]}
          required
        />
        <Input id="device-location" label="Location" value={formData.location} onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))} error={errors.location?.[0]} required />
        <Select id="device-status" label="Status" value={formData.status} onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))} options={[{ value: 'active', label: 'Active' },{ value: 'warning', label: 'Warning' },{ value: 'critical', label: 'Critical' }]} error={errors.status?.[0]} required />
        <Input id="device-range" label="Range" value={formData.range} onChange={(e) => setFormData(prev => ({...prev, range: e.target.value}))} error={errors.range?.[0]} required />
        <Input id="device-accuracy" label="Accuracy" value={formData.accuracy} onChange={(e) => setFormData(prev => ({...prev, accuracy: e.target.value}))} error={errors.accuracy?.[0]} placeholder="±0.1%" required />
        <Input id="last-cal" label="Last Calibration" type="date" value={formData.lastCalibration} onChange={(e) => setFormData(prev => ({...prev, lastCalibration: e.target.value}))} error={errors.lastCalibration?.[0]} required />
        <Input id="next-cal" label="Next Calibration Due" type="date" value={formData.nextCalibrationDue} onChange={(e) => setFormData(prev => ({...prev, nextCalibrationDue: e.target.value}))} error={errors.nextCalibrationDue?.[0]} required />
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1">{device ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, device, onConfirm }) => {
  if (!device) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Device">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600" size={32} />
        </div>
        <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
        <p className="text-gray-600 mb-6">Delete <strong>{device.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">Delete</Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// PAGES - small performance and bug fixes
// ============================================
const Dashboard = React.memo(() => {
  const { transmitters } = useData();
  const totalDevices = transmitters.length;
  const activeDevices = transmitters.filter(t => t.status === 'active').length;
  const warningDevices = transmitters.filter(t => t.status === 'warning').length;
  const overdueDevices = transmitters.filter(t => new Date(t.nextCalibrationDue) < new Date()).length;

  return (
    <div className="space-y-4 pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview status & calibration</p>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-blue-100 rounded-lg w-fit mb-2"><Settings className="h-5 w-5 text-blue-600" /></div>
            <p className="text-xs font-medium text-gray-600">Total Devices</p>
            <p className="text-2xl font-bold text-gray-900">{totalDevices}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-green-100 rounded-lg w-fit mb-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <p className="text-xs font-medium text-gray-600">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-yellow-100 rounded-lg w-fit mb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
            <p className="text-xs font-medium text-gray-600">Warning</p>
            <p className="text-2xl font-bold text-gray-900">{warningDevices}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-red-100 rounded-lg w-fit mb-2"><Clock className="h-5 w-5 text-red-600" /></div>
            <p className="text-xs font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-gray-900">{overdueDevices}</p>
          </div>
        </Card>
      </div>
      <div className="px-4">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">PT-001 calibration completed</p><p className="text-xs text-gray-500">2 hours ago</p></div></div>
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">FT-002 requires attention</p><p className="text-xs text-gray-500">1 day ago</p></div></div>
          </div>
        </Card>
      </div>
    </div>
  );
});

const DeviceList = ({ onDeviceSelect }) => {
  const { transmitters, deleteTransmitter } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deletingDevice, setDeletingDevice] = useState(null);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm]);

  const filteredDevices = useMemo(() => transmitters.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || device.id.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }), [transmitters, debouncedSearch, filterType, filterStatus]);

  const getStatusBadge = useCallback((status) => {
    if (status === 'active') return <Badge variant="success">Active</Badge>;
    if (status === 'warning') return <Badge variant="warning">Warning</Badge>;
    if (status === 'critical') return <Badge variant="danger">Critical</Badge>;
    return <Badge>Unknown</Badge>;
  }, []);

  const handleDelete = useCallback(() => {
    if (deletingDevice) deleteTransmitter(deletingDevice.id);
    setDeletingDevice(null);
  }, [deletingDevice, deleteTransmitter]);

  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Devices</h1>
            <p className="text-sm text-gray-600">{filteredDevices.length} transmitters</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setShowCreateModal(true)} ariaLabel="Add new device">Add</Button>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search devices..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search devices"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="text-sm text-blue-600 font-medium focus:outline-none focus:underline" aria-expanded={showFilters}>{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by type">
              <option value="all">All Types</option>
              <option value="Pressure">Pressure</option>
              <option value="Flow">Flow</option>
              <option value="Level">Level</option>
              <option value="Temperature">Temperature</option>
            </select>
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}
      </div>
      <div className="px-4 pt-3 space-y-3">
        {filteredDevices.map(device => (
          <Card key={device.id} className="p-4" ariaLabel={`Device ${device.name}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2 cursor-pointer" onClick={() => onDeviceSelect(device)}>
                <h3 className="font-semibold text-gray-900 text-sm truncate">{device.name}</h3>
                <p className="text-xs text-gray-500">{device.id}</p>
              </div>
              <div className="flex gap-2 items-start">{getStatusBadge(device.status)}</div>
            </div>
            <div className="space-y-1 text-xs text-gray-600 cursor-pointer" onClick={() => onDeviceSelect(device)}>
              <div className="flex justify-between"><span>Type:</span><span className="font-medium">{device.type}</span></div>
              <div className="flex justify-between"><span>Location:</span><span className="font-medium truncate ml-2">{device.location}</span></div>
              <div className="flex justify-between"><span>Next Cal:</span><span className={`font-medium ${new Date(device.nextCalibrationDue) < new Date() ? 'text-red-600' : ''}`}>{new Date(device.nextCalibrationDue).toLocaleDateString()}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Edit2} onClick={(e) => { e.stopPropagation(); setEditingDevice(device); }} ariaLabel={`Edit ${device.name}`} />
                <Button variant="danger" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); setDeletingDevice(device); }} ariaLabel={`Delete ${device.name}`} />
              </div>
              <button onClick={() => onDeviceSelect(device)} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" aria-label="View device details">View Details<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </Card>
        ))}
        {filteredDevices.length === 0 && (<div className="text-center py-12"><p className="text-gray-500">No devices found</p></div>)}
      </div>
      <CreateEditTransmitterModal isOpen={showCreateModal || editingDevice !== null} onClose={() => { setShowCreateModal(false); setEditingDevice(null); }} device={editingDevice} />
      <DeleteConfirmModal isOpen={deletingDevice !== null} onClose={() => setDeletingDevice(null)} device={deletingDevice} onConfirm={handleDelete} />
    </div>
  );
};

const DeviceDetail = ({ device, onBack, onStartInspection }) => {
  if (!device) return null;
  const isOverdue = new Date(device.nextCalibrationDue) < new Date();
  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Go back"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0"><h1 className="text-lg font-bold text-gray-900 truncate">{device.name}</h1><p className="text-sm text-gray-600 truncate">{device.id}</p></div>
        </div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Device Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">{device.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Location:</span><span className="font-medium text-right">{device.location}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Range:</span><span className="font-medium">{device.range}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Accuracy:</span><span className="font-medium">{device.accuracy}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Status:</span><div>{device.status === 'active' && <Badge variant="success">Active</Badge>}{device.status === 'warning' && <Badge variant="warning">Warning</Badge>}{device.status === 'critical' && <Badge variant="danger">Critical</Badge>}</div></div>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Calibration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Last Cal:</span><span className="font-medium">{new Date(device.lastCalibration).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Next Due:</span><span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{new Date(device.nextCalibrationDue).toLocaleDateString()}</span></div>
          </div>
          {isOverdue && (<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert"><div className="flex items-start"><AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" /><span className="text-sm font-medium text-red-800">Calibration overdue - immediate attention required</span></div></div>)}
          <Button className="w-full mt-4" onClick={onStartInspection} variant={isOverdue ? "danger" : "primary"} icon={Camera}>Start Inspection</Button>
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">History</h2>
          <div className="space-y-3"><div className="flex items-start justify-between p-3 border rounded-lg"><div className="flex-1 min-w-0"><p className="font-medium text-sm text-gray-900">Routine Inspection</p><p className="text-xs text-gray-600">John Doe</p><p className="text-xs text-gray-500">Jan 15, 2024</p></div><Badge variant="success">Passed</Badge></div></div>
        </Card>
      </div>
    </div>
  );
};

const checklistSteps = [
  { id: 'visual', title: 'Visual Inspection', items: [ { id: 'housing', label: 'Housing condition (no cracks, corrosion)', type: 'checkbox' }, { id: 'connections', label: 'Electrical connections secure', type: 'checkbox' }, { id: 'cables', label: 'Cable condition good', type: 'checkbox' }, { id: 'mounting', label: 'Mounting secure', type: 'checkbox' } ] },
  { id: 'functional', title: 'Functional Test', items: [ { id: 'display', label: 'Display readable', type: 'checkbox' }, { id: 'response', label: 'Response time acceptable', type: 'checkbox' }, { id: 'accuracy', label: 'Reading accuracy within spec', type: 'checkbox' }, { id: 'alarms', label: 'Alarm functions tested', type: 'checkbox' } ] },
  { id: 'documentation', title: 'Documentation', items: [ { id: 'photos', label: 'Photos taken', type: 'file' }, { id: 'notes', label: 'Additional notes', type: 'textarea' }, { id: 'signature', label: 'Inspector signature', type: 'signature' } ] }
];

const InspectionChecklist = ({ device, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [checklistData, setChecklistData] = useState({});
  const [signature, setSignature] = useState(null);
  const [photos, setPhotos] = useState([]);

  const handleCheckboxChange = useCallback((stepId, itemId, checked) => {
    setChecklistData(prev => ({ ...prev, [stepId]: { ...prev[stepId], [itemId]: checked } }));
  }, []);

  const handleTextareaChange = useCallback((stepId, itemId, value) => {
    setChecklistData(prev => ({ ...prev, [stepId]: { ...prev[stepId], [itemId]: value } }));
  }, []);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, { id: Date.now() + Math.random(), name: file.name, url: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (photoId) => setPhotos(prev => prev.filter(photo => photo.id !== photoId));

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, checklistSteps.length - 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleComplete = () => {
    if (!signature) {
      alert('Signature is required before completing inspection');
      return;
    }
    const inspectionData = { deviceId: device.id, timestamp: new Date().toISOString(), checklist: checklistData, photos, signature, inspector: 'Current User' };
    onComplete(inspectionData);
  };

  const currentStepData = checklistSteps[currentStep];
  const progress = ((currentStep + 1) / checklistSteps.length) * 100;

  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3"><h1 className="text-lg font-bold text-gray-900">Inspection</h1><p className="text-sm text-gray-600 truncate">{device.name}</p></div>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5"><span>Step {currentStep + 1} of {checklistSteps.length}</span><span>{Math.round(progress)}%</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
        </div>
      </div>
      <div className="px-4 pt-4">
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentStepData.title}</h2>
          <div className="space-y-4">
            {currentStepData.items.map(item => (
              <div key={item.id}>
                {item.type === 'checkbox' && (
                  <label className="flex items-start space-x-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" checked={checklistData[currentStepData.id]?.[item.id] || false} onChange={(e) => handleCheckboxChange(currentStepData.id, item.id, e.target.checked)} aria-label={item.label} /><span className="text-sm text-gray-900 flex-1">{item.label}</span></label>
                )}
                {item.type === 'textarea' && (
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label><textarea className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="4" value={checklistData[currentStepData.id]?.[item.id] || ''} onChange={(e) => handleTextareaChange(currentStepData.id, item.id, e.target.value)} placeholder="Enter additional notes here..." aria-label={item.label} /></div>
                )}
                {item.type === 'file' && (
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50"><input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" aria-label="Upload inspection photos" /><label htmlFor="photo-upload" className="cursor-pointer block"><Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" /><p className="text-sm font-medium text-gray-700 mb-1">Tap to upload photos</p><p className="text-xs text-gray-500">JPG, PNG up to 10MB</p></label></div>{photos.length > 0 && (<div className="mt-4"><h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos ({photos.length})</h4><div className="grid grid-cols-3 gap-2">{photos.map(photo => (<div key={photo.id} className="relative group"><img src={photo.url} alt={photo.name} className="w-full h-20 object-cover rounded-lg border-2 border-gray-200" /><button onClick={() => removePhoto(photo.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Remove photo ${photo.name}`}><X size={16} /></button></div>))}</div></div>)}</div>
                )}
                {item.type === 'signature' && (
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.label} <span className="text-red-500">*</span></label><SignaturePad onSave={(sig) => { setSignature(sig); alert('Signature saved successfully!'); }} onClear={() => setSignature(null)} />{signature && (<div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg" role="status"><p className="text-sm text-green-700 flex items-center"><CheckCircle className="h-4 w-4 mr-2" />Signature captured successfully</p></div>)}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex-1" size="lg" ariaLabel="Go to previous step">← Previous</Button>
          {currentStep === checklistSteps.length - 1 ? (
            <Button onClick={handleComplete} className="flex-1" size="lg" disabled={!signature} ariaLabel="Complete inspection">Complete ✓</Button>
          ) : (
            <Button onClick={nextStep} className="flex-1" size="lg" ariaLabel="Go to next step">Next →</Button>
          )}
        </div>
        <div className="flex justify-center gap-2 pb-4" role="tablist" aria-label="Inspection steps">{checklistSteps.map((step, idx) => (<div key={step.id} className={`h-2 rounded-full transition-all ${idx === currentStep ? 'w-8 bg-blue-600' : idx < currentStep ? 'w-2 bg-green-500' : 'w-2 bg-gray-300'}`} role="tab" aria-selected={idx === currentStep} aria-label={`Step ${idx + 1}: ${step.title}`} />))}</div>
      </div>
    </div>
  );
};

const ReviewSubmit = ({ inspectionData, device, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    onSubmit();
    setIsSubmitting(false);
  };

  const getCompletionStatus = useCallback((data) => {
    const totalItems = checklistSteps.reduce((acc, step) => acc + step.items.length, 0);
    let completedItems = 0;
    checklistSteps.forEach(step => {
      step.items.forEach(item => {
        if (item.type === 'checkbox') {
          if (data.checklist?.[step.id]?.[item.id]) completedItems++;
        } else if (item.type === 'file') {
          if (data.photos?.length > 0) completedItems++;
        } else if (item.type === 'textarea') {
          if (data.checklist?.[step.id]?.[item.id]?.toString().trim()) completedItems++;
        } else if (item.type === 'signature') {
          if (data.signature) completedItems++;
        }
      });
    });
    return { completed: completedItems, total: totalItems };
  }, []);

  const status = getCompletionStatus(inspectionData || {});
  const completionPercentage = status.total ? Math.round((status.completed / status.total) * 100) : 0;

  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2"><div className="flex-1 min-w-0 mr-3"><h1 className="text-lg font-bold text-gray-900">Review</h1><p className="text-sm text-gray-600 truncate">{device.name}</p></div><Button variant="outline" size="sm" onClick={onBack}>Back</Button></div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Device Info</h2>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-600">Device:</span><span className="font-medium text-right">{device.name}</span></div><div className="flex justify-between"><span className="text-gray-600">ID:</span><span className="font-medium">{device.id}</span></div><div className="flex justify-between"><span className="text-gray-600">Inspector:</span><span className="font-medium">{inspectionData.inspector}</span></div><div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-medium">{new Date(inspectionData.timestamp).toLocaleDateString()}</span></div></div>
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Progress</h2>
          <div><div className="flex justify-between text-sm text-gray-600 mb-1.5"><span>Overall</span><span>{completionPercentage}%</span></div><div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${completionPercentage}%` }}></div></div><div className="space-y-1 text-sm"><p className="text-gray-600">{status.completed} of {status.total} items completed</p><p className="text-gray-600">{inspectionData.photos.length} photo(s) attached</p><p className="text-gray-600">Signature: {inspectionData.signature ? '✓ Provided' : '✗ Missing'}</p></div></div>
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Checklist</h2>
          <div className="space-y-3">{checklistSteps.map(step => { const stepData = inspectionData.checklist?.[step.id] || {}; const completedInStep = step.items.filter(item => stepData[item.id] || (item.type === 'file' && inspectionData.photos.length > 0) || (item.type === 'signature' && inspectionData.signature)).length; return (<div key={step.id} className="border rounded-lg p-3"><div className="flex justify-between items-center mb-2"><h3 className="font-medium text-sm text-gray-900">{step.title}</h3><span className="text-xs text-gray-600">{completedInStep}/{step.items.length}</span></div><div className="space-y-1">{step.items.map(item => (<div key={item.id} className="flex items-center text-xs"><span className={`mr-2 ${stepData[item.id] ? 'text-green-600' : 'text-gray-400'}`}>{stepData[item.id] || (item.type === 'file' && inspectionData.photos.length > 0) || (item.type === 'signature' && inspectionData.signature) ? '✓' : '○'}</span><span className="text-gray-700">{item.label}</span></div>))}</div></div>); })}</div>
        </Card>
        {inspectionData.photos.length > 0 && (<Card className="p-4"><h2 className="text-base font-semibold text-gray-900 mb-3">Photos ({inspectionData.photos.length})</h2><div className="grid grid-cols-3 gap-2">{inspectionData.photos.map(photo => (<img key={photo.id} src={photo.url} alt={photo.name} className="w-full h-20 object-cover rounded-lg border" />))}</div></Card>)}
        <Card className="p-4"><div className="mb-3"><h2 className="text-base font-semibold text-gray-900">Ready to Submit?</h2><p className="text-sm text-gray-600">This inspection will be saved</p></div>{!inspectionData.signature && (<div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert"><div className="flex items-start"><AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" /><span className="text-sm text-yellow-800">Signature required</span></div></div>)}<Button onClick={handleSubmit} disabled={isSubmitting || !inspectionData.signature} className="w-full">{isSubmitting ? (<div className="flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Submitting...</div>) : ('Submit Inspection')}</Button></Card>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleDeviceSelect = useCallback((device) => { setSelectedDevice(device); setCurrentView('device-detail'); }, []);
  const handleStartInspection = useCallback(() => setCurrentView('inspection'), []);
  const handleInspectionComplete = useCallback((data) => { setInspectionData(data); setCurrentView('review'); }, []);
  const handleSubmitInspection = useCallback(() => {
    setShowSuccessModal(true);
    setTimeout(() => {
      setCurrentView('dashboard');
      setSelectedDevice(null);
      setInspectionData(null);
      setShowSuccessModal(false);
    }, 1200);
  }, []);

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
        <OfflineBanner />
        <header className="bg-white border-b sticky top-0 z-20"><div className="px-4 py-3 flex items-center justify-between"><div className="flex items-center"><Settings className="h-7 w-7 text-blue-600 mr-2" /><h1 className="text-base font-bold text-gray-900">Transmitter Check</h1></div><button className="p-2 text-gray-400 hover:text-gray-600 relative focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full" aria-label="Notifications"><Bell className="h-6 w-6" /><span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" aria-label="1 new notification"></span></button></div></header>
        <main className="min-h-screen">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'devices' && <DeviceList onDeviceSelect={handleDeviceSelect} />}
          {currentView === 'device-detail' && <DeviceDetail device={selectedDevice} onBack={() => setCurrentView('devices')} onStartInspection={handleStartInspection} />}
          {currentView === 'inspection' && <InspectionChecklist device={selectedDevice} onComplete={handleInspectionComplete} onCancel={() => setCurrentView('device-detail')} />}
          {currentView === 'review' && <ReviewSubmit inspectionData={inspectionData} device={selectedDevice} onSubmit={handleSubmitInspection} onBack={() => setCurrentView('inspection')} />}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-md mx-auto z-20" role="navigation" aria-label="Main navigation"><div className="flex justify-around"><button onClick={() => setCurrentView('dashboard')} className={`flex-1 flex flex-col items-center py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`} aria-label="Dashboard" aria-current={currentView === 'dashboard' ? 'page' : undefined}><Home className="h-6 w-6 mb-1" /><span className="text-xs font-medium">Home</span></button><button onClick={() => setCurrentView('devices')} className={`flex-1 flex flex-col items-center py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${currentView === 'devices' || currentView === 'device-detail' || currentView === 'inspection' || currentView === 'review' ? 'text-blue-600' : 'text-gray-400'}`} aria-label="Devices" aria-current={currentView === 'devices' ? 'page' : undefined}><List className="h-6 w-6 mb-1" /><span className="text-xs font-medium">Devices</span></button></div></nav>
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Inspection Submitted"><div className="text-center py-6 px-2"><div className="mb-4 flex justify-center"><div className="bg-green-100 rounded-full p-4"><CheckCircle className="h-16 w-16 text-green-600" /></div></div><h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3><p className="text-base text-gray-600 mb-6">Your inspection has been saved successfully and will be synced when online.</p><Button onClick={() => setShowSuccessModal(false)} className="w-full">Close</Button></div></Modal>
      </div>
    </DataProvider>
  );
};

export default App;
