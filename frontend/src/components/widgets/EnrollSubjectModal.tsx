import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';

interface EnrollSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrolled: () => void;
  defaultCode?: string;
}

export const EnrollSubjectModal: React.FC<EnrollSubjectModalProps> = ({
  isOpen,
  onClose,
  onEnrolled,
  defaultCode = '',
}) => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [subjectCode, setSubjectCode] = useState(defaultCode);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim()) {
      toast({ type: 'warning', title: 'Code Required', description: 'Please enter a valid subject code' });
      return;
    }
    if (!student) return;

    setIsLoading(true);
    try {
      const res = await studentApi.enroll(student.student_id, subjectCode.trim());
      toast({ type: 'success', title: 'Enrolled Successfully', description: res.message || 'Course added to your dashboard!' });
      setSubjectCode('');
      onEnrolled();
      onClose();
    } catch (err: any) {
      toast({ type: 'error', title: 'Enrollment Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Enroll in Subject" description="Enter the subject join code provided by your instructor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject Join Code"
          placeholder="e.g. CS101"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
          required
          autoFocus
        />
        <div className="flex justify-end gap-3 pt-3 border-t border-[#27272a]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="default" isLoading={isLoading} icon={<UserPlus className="w-4 h-4" />}>
            Enroll Now
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
