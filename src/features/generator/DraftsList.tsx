
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentPost } from '@/lib/types';
import { Edit, CalendarClock, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ScheduleDialog from "@/features/generator/ScheduleDialog";

interface DraftsListProps {
  drafts: ContentPost[];
  handleScheduleDraft: (id: string, isoDate: string) => void | Promise<void>;
}

/**
 * List of draft posts. Each draft can be Scheduled (→ calendar) or Edited.
 */
const DraftsList: React.FC<DraftsListProps> = ({ drafts, handleScheduleDraft }) => {
  const isMobile = useIsMobile();
  const [scheduling, setScheduling] = useState<ContentPost | null>(null);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Your Drafts</CardTitle>
        <CardDescription>Schedule a draft to add it to your calendar, or keep editing.</CardDescription>
      </CardHeader>
      <CardContent>
        {drafts && drafts.length > 0 ? (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.id} className="border rounded px-3 py-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-medium line-clamp-1">{draft.title || draft.topic}</span>
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      onClick={() => setScheduling(draft)}
                      className="flex-1 sm:flex-none"
                    >
                      <CalendarClock className="h-3 w-3" />
                      {!isMobile && <span className="ml-1">Schedule</span>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1 sm:flex-none"
                    >
                      <Link to={`/generator?edit=${draft.id}`}>
                        <Edit className="h-3 w-3" />
                        {!isMobile && <span className="ml-1">Edit</span>}
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center text-center py-8 gap-2">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No drafts yet</p>
            <p className="text-sm text-muted-foreground">Generate a post and save it to see your drafts here.</p>
          </div>
        )}
      </CardContent>

      <ScheduleDialog
        open={Boolean(scheduling)}
        onOpenChange={(open) => { if (!open) setScheduling(null); }}
        title={scheduling?.title || scheduling?.topic}
        onConfirm={async (iso) => {
          if (scheduling) await handleScheduleDraft(scheduling.id, iso);
          setScheduling(null);
        }}
      />
    </Card>
  );
};

export default DraftsList;
