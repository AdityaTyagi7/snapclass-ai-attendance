import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

interface CameraModalProps {
  onCapture: (file: File, previewUrl: string) => void;
  onCancel?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError('Unable to access webcam. Please ensure camera permissions are allowed.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'face_capture.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setCapturedFile(file);
        setCapturedUrl(url);
      }
    }, 'image/jpeg');
  };

  const retakePhoto = () => {
    setCapturedUrl(null);
    setCapturedFile(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedFile && capturedUrl) {
      onCapture(capturedFile, capturedUrl);
      stopCamera();
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {cameraError ? (
        <div className="w-full p-4 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs rounded-xl text-center font-medium">
          {cameraError}
        </div>
      ) : (
        <div className="relative w-full max-w-md aspect-4/3 bg-[#212121] rounded-2xl overflow-hidden border-2 border-[#0D7377] shadow-xl">
          {!capturedUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {/* Target Face Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-dashed border-[#14FFEC] rounded-[40px] shadow-2xl shadow-[#14FFEC]/40 animate-pulse" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="px-3 py-1 bg-[#212121]/90 text-[#14FFEC] border border-[#0D7377] text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-xs">
                  Position face inside box
                </span>
              </div>
            </>
          ) : (
            <img src={capturedUrl} alt="Captured face" className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!capturedUrl ? (
          <Button onClick={capturePhoto} variant="primary" icon={<Camera className="w-4 h-4" />}>
            Capture Photo
          </Button>
        ) : (
          <>
            <Button onClick={retakePhoto} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
              Retake
            </Button>
            <Button onClick={confirmPhoto} variant="primary" icon={<CheckCircle className="w-4 h-4" />}>
              Confirm Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
