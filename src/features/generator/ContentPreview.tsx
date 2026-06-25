
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentPost } from '@/lib/types';
import { RefreshCw, Edit, Check, Save, Copy, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  toLinkedInText,
  buildCopyText,
  countWords,
  isWithinBand,
  LENGTH_BANDS,
  LINKEDIN_FOLD_CHARS,
  type PostLength,
} from "@/lib/postFormat";

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
 * Preview + edit generated content.
 * Shows a LinkedIn-accurate preview (Unicode formatting, "…see more" fold),
 * a one-click Copy button, and a word-count badge against the chosen length.
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
  editMode,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!generatedContent) return null;

  const rawContent = isEditing ? editedContent : generatedContent.content || "";
  const rawHashtags = includeHashtags ? (isEditing ? editedHashtags : generatedContent.hashtags || "") : "";
  const title = isEditing ? editedTitle : generatedContent.title || "";

  const linkedInBody = toLinkedInText(rawContent);
  const words = countWords(rawContent);
  const length = (generatedContent.postLength as PostLength) || "medium";
  const band = LENGTH_BANDS[length];
  const withinBand = isWithinBand(words, length);

  const needsFold = linkedInBody.length > LINKEDIN_FOLD_CHARS;
  const shownBody = !expanded && needsFold
    ? linkedInBody.slice(0, LINKEDIN_FOLD_CHARS).trimEnd()
    : linkedInBody;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(rawContent, rawHashtags));
      setCopied(true);
      toast({ title: "Copied", description: "LinkedIn-ready post copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access. Select and copy manually.",
        variant: "destructive",
      });
    }
  };

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
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{editMode ? "Review and edit your content" : "Exactly how it will look on LinkedIn"}</span>
          <Badge
            variant={withinBand ? "secondary" : "destructive"}
            title={`Target: ${band.min}–${band.max} words`}
          >
            {words} words · {withinBand ? "on target" : `aim ${band.min}–${band.max}`}
          </Badge>
        </div>
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
          // LinkedIn-style preview card
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-muted" aria-hidden />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Your Name</div>
                <div className="text-xs text-muted-foreground">Your headline · Now</div>
              </div>
            </div>
            {title && <h3 className="font-semibold mb-1">{toLinkedInText(title)}</h3>}
            <div className="whitespace-pre-wrap text-sm text-foreground/90 break-words">
              {shownBody}
              {!expanded && needsFold && (
                <>
                  …{" "}
                  <button
                    type="button"
                    className="text-muted-foreground hover:underline font-medium"
                    onClick={() => setExpanded(true)}
                  >
                    see more
                  </button>
                </>
              )}
            </div>
            {rawHashtags && (
              <div className="mt-3 text-sm text-[#0a66c2] break-words">{rawHashtags}</div>
            )}
          </div>
        )}

        {!isEditing && (
          <Button onClick={handleCopy} className="w-full sm:w-auto" disabled={!linkedInBody}>
            {copied ? <CheckCheck className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy for LinkedIn"}
          </Button>
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
          {editMode ? "Update" : "Save as draft"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContentPreview;
