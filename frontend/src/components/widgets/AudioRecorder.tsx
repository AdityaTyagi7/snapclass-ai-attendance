import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Mic, Square, RotateCcw, Check, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  label?: string;
}

// Convert AudioBuffer to pristine 16-bit 16kHz Mono WAV Blob
function audioBufferToWav(buffer: AudioBuffer, targetSampleRate = 16000): Blob {
  const numChannels = 1;
  const sourceRate = buffer.sampleRate;
  const sourceChannelData = buffer.getChannelData(0); // mono channel

  let targetData: Float32Array;
  if (sourceRate === targetSampleRate) {
    targetData = sourceChannelData;
  } else {
    // High quality linear interpolation resampler
    const ratio = sourceRate / targetSampleRate;
    const targetLength = Math.round(sourceChannelData.length / ratio);
    targetData = new Float32Array(targetLength);
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i * ratio;
      const lower = Math.floor(sourceIndex);
      const upper = Math.min(lower + 1, sourceChannelData.length - 1);
      const weight = sourceIndex - lower;
      targetData[i] =
        sourceChannelData[lower] * (1 - weight) +
        sourceChannelData[upper] * weight;
    }
  }

  const wavBuffer = new ArrayBuffer(44 + targetData.length * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + targetData.length * 2, true);
  writeString(8, 'WAVE');

  // fmt Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
  view.setUint32(24, targetSampleRate, true); // SampleRate (16000 Hz)
  view.setUint32(28, targetSampleRate * numChannels * 2, true); // ByteRate (16000 * 1 * 2 = 32000)
  view.setUint16(32, numChannels * 2, true); // BlockAlign (2 bytes)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, targetData.length * 2, true);

  // Write 16-bit PCM integer samples
  let offset = 44;
  for (let i = 0; i < targetData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, targetData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  label = 'Record audio (say phrase like "I am present")',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          // Combine recorded chunks
          const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const arrayBuffer = await rawBlob.arrayBuffer();

          // Decode using native Web Audio API
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          // Convert to standardized 16kHz PCM WAV format
          const wavBlob = audioBufferToWav(decodedBuffer, 16000);
          const wavUrl = URL.createObjectURL(wavBlob);

          setAudioUrl(wavUrl);
          onAudioRecorded(wavBlob);
          audioCtx.close();
        } catch (convErr) {
          console.warn('WAV decoding failed, using raw fallback blob:', convErr);
          const fallbackBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const fallbackUrl = URL.createObjectURL(fallbackBlob);
          setAudioUrl(fallbackUrl);
          onAudioRecorded(fallbackBlob);
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
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
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 p-4 bg-[#18181b] border border-[#27272a] rounded-2xl">
      <p className="text-xs text-[#a1a1aa] text-center">{label}</p>

      {isProcessing ? (
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa] py-2">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Processing audio waveform...</span>
        </div>
      ) : !audioUrl ? (
        !isRecording ? (
          <Button type="button" onClick={startRecording} variant="default" icon={<Mic className="w-4 h-4" />}>
            Start Recording
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium rounded-full animate-pulse">
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
          <audio src={audioUrl} controls className="w-full max-w-xs h-10" />
          <div className="flex gap-2">
            <Button type="button" onClick={resetRecording} variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Re-record
            </Button>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white px-3 py-1 bg-[#27272a] rounded-full border border-[#3f3f46]">
              <Check className="w-3.5 h-3.5" /> 16kHz WAV Ready
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
