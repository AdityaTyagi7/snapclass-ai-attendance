import React, { useState } from 'react';
import { Subject, ScanResult, AttendanceLogEntry } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { attendanceApi } from '../../api/attendanceApi';
import { AudioRecorder } from './AudioRecorder';
import {
  Camera,
  Mic,
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Trash2,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface TakeAttendanceWizardProps {
  subjects: Subject[];
  onAttendanceCompleted: () => void;
}

export const TakeAttendanceWizard: React.FC<TakeAttendanceWizardProps> = ({
  subjects,
  onAttendanceCompleted,
}) => {
  const { toast } = useToast();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(
    subjects.length > 0 ? subjects[0].subject_id : 0
  );
  const [mode, setMode] = useState<'photos' | 'voice'>('photos');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<Blob | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [results, setResults] = useState<ScanResult[]>([]);
  const [logsToConfirm, setLogsToConfirm] = useState<AttendanceLogEntry[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...filesArr]);
      const newUrls = filesArr.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const runFaceAnalysis = async () => {
    if (!selectedSubjectId) {
      toast({ type: 'warning', title: 'Subject Required', description: 'Please select a subject' });
      return;
    }
    if (photos.length === 0) {
      toast({ type: 'warning', title: 'Photos Required', description: 'Please upload at least one photo' });
      return;
    }

    setStep(2);
    setIsLoading(true);
    try {
      const res = await attendanceApi.scanFacePhotos(selectedSubjectId, photos);
      if (res.message) {
        toast({ type: 'info', title: 'Scan Info', description: res.message });
      }
      setResults(res.results || []);
      setLogsToConfirm(res.logs || []);
      setStep(3);
    } catch (err: any) {
      toast({ type: 'error', title: 'Analysis Error', description: err.message });
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const runVoiceAnalysis = async () => {
    if (!selectedSubjectId) {
      toast({ type: 'warning', title: 'Subject Required', description: 'Please select a subject' });
      return;
    }
    if (!audioFile) {
      toast({ type: 'warning', title: 'Audio Required', description: 'Please record audio first' });
      return;
    }

    setStep(2);
    setIsLoading(true);
    try {
      const res = await attendanceApi.scanVoiceAudio(selectedSubjectId, audioFile);
      setResults(res.results || []);
      setLogsToConfirm(res.logs || []);
      setStep(3);
    } catch (err: any) {
      toast({ type: 'error', title: 'Voice Scan Error', description: err.message });
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentStatus = (studentId: number) => {
    setResults((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? {
              ...r,
              is_present: !r.is_present,
              status: !r.is_present ? 'Present' : 'Absent',
            }
          : r
      )
    );

    setLogsToConfirm((prev) =>
      prev.map((l) => (l.student_id === studentId ? { ...l, is_present: !l.is_present } : l))
    );
  };

  const handleConfirmAttendance = async () => {
    if (logsToConfirm.length === 0) return;
    setIsLoading(true);
    try {
      await attendanceApi.confirmAttendance(logsToConfirm);
      toast({ type: 'success', title: 'Attendance Saved', description: 'Attendance logs recorded successfully!' });
      resetWizard();
      onAttendanceCompleted();
    } catch (err: any) {
      toast({ type: 'error', title: 'Save Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setPhotos([]);
    setPhotoPreviews([]);
    setAudioFile(null);
    setResults([]);
    setLogsToConfirm([]);
    setStep(1);
  };

  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Cpu className="w-5 h-5 text-white" />
              Take AI Attendance Scan
            </CardTitle>
            <CardDescription>
              Scan classroom photos or audio recordings to automatically detect present students
            </CardDescription>
          </div>
          {step === 3 && (
            <Button variant="outline" size="sm" onClick={resetWizard} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Start Over
            </Button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#27272a]">
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 1 ? 'text-white font-semibold' : 'text-[#a1a1aa]'}`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-white text-black' : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'}`}>1</span>
            <span>Setup & Upload</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#3f3f46]" />
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 2 ? 'text-white font-semibold' : 'text-[#a1a1aa]'}`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-white text-black' : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'}`}>2</span>
            <span>AI Processing</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#3f3f46]" />
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 3 ? 'text-white font-semibold' : 'text-[#a1a1aa]'}`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-white text-black' : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'}`}>3</span>
            <span>Review & Save</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* STEP 1: Setup & Upload */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Subject Selector & Mode Switch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                  Course Subject
                </label>
                <select
                  className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition cursor-pointer"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                >
                  {subjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_id}>
                      {sub.name} ({sub.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                  Detection Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('photos')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      mode === 'photos'
                        ? 'bg-white text-black font-semibold shadow-xs'
                        : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:text-white'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Face Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('voice')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      mode === 'voice'
                        ? 'bg-white text-black font-semibold shadow-xs'
                        : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    Voice Audio
                  </button>
                </div>
              </div>
            </div>

            {/* Mode A: Photo Uploader */}
            {mode === 'photos' && (
              <div className="space-y-4">
                <div className="p-8 border-2 border-dashed border-[#27272a] rounded-xl bg-[#18181b]/30 text-center hover:bg-[#18181b]/60 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-10 h-10 mx-auto rounded-xl bg-[#18181b] border border-[#27272a] text-white flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Upload Classroom Photos</h4>
                  <p className="text-xs text-[#a1a1aa] mt-1">
                    Drag and drop or click to select classroom photos
                  </p>
                </div>

                {photoPreviews.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-2">
                      Selected Photos ({photoPreviews.length})
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {photoPreviews.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#27272a] aspect-4/3">
                          <img src={url} alt={`Class photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={runFaceAnalysis}
                    variant="default"
                    disabled={photos.length === 0}
                    icon={<Cpu className="w-4 h-4" />}
                  >
                    Run Face Analysis
                  </Button>
                </div>
              </div>
            )}

            {/* Mode B: Voice Recorder */}
            {mode === 'voice' && (
              <div className="space-y-4">
                <AudioRecorder
                  onAudioRecorded={(blob) => setAudioFile(blob)}
                  label="Record classroom audio of students answering roll call"
                />

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={runVoiceAnalysis}
                    variant="default"
                    disabled={!audioFile}
                    icon={<Cpu className="w-4 h-4" />}
                  >
                    Run Voice Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Loading State */}
        {step === 2 && (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-xl bg-white text-black flex items-center justify-center animate-pulse">
              <Cpu className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">Extracting Feature Vectors...</h3>
            <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
              Running {mode === 'photos' ? 'dlib spatial landmark pose model' : 'Resemblyzer PyTorch voice encoder'} to identify present students...
            </p>
          </div>
        )}

        {/* STEP 3: Review Results Table */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 bg-[#18181b] rounded-xl border border-[#27272a]">
              <div>
                <span className="text-xs text-[#a1a1aa] uppercase tracking-wider">Subject:</span>
                <span className="text-sm font-semibold text-white ml-2">
                  {selectedSubject?.name} ({selectedSubject?.subject_code})
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="default">
                  Present: {results.filter((r) => r.is_present).length}
                </Badge>
                <Badge variant="secondary">
                  Absent: {results.filter((r) => !r.is_present).length}
                </Badge>
              </div>
            </div>

            {/* Verification Table */}
            <div className="border border-[#27272a] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#18181b]/50 text-[#a1a1aa] text-xs uppercase tracking-wider font-semibold border-b border-[#27272a]">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Detection Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-sm text-[#fafafa]">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#a1a1aa] text-xs">
                        No enrolled students found in this subject
                      </td>
                    </tr>
                  ) : (
                    results.map((r) => (
                      <tr key={r.student_id} className="hover:bg-[#18181b]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-[#a1a1aa]">#{r.student_id}</td>
                        <td className="py-3 px-4 font-medium text-white">{r.name}</td>
                        <td className="py-3 px-4 text-xs text-[#a1a1aa]">{r.source || '-'}</td>
                        <td className="py-3 px-4">
                          {r.is_present ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3 text-black" /> Present
                            </Badge>
                          ) : (
                            <Badge variant="error" className="gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" /> Absent
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(r.student_id)}
                            className="text-xs font-semibold text-white hover:underline transition cursor-pointer"
                          >
                            Mark as {r.is_present ? 'Absent' : 'Present'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetWizard}>
                Discard
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmAttendance}
                isLoading={isLoading}
                icon={<Save className="w-4 h-4" />}
                disabled={results.length === 0}
              >
                Confirm & Save Logs
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
