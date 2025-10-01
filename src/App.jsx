import React, { useState, useRef } from 'react';
import { Search, Plus, AlertTriangle, CheckCircle, Clock, Camera, X, Home, List, Settings, Bell, Menu, ArrowLeft } from 'lucide-react';

// ============================================
// MOCK DATA
// ============================================
const mockTransmitters = [
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
  },
  {
    id: 'TT-004',
    name: 'Temperature Transmitter 004',
    type: 'Temperature',
    location: 'Unit D - Heat Exchanger',
    status: 'active',
    lastCalibration: '2024-03-01',
    nextCalibrationDue: '2025-03-01',
    healthIndicator: 'good',
    range: '0-200°C',
    accuracy: '±0.5°C'
  }
];

const checklistSteps = [
  {
    id: 'visual',
    title: 'Visual Inspection',
    items: [
      { id: 'housing', label: 'Housing condition (no cracks, corrosion)', type: 'checkbox' },
      { id: 'connections', label: 'Electrical connections secure', type: 'checkbox' },
      { id: 'cables', label: 'Cable condition good', type: 'checkbox' },
      { id: 'mounting', label: 'Mounting secure', type: 'checkbox' }
    ]
  },
  {
    id: 'functional',
    title: 'Functional Test',
    items: [
      { id: 'display', label: 'Display readable', type: 'checkbox' },
      { id: 'response', label: 'Response time acceptable', type: 'checkbox' },
      { id: 'accuracy', label: 'Reading accuracy within spec', type: 'checkbox' },
      { id: 'alarms', label: 'Alarm functions tested', type: 'checkbox' }
    ]
  },
  {
    id: 'documentation',
    title: 'Documentation',
    items: [
      { id: 'photos', label: 'Photos taken', type: 'file' },
      { id: 'notes', label: 'Additional notes', type: 'textarea' },
      { id: 'signature', label: 'Inspector signature', type: 'signature' }
    ]
  }
];

