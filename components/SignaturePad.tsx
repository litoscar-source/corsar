import React, { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onEnd: (dataUrl: string | null) => void;
  initialData?: string | null;
  disabled?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label, onEnd, initialData, disabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && initialData) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = initialData;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        setHasSignature(true);
      };
    }
  }, [initialData]);

  // Updated Coordinate Logic for Better Precision
  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Account for canvas scaling if CSS width != Attribute width
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    
    if ((event as any).touches && (event as any).touches.length > 0) {
      clientX = (event as TouchEvent).touches[0].clientX;
      clientY = (event as TouchEvent).touches[0].clientY;
    } else {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3; // Slightly thicker
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    
    const { x, y } = getCoordinates(e.nativeEvent as any);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Prevent scrolling on touch devices
    if(e.type === 'touchmove') {
      // e.preventDefault() is handled by touch-action: none in CSS
    }

    const { x, y } = getCoordinates(e.nativeEvent as any);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
      onEnd(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onEnd(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {!disabled && (
          <button 
            type="button"
            onClick={clear}
            className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800"
          >
            <Eraser size={14} /> Limpar
          </button>
        )}
      </div>
      <div className={`border-2 border-dashed ${disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-400'} rounded-lg overflow-hidden touch-none`}>
        <canvas
          ref={canvasRef}
          width={600} // Higher resolution
          height={250}
          className="w-full h-40 cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {!hasSignature && !disabled && (
        <p className="text-xs text-amber-600">Assinatura obrigatória</p>
      )}
    </div>
  );
};

export default SignaturePad;