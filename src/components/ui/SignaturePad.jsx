// ============================================
// FILE: src/components/ui/SignaturePad.jsx
// ============================================
import { useRef, useState } from 'react';

export const SignaturePad = ({ onSave, onClear }) => {
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