// ============================================
// UI COMPONENTS
// ============================================
const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
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
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ variant = 'default', children }) => {
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
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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
    const dataURL = canvas.toDataURL();
    if (onSave) onSave(dataURL);
  };
  
  return (
    <div className="border rounded-lg p-3">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="border border-gray-300 rounded cursor-crosshair w-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2 mt-3">
        <Button variant="outline" onClick={clearCanvas} size="sm" className="flex-1">Clear</Button>
        <Button onClick={saveSignature} size="sm" className="flex-1">Save</Button>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENTS - MOBILE OPTIMIZED
// ============================================
const Dashboard = () => {
  const totalDevices = mockTransmitters.length;
  const activeDevices = mockTransmitters.filter(t => t.status === 'active').length;
  const warningDevices = mockTransmitters.filter(t => t.status === 'warning').length;
  const overdueDevices = mockTransmitters.filter(t => new Date(t.nextCalibrationDue) < new Date()).length;
  
  return (
    <div className="space-y-4 pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview status & calibration</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 px-4">
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-blue-100 rounded-lg w-fit mb-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-600">Total Devices</p>
            <p className="text-2xl font-bold text-gray-900">{totalDevices}</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-green-100 rounded-lg w-fit mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs font-medium text-gray-600">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-yellow-100 rounded-lg w-fit mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-xs font-medium text-gray-600">Warning</p>
            <p className="text-2xl font-bold text-gray-900">{warningDevices}</p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="p-2 bg-red-100 rounded-lg w-fit mb-2">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-xs font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-gray-900">{overdueDevices}</p>
          </div>
        </Card>
      </div>
      
      <div className="px-4">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">PT-001 calibration completed</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">FT-002 requires attention</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DeviceList = ({ onDeviceSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const filteredDevices = mockTransmitters.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  const getStatusBadge = (status) => {
    if (status === 'active') return <Badge variant="success">Active</Badge>;
    if (status === 'warning') return <Badge variant="warning">Warning</Badge>;
    if (status === 'critical') return <Badge variant="danger">Critical</Badge>;
    return <Badge>Unknown</Badge>;
  };
  
  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Devices</h1>
            <p className="text-sm text-gray-600">{filteredDevices.length} transmitters</p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search devices..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 font-medium"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Pressure">Pressure</option>
              <option value="Flow">Flow</option>
              <option value="Level">Level</option>
              <option value="Temperature">Temperature</option>
            </select>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
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
          <div
            key={device.id}
            onClick={() => onDeviceSelect(device)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{device.name}</h3>
                <p className="text-xs text-gray-500">{device.id}</p>
              </div>
              {getStatusBadge(device.status)}
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{device.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium truncate ml-2">{device.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Cal:</span>
                <span className={`font-medium ${new Date(device.nextCalibrationDue) < new Date() ? 'text-red-600' : ''}`}>
                  {new Date(device.nextCalibrationDue).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Tap to view details</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
        
        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No devices found</p>
          </div>
        )}
      </div>
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
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{device.name}</h1>
            <p className="text-sm text-gray-600 truncate">{device.id}</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 pt-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Device Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{device.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium text-right">{device.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-medium">{device.range}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-medium">{device.accuracy}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <div>
                {device.status === 'active' && <Badge variant="success">Active</Badge>}
                {device.status === 'warning' && <Badge variant="warning">Warning</Badge>}
                {device.status === 'critical' && <Badge variant="danger">Critical</Badge>}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Calibration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Cal:</span>
              <span className="font-medium">
                {new Date(device.lastCalibration).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Due:</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {new Date(device.nextCalibrationDue).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {isOverdue && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-red-800">
                  Calibration overdue - immediate attention required
                </span>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full mt-4" 
            onClick={onStartInspection}
            variant={isOverdue ? "danger" : "primary"}
          >
            Start Inspection
          </Button>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">History</h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">Routine Inspection</p>
                <p className="text-xs text-gray-600">John Doe</p>
                <p className="text-xs text-gray-500">Jan 15, 2024</p>
              </div>
              <Badge variant="success">Passed</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const InspectionChecklist = ({ device, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [checklistData, setChecklistData] = useState({});
  const [signature, setSignature] = useState(null);
  const [photos, setPhotos] = useState([]);
  
  const handleCheckboxChange = (stepId, itemId, checked) => {
    setChecklistData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], [itemId]: checked }
    }));
  };
  
  const handleTextareaChange = (stepId, itemId, value) => {
    setChecklistData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], [itemId]: value }
    }));
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          url: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  
  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };
  
  const nextStep = () => {
    if (currentStep < checklistSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    if (!signature) {
      alert('Signature is required before completing inspection');
      return;
    }
    const inspectionData = {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      checklist: checklistData,
      photos,
      signature,
      inspector: 'Current User'
    };
    onComplete(inspectionData);
  };
  
  const currentStepData = checklistSteps[currentStep];
  const progress = ((currentStep + 1) / checklistSteps.length) * 100;
  
  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <h1 className="text-lg font-bold text-gray-900">Inspection</h1>
            <p className="text-sm text-gray-600 truncate">{device.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span>Step {currentStep + 1} of {checklistSteps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="px-4 pt-4">
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {currentStepData.title}
          </h2>
          
          <div className="space-y-4">
            {currentStepData.items.map(item => (
              <div key={item.id}>
                {item.type === 'checkbox' && (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={checklistData[currentStepData.id]?.[item.id] || false}
                      onChange={(e) => handleCheckboxChange(currentStepData.id, item.id, e.target.checked)}
                    />
                    <span className="text-sm text-gray-900 flex-1">{item.label}</span>
                  </label>
                )}
                
                {item.type === 'textarea' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label}
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      value={checklistData[currentStepData.id]?.[item.id] || ''}
                      onChange={(e) => handleTextareaChange(currentStepData.id, item.id, e.target.value)}
                      placeholder="Enter additional notes here..."
                    />
                  </div>
                )}
                
                {item.type === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer block">
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Tap to upload photos</p>
                        <p className="text-xs text-gray-500">JPG, PNG up to 10MB</p>
                      </label>
                    </div>
                    
                    {photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Uploaded Photos ({photos.length})
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map(photo => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.url}
                                alt={photo.name}
                                className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                onClick={() => removePhoto(photo.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {item.type === 'signature' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label} <span className="text-red-500">*</span>
                    </label>
                    <SignaturePad
                      onSave={(sig) => {
                        setSignature(sig);
                        alert('Signature saved successfully!');
                      }}
                      onClear={() => setSignature(null)}
                    />
                    {signature && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Signature captured successfully
                        </p>
                      </div>
                    )}
                    {!signature && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Draw your signature above and tap "Save"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        
        <div className="flex gap-3 mb-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
            size="lg"
          >
            ← Previous
          </Button>
          
          {currentStep === checklistSteps.length - 1 ? (
            <Button 
              onClick={handleComplete} 
              className="flex-1"
              size="lg"
              disabled={!signature}
            >
              Complete ✓
            </Button>
          ) : (
            <Button 
              onClick={nextStep} 
              className="flex-1"
              size="lg"
            >
              Next →
            </Button>
          )}
        </div>
        
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 pb-4">
          {checklistSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-8 bg-blue-600' 
                  : idx < currentStep 
                  ? 'w-2 bg-green-500' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ReviewSubmit = ({ inspectionData, device, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onSubmit();
    setIsSubmitting(false);
  };
  
  const getCompletionStatus = () => {
    const totalItems = checklistSteps.reduce((acc, step) => acc + step.items.length, 0);
    let completedItems = 0;
    
    checklistSteps.forEach(step => {
      step.items.forEach(item => {
        if (inspectionData.checklist[step.id]?.[item.id]) {
          completedItems++;
        }
      });
    });
    
    return { completed: completedItems, total: totalItems };
  };
  
  const status = getCompletionStatus();
  const completionPercentage = Math.round((status.completed / status.total) * 100);
  
  return (
    <div className="pb-20">
      <div className="px-4 pt-4 pb-3 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <h1 className="text-lg font-bold text-gray-900">Review</h1>
            <p className="text-sm text-gray-600 truncate">{device.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
      
      <div className="px-4 pt-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Device Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Device:</span>
              <span className="font-medium text-right">{device.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium">{device.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inspector:</span>
              <span className="font-medium">{inspectionData.inspector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(inspectionData.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Progress</h2>
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1.5">
              <span>Overall</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                {status.completed} of {status.total} items completed
              </p>
              <p className="text-gray-600">
                {inspectionData.photos.length} photo(s) attached
              </p>
              <p className="text-gray-600">
                Signature: {inspectionData.signature ? '✓ Provided' : '✗ Missing'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Checklist</h2>
          <div className="space-y-3">
            {checklistSteps.map(step => {
              const stepData = inspectionData.checklist[step.id] || {};
              const completedInStep = step.items.filter(item => stepData[item.id]).length;
              
              return (
                <div key={step.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sm text-gray-900">{step.title}</h3>
                    <span className="text-xs text-gray-600">
                      {completedInStep}/{step.items.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {step.items.map(item => (
                      <div key={item.id} className="flex items-center text-xs">
                        <span className={`mr-2 ${stepData[item.id] ? 'text-green-600' : 'text-gray-400'}`}>
                          {stepData[item.id] ? '✓' : '○'}
                        </span>
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        {inspectionData.photos.length > 0 && (
          <Card className="p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Photos ({inspectionData.photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {inspectionData.photos.map(photo => (
                <div key={photo.id}>
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-20 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <Card className="p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Ready to Submit?</h2>
            <p className="text-sm text-gray-600">
              This inspection will be saved
            </p>
          </div>
          
          {!inspectionData.signature && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-yellow-800">
                  Signature required
                </span>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !inspectionData.signature}
            className="w-full"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Inspection'
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT - MOBILE VERSION
// ============================================
const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setCurrentView('device-detail');
  };
  
  const handleStartInspection = () => {
    setCurrentView('inspection');
  };
  
  const handleInspectionComplete = (data) => {
    setInspectionData(data);
    setCurrentView('review');
  };
  
  const handleSubmitInspection = () => {
    setShowSuccessModal(true);
    setTimeout(() => {
      setCurrentView('dashboard');
      setSelectedDevice(null);
      setInspectionData(null);
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Header - Mobile */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-7 w-7 text-blue-600 mr-2" />
            <h1 className="text-base font-bold text-gray-900">
              Transmitter Check
            </h1>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="min-h-screen">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'devices' && (
          <DeviceList onDeviceSelect={handleDeviceSelect} />
        )}
        {currentView === 'device-detail' && (
          <DeviceDetail
            device={selectedDevice}
            onBack={() => setCurrentView('devices')}
            onStartInspection={handleStartInspection}
          />
        )}
        {currentView === 'inspection' && (
          <InspectionChecklist
            device={selectedDevice}
            onComplete={handleInspectionComplete}
            onCancel={() => setCurrentView('device-detail')}
          />
        )}
        {currentView === 'review' && (
          <ReviewSubmit
            inspectionData={inspectionData}
            device={selectedDevice}
            onSubmit={handleSubmitInspection}
            onBack={() => setCurrentView('inspection')}
          />
        )}
      </main>
      
      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-md mx-auto z-20">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 flex flex-col items-center py-3 ${
              currentView === 'dashboard'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('devices')}
            className={`flex-1 flex flex-col items-center py-3 ${
              currentView === 'devices' || currentView === 'device-detail' || currentView === 'inspection' || currentView === 'review'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          >
            <List className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Devices</span>
          </button>
        </div>
      </nav>
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
      >
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inspection Submitted!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your inspection has been saved successfully
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default App;