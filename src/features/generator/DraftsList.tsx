
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentPost } from '@/lib/types';
import { Edit, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DraftsListProps {
  drafts: ContentPost[];
  handleFinalizeDraft: (id: string) => void;
}

/**
 * Component for displaying a list of draft posts
 */
const DraftsList: React.FC<DraftsListProps> = ({ drafts, handleFinalizeDraft }) => {
  const isMobile = useIsMobile();

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
              <li key={draft.id} className="border rounded px-3 py-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-medium line-clamp-1">{draft.title || draft.topic}</span>
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleFinalizeDraft(draft.id)}
                      className="flex-1 sm:flex-none"
                    >
                      {isMobile ? <Check className="h-3 w-3" /> : "Finalize"}
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
          <span className="text-sm text-gray-500">No drafts found. Generate new content to save as drafts.</span>
        )}
      </CardContent>
    </Card>
  );
};

export default DraftsList;
