'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { requestEscalation } from '@/lib/api/chat';
import { toast } from 'sonner';

interface EscalationButtonProps {
  sessionId: string;
}

export function EscalationButton({ sessionId }: EscalationButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEscalate = async () => {
    setIsLoading(true);
    try {
      await requestEscalation(sessionId, reason);
      toast.success('Escalation request submitted successfully');
      setOpen(false);
      setReason('');
    } catch (error) {
      toast.error('Failed to submit escalation request');
      console.error('Escalation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Request Human Help
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Human Assistance</DialogTitle>
          <DialogDescription>
            If you need to speak with a human therapist, please provide a brief reason
            for your request. This will help us connect you with the right support.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Briefly describe why you need human assistance..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEscalate} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
