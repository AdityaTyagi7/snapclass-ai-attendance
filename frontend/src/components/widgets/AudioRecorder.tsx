import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Mic, Square, RotateCcw, Check } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  label?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  label = 'Record audio (say phrase like "I am present")',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onAudioRecorded(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 p-4 bg-[#212121] border border-[#0D7377]/60 rounded-2xl">
      <p className="text-xs font-semibold text-zinc-300 text-center">{label}</p>

      {!audioUrl ? (
        !isRecording ? (
          <Button type="button" onClick={startRecording} variant="primary" icon={<Mic className="w-4 h-4" />}>
            Start Recording
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs font-semibold rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Recording Audio...
            </span>
            <Button type="button" onClick={stopRecording} variant="danger" icon={<Square className="w-4 h-4" />}>
              Stop
            </Button>
          </div>
        )
      ) : (
        <div className="w-full flex flex-col items-center gap-3">
          <audio src={audioUrl} controls className="w-full max-w-xs h-10 accent-[#14FFEC]" />
          <div className="flex gap-2">
            <Button type="button" onClick={resetRecording} variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Re-record
            </Button>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14FFEC] px-3 py-1 bg-[#0D7377]/40 rounded-full border border-[#14FFEC]/40">
              <Check className="w-3.5 h-3.5" /> Ready
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
