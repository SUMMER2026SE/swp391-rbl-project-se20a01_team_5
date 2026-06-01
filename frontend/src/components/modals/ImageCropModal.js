import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCw, Image as ImageIcon } from 'lucide-react';

export default function ImageCropModal({ isOpen, imageUrl, onClose, onConfirm }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset states when new image is loaded
  useEffect(() => {
    if (!isOpen) return undefined;

    const handle = window.setTimeout(() => {
      setZoom(100);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }, 0);

    return () => window.clearTimeout(handle);
  }, [isOpen, imageUrl]);

  // Compute precise bounds based on actual image dimensions
  const getBounds = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return { maxX: 0, maxY: 0 };

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    let imageW = imageRef.current.offsetWidth;
    let imageH = imageRef.current.offsetHeight;

    if (rotation % 180 !== 0) {
      imageW = imageRef.current.offsetHeight;
      imageH = imageRef.current.offsetWidth;
    }

    const scale = zoom / 100;
    const finalW = imageW * scale;
    const finalH = imageH * scale;

    const maxX = Math.max(0, (finalW - containerW) / 2);
    const maxY = Math.max(0, (finalH - containerH) / 2);

    return { maxX, maxY };
  }, [rotation, zoom]);

  // Bound the position when zoom changes
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const { maxX, maxY } = getBounds();
      setPosition(prev => {
        const newX = Math.min(Math.max(prev.x, -maxX), maxX);
        const newY = Math.min(Math.max(prev.y, -maxY), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    }, 0);

    return () => window.clearTimeout(handle);
  }, [getBounds]);

  if (!isOpen) return null;

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging && containerRef.current) {
      const { maxX, maxY } = getBounds();

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      const clampedX = Math.min(Math.max(newX, -maxX), maxX);
      const clampedY = Math.min(Math.max(newY, -maxY), maxY);

      if (newX !== clampedX || newY !== clampedY) {
        setDragStart({ x: e.clientX - clampedX, y: e.clientY - clampedY });
      }

      setPosition({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (isDragging && containerRef.current) {
      const { maxX, maxY } = getBounds();

      const touch = e.touches[0];
      let newX = touch.clientX - dragStart.x;
      let newY = touch.clientY - dragStart.y;

      const clampedX = Math.min(Math.max(newX, -maxX), maxX);
      const clampedY = Math.min(Math.max(newY, -maxY), maxY);

      if (newX !== clampedX || newY !== clampedY) {
        setDragStart({ x: touch.clientX - clampedX, y: touch.clientY - clampedY });
      }

      setPosition({ x: clampedX, y: clampedY });
    }
  };

  const handleConfirm = () => {
    if (!containerRef.current || !imageRef.current) {
      onConfirm(imageUrl);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Kích thước ảnh xuất ra (512x512 là chuẩn đẹp cho Avatar)
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const container = containerRef.current;
      const image = imageRef.current;

      // mask là h-[90%] của container
      const maskSize = container.clientHeight * 0.9;
      // Tỷ lệ phóng từ màn hình lên Canvas
      const renderScale = outputSize / maskSize;

      const cx = outputSize / 2;
      const cy = outputSize / 2;

      // Đưa gốc tọa độ ra giữa Canvas
      ctx.translate(cx, cy);
      // Phóng to theo tỷ lệ Canvas / Mask
      ctx.scale(renderScale, renderScale);
      // Dịch chuyển theo vị trí kéo thả của user
      ctx.translate(position.x, position.y);
      // Zoom
      ctx.scale(zoom / 100, zoom / 100);
      // Xoay
      ctx.rotate((rotation * Math.PI) / 180);

      // Vẽ ảnh gốc vào canvas (Kích thước layout hiển thị trên màn hình)
      const imageW = image.offsetWidth;
      const imageH = image.offsetHeight;

      ctx.drawImage(image, -imageW / 2, -imageH / 2, imageW, imageH);

      // Xuất ra Base64 định dạng JPEG chất lượng cao (95%)
      const base64Image = canvas.toDataURL('image/jpeg', 0.95);
      onConfirm(base64Image);
    } catch (error) {
      console.error("Lỗi khi cắt ảnh:", error);
      // Dự phòng nếu lỗi (VD: lỗi CORS) thì trả về ảnh gốc
      onConfirm(imageUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b border-black/5 relative flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute left-6 text-brand-text/40 hover:text-brand-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-brand-text">Chỉnh sửa ảnh</h3>
        </div>

        {/* Image Preview Area */}
        <div className="px-6 pt-6 pb-2">
          <div
            ref={containerRef}
            className="w-full aspect-[4/3] bg-black/5 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-move touch-none border border-black/5"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {imageUrl ? (
              <img
                ref={imageRef}
                crossOrigin="anonymous"
                src={imageUrl}
                alt="Crop preview"
                draggable="false"
                className={`absolute top-1/2 left-1/2 min-w-full min-h-full max-w-none origin-center ${isDragging ? '' : 'transition-transform duration-200'}`}
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom / 100}) rotate(${rotation}deg)`
                }}
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-black/20 relative z-10" />
            )}

            {/* Circular Mask Overlay */}
            <div
              className="absolute h-[90%] aspect-square rounded-full pointer-events-none"
              style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' }}
            ></div>
            <div className="absolute h-[90%] aspect-square rounded-full border-2 border-white/80 pointer-events-none shadow-inner"></div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 py-5 flex items-center justify-between gap-6">
          {/* Zoom Control */}
          <div className="flex items-center gap-4 flex-1">
            <ImageIcon className="w-5 h-5 text-brand-text/40" />
            <input
              type="range"
              min="100"
              max="300"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
            <ImageIcon className="w-6 h-6 text-brand-text/60" />
          </div>

          {/* Rotate Control */}
          <button
            onClick={() => setRotation(r => r + 90)}
            className="text-brand-text/60 hover:text-brand-text transition-colors"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between">
          <button
            onClick={() => { setZoom(100); setRotation(0); setPosition({ x: 0, y: 0 }); }}
            className="text-brand-primary font-bold hover:text-brand-text transition-colors text-sm"
          >
            Làm lại
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white border border-black/5 text-brand-text font-bold hover:bg-black/5 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-2.5 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors text-sm shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
