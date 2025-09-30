// ============================================
// FILE: src/data/mockData.js
// ============================================
export const mockTransmitters = [
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
  },
  {
    id: 'PT-005',
    name: 'Pressure Transmitter 005',
    type: 'Pressure',
    location: 'Unit E - Compressor',
    status: 'active',
    lastCalibration: '2024-02-10',
    nextCalibrationDue: '2025-02-10',
    healthIndicator: 'good',
    range: '0-50 bar',
    accuracy: '±0.1%'
  }
];

export const checklistSteps = [
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