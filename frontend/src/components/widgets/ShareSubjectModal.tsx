import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode } from 'lucide-react';
import { Subject } from '../../types';

interface ShareSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export const ShareSubjectModal: React.FC<ShareSubjectModalProps> = ({
  isOpen,
  onClose,
  subject,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!subject) return null;

  const appDomain = window.location.origin;
  const joinUrl = `${appDomain}/?join-code=${subject.subject_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast({ type: 'success', title: 'Link Copied', description: 'Class invite link copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Share Join Code: ${subject.name}`}
      description="Students can scan the QR code or enter the code to enroll"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Column: Code & Copy */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Subject Join Code</label>
            <div className="mt-1 p-3.5 bg-[#18181b] text-white font-mono text-2xl font-bold rounded-xl text-center tracking-widest border border-[#27272a]">
              {subject.subject_code}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Shareable Invite Link</label>
            <div className="mt-1 p-2.5 bg-[#18181b] text-[#fafafa] text-xs font-mono rounded-xl truncate border border-[#27272a]">
              {joinUrl}
            </div>
          </div>

          <Button
            variant="default"
            onClick={handleCopy}
            className="w-full"
            icon={copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied to Clipboard' : 'Copy Share Link'}
          </Button>
        </div>

        {/* Right Column: QR Code Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#18181b] rounded-2xl border border-[#27272a] text-center">
          <div className="p-3 bg-white rounded-xl shadow-xs">
            <QRCodeSVG value={joinUrl} size={150} level="H" includeMargin={true} />
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#a1a1aa] font-medium">
            <QrCode className="w-3.5 h-3.5 text-white" />
            <span>Scan with mobile camera to enroll</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
