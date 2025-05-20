
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentPost } from '@/lib/types';
import { Edit } from "lucide-react";

interface DraftsListProps {
  drafts: ContentPost[];
  handleFinalizeDraft: (id: string) => void;
}

/**
 * Component for displaying a list of draft posts
 */
const DraftsList: React.FC<DraftsListProps> = ({ drafts, handleFinalizeDraft }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Your Drafts</CardTitle>
        <CardDescription>Review or finalize your drafts below.</CardDescription>
      </CardHeader>
      <CardContent>
        {drafts && drafts.length > 0 ? (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.id} className="border rounded px-3 py-2 flex justify-between items-center">
                <span>{draft.title || draft.topic}</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleFinalizeDraft(draft.id)}
                  >
                    Finalize
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    asChild
                  >
                    <Link to={`/generator?edit=${draft.id}`}>
                      <Edit className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-gray-500">No drafts found. Generate new content to save as drafts.</span>
        )}
      </CardContent>
    </Card>
  );
};

export default DraftsList;
