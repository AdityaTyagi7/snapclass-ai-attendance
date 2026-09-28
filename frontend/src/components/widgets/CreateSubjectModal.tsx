import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { teacherApi } from '../../api/teacherApi';
import { useAuth } from '../../context/AuthContext';
import { BookPlus } from 'lucide-react';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: () => void;
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubjectCreated,
}) => {
  const { teacher } = useAuth();
  const { toast } = useToast();
  const [subjectCode, setSubjectCode] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim() || !name.trim()) {
      toast({ type: 'warning', title: 'Validation Error', description: 'Subject code and name are required' });
      return;
    }
    if (!teacher) return;

    setIsLoading(true);
    try {
      await teacherApi.createSubject({
        subject_code: subjectCode.trim(),
        name: name.trim(),
        section: section.trim() || 'A',
        teacher_id: teacher.teacher_id,
      });
      toast({ type: 'success', title: 'Subject Created', description: `${name} (${subjectCode}) created successfully!` });
      setSubjectCode('');
      setName('');
      setSection('');
      onSubjectCreated();
      onClose();
    } catch (err: any) {
      toast({ type: 'error', title: 'Creation Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Subject" description="Add a new course to manage classroom attendance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject Code"
          placeholder="e.g. CS101 or MATH202"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          required
        />
        <Input
          label="Subject Name"
          placeholder="e.g. Data Structures & Algorithms"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Section / Batch (Optional)"
          placeholder="e.g. Section A or CSE-1"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-3 border-t border-[#212121]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={<BookPlus className="w-4 h-4" />}>
            Create Subject
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
