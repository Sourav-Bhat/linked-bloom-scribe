
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentPost } from '@/lib/types';
import { RefreshCw, Edit, Check, Save } from "lucide-react";

interface ContentPreviewProps {
  generatedContent: Partial<ContentPost> | null;
  isEditing: boolean;
  toggleEditMode: () => void;
  editedTitle: string;
  setEditedTitle: (value: string) => void;
  editedContent: string;
  setEditedContent: (value: string) => void;
  editedHashtags: string;
  setEditedHashtags: (value: string) => void;
  regeneratePrompt: string;
  setRegeneratePrompt: (value: string) => void;
  handleRegenerateContent: () => void;
  handleSaveContent: () => void;
  isGenerating: boolean;
  includeHashtags: boolean;
  editMode: boolean;
}

/**
 * Component for previewing and editing generated content
 */
const ContentPreview: React.FC<ContentPreviewProps> = ({
  generatedContent,
  isEditing,
  toggleEditMode,
  editedTitle,
  setEditedTitle,
  editedContent,
  setEditedContent,
  editedHashtags,
  setEditedHashtags,
  regeneratePrompt,
  setRegeneratePrompt,
  handleRegenerateContent,
  handleSaveContent,
  isGenerating,
  includeHashtags,
  editMode
}) => {
  if (!generatedContent) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{editMode ? "Edit Post" : "Generated Post"}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleEditMode}
            className="flex items-center gap-1"
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">View Preview</span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Content</span>
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          {editMode ? "Review and edit your content" : "Preview your LinkedIn post"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContent">Content</Label>
              <Textarea
                id="editContent"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[150px] sm:min-h-[250px]"
              />
            </div>
            {includeHashtags && (
              <div className="space-y-2">
                <Label htmlFor="editHashtags">Hashtags</Label>
                <Input
                  id="editHashtags"
                  value={editedHashtags}
                  onChange={(e) => setEditedHashtags(e.target.value)}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-lg mb-2">{isEditing ? editedTitle : generatedContent.title}</h3>
            <div className="whitespace-pre-line text-gray-700 max-h-[300px] overflow-y-auto">
              {isEditing ? editedContent : generatedContent.content}
            </div>
            {includeHashtags && (
              <div className="mt-4 text-blue-600">
                {isEditing ? editedHashtags : generatedContent.hashtags}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="regeneratePrompt">Regenerate with additional instructions</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Textarea
                id="regeneratePrompt"
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Add instructions to refine the post..."
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleRegenerateContent}
                disabled={isGenerating || regeneratePrompt.trim() === ""}
                className="self-end whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={handleSaveContent} 
          className="flex items-center gap-1 w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {editMode ? "Update" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContentPreview;
