import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Camera, RefreshCw, CheckCircle, ScanFace, AlertCircle } from 'lucide-react';

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
      setCameraError('Unable to access webcam. Please ensure camera permissions are granted in your browser.');
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
        <div className="w-full p-4 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      ) : (
        <div className="relative w-full max-w-md aspect-4/3 bg-[#212121] rounded-2xl overflow-hidden border-2 border-[#0D7377] shadow-2xl shadow-black/80">
          {!capturedUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              
              {/* Biometric Target Face Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-64 border-2 border-[#14FFEC]/40 rounded-[36px] shadow-2xl shadow-[#14FFEC]/20 overflow-hidden">
                  {/* Corner Reticle Accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#14FFEC]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#14FFEC]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#14FFEC]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#14FFEC]" />
                  
                  {/* Moving Cyan Laser Scanner Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#14FFEC] to-transparent shadow-lg shadow-[#14FFEC] animate-scan-laser" />
                </div>
              </div>

              {/* Status Pill */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#212121]/90 text-[#14FFEC] border border-[#0D7377] text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-md">
                  <ScanFace className="w-3.5 h-3.5 animate-pulse" />
                  Align face inside frame
                </span>
              </div>
            </>
          ) : (
            <div className="relative w-full h-full">
              <img src={capturedUrl} alt="Captured face" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/50 text-xs font-bold rounded-lg shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" /> Captured
                </span>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 w-full justify-center">
        {!capturedUrl ? (
          <Button onClick={capturePhoto} variant="primary" className="w-full max-w-xs" icon={<Camera className="w-4 h-4" />}>
            Capture Biometric Frame
          </Button>
        ) : (
          <div className="flex gap-2 w-full max-w-xs">
            <Button onClick={retakePhoto} variant="secondary" className="w-1/2" icon={<RefreshCw className="w-4 h-4" />}>
              Retake
            </Button>
            <Button onClick={confirmPhoto} variant="primary" className="w-1/2" icon={<CheckCircle className="w-4 h-4" />}>
              Verify Face
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
