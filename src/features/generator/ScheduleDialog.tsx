import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with an ISO datetime string when the user confirms. */
  onConfirm: (isoDate: string) => void | Promise<void>;
  title?: string;
}

/** Default the picker to tomorrow at 09:00 local time. */
function defaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ open, onOpenChange, onConfirm, title }) => {
  const init = defaultDateTime();
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!date || !time) return;
    const iso = new Date(`${date}T${time}`).toISOString();
    setSubmitting(true);
    try {
      await onConfirm(iso);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogDescription>
            {title ? `"${title}" ` : ''}will be added to your content calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Date</Label>
            <Input id="schedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-time">Time</Label>
            <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={submitting || !date || !time}>
            {submitting ? "Scheduling…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
