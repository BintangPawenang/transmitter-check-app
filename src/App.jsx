import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Plus, AlertTriangle, CheckCircle, Clock, Camera, Edit3, Save, X, Home, List, Settings, Bell } from 'lucide-react';

// Mock data for transmitters
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

// Design tokens
const colors = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
};

// Components
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  };
  
  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    onSave?.(dataURL);
  };
  
  return (
    <div className="border rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border border-gray-300 rounded cursor-crosshair w-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={clearCanvas}>
          Clear
        </Button>
        <Button onClick={saveSignature}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const totalDevices = mockTransmitters.length;
  const activeDevices = mockTransmitters.filter(t => t.status === 'active').length;
  const warningDevices = mockTransmitters.filter(t => t.status === 'warning').length;
  const criticalDevices = mockTransmitters.filter(t => t.status === 'critical').length;
  
  const overdueDevices = mockTransmitters.filter(t => 
    new Date(t.nextCalibrationDue) < new Date()
  ).length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of instrument status and calibration schedule</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{totalDevices}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-gray-900">{warningDevices}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueDevices}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium">PT-001 calibration completed</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium">FT-002 requires attention</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const DeviceList = ({ onDeviceSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
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
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'critical':
        return <Badge variant="danger">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getHealthColor = (health) => {
    switch (health) {
      case 'good':
        return 'text-green-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">Manage your transmitter inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>
      
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div className="grid gap-4">
          {filteredDevices.map(device => (
            <div
              key={device.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onDeviceSelect(device)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{device.name}</h3>
                    {getStatusBadge(device.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <span><strong>ID:</strong> {device.id}</span>
                    <span><strong>Type:</strong> {device.type}</span>
                    <span><strong>Location:</strong> {device.location}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Health: </span>
                    <span className={`font-medium ${getHealthColor(device.healthIndicator)}`}>
                      {device.healthIndicator}
                    </span>
                    <span className="text-gray-600 ml-4">Next Cal: </span>
                    <span className={new Date(device.nextCalibrationDue) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {new Date(device.nextCalibrationDue).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredDevices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No devices found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

const DeviceDetail = ({ device, onBack, onStartInspection }) => {
  if (!device) return null;
  
  const isOverdue = new Date(device.nextCalibrationDue) < new Date();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
          <p className="text-gray-600">{device.id} • {device.location}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{device.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Range:</span>
                <span className="font-medium">{device.range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-medium">{device.accuracy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <div>
                  {device.status === 'active' && <Badge variant="success">Active</Badge>}
                  {device.status === 'warning' && <Badge variant="warning">Warning</Badge>}
                  {device.status === 'critical' && <Badge variant="danger">Critical</Badge>}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Health:</span>
                <span className={`font-medium ${
                  device.healthIndicator === 'good' ? 'text-green-600' :
                  device.healthIndicator === 'fair' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {device.healthIndicator}
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Calibration Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Calibration:</span>
                <span className="font-medium">
                  {new Date(device.lastCalibration).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Due:</span>
                <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(device.nextCalibrationDue).toLocaleDateString()}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            </div>
            
            {isOverdue && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    Calibration overdue - immediate attention required
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                className="w-full" 
                onClick={onStartInspection}
                variant={isOverdue ? "danger" : "primary"}
              >
                Start Inspection
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection History</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Routine Inspection</p>
                <p className="text-sm text-gray-600">Completed by John Doe</p>
                <p className="text-xs text-gray-500">January 15, 2024</p>
              </div>
              <Badge variant="success">Passed</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Calibration Check</p>
                <p className="text-sm text-gray-600">Completed by Jane Smith</p>
                <p className="text-xs text-gray-500">October 10, 2023</p>
              </div>
              <Badge variant="warning">Minor Issues</Badge>
            </div>
          </div>
        </div>
      </Card>
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
      [stepId]: {
        ...prev[stepId],
        [itemId]: checked
      }
    }));
  };
  
  const handleTextareaChange = (stepId, itemId, value) => {
    setChecklistData(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [itemId]: value
      }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Checklist</h1>
          <p className="text-gray-600">{device.name} ({device.id})</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {checklistSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentStepData.title}
            </h2>
            
            <div className="space-y-4">
              {currentStepData.items.map(item => (
                <div key={item.id}>
                  {item.type === 'checkbox' && (
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={checklistData[currentStepData.id]?.[item.id] || false}
                        onChange={(e) => handleCheckboxChange(currentStepData.id, item.id, e.target.checked)}
                      />
                      <span className="text-gray-900">{item.label}</span>
                    </label>
                  )}
                  
                  {item.type === 'textarea' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {item.label}
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        value={checklistData[currentStepData.id]?.[item.id] || ''}
                        onChange={(e) => handleTextareaChange(currentStepData.id, item.id, e.target.value)}
                        placeholder="Enter additional notes..."
                      />
                    </div>
                  )}
                  
                  {item.type === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {item.label}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-600">Click to upload photos</p>
                        </label>
                      </div>
                      
                      {photos.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map(photo => (
                              <div key={photo.id} className="relative">
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => removePhoto(photo.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X size={12} />
                                </button>
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
                        {item.label}
                      </label>
                      <SignaturePad
                        onSave={setSignature}
                        onClear={() => setSignature(null)}
                      />
                      {signature && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">✓ Signature captured</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep === checklistSteps.length - 1 ? (
              <Button onClick={handleComplete}>
                Complete Inspection
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const ReviewSubmit = ({ inspectionData, device, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
          <p className="text-gray-600">Review your inspection before submitting</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Checklist
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Device:</span>
                <span>{device.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span>{device.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{device.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inspector:</span>
                <span>{inspectionData.inspector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(inspectionData.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completion Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm">
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
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist Summary</h2>
          <div className="space-y-4">
            {checklistSteps.map(step => {
              const stepData = inspectionData.checklist[step.id] || {};
              const completedInStep = step.items.filter(item => stepData[item.id]).length;
              
              return (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    <span className="text-sm text-gray-600">
                      {completedInStep}/{step.items.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {step.items.map(item => (
                      <div key={item.id} className="flex items-center text-sm">
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
        </div>
      </Card>
      
      {inspectionData.photos.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Attached Photos ({inspectionData.photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inspectionData.photos.map(photo => (
                <div key={photo.id}>
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ready to Submit?</h2>
              <p className="text-gray-600 text-sm">
                This inspection will be saved and synced to the server.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !inspectionData.signature}
              className="min-w-32"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Inspection'
              )}
            </Button>
          </div>
          
          {!inspectionData.signature && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Signature is required before submitting
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

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
    setCurrentView('dashboard');
    setSelectedDevice(null);
    setInspectionData(null);
  };
  
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'devices', label: 'Devices', icon: List },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-900">
                  Transmitter Check
                </h1>
              </div>
              <div className="ml-10 flex space-x-8">
                {navigation.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      currentView === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">JD</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Inspection Submitted"
      >
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inspection Successfully Submitted!
          </h3>
          <p className="text-gray-600 mb-6">
            Your inspection data has been saved and will be synced when online.
          </p>
          <Button onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default App;