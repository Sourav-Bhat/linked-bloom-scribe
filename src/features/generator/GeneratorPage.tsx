
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import useAuth from "@/features/auth/useAuth";
import { scheduleContent } from "@/features/generator/contentService";
import { useToast } from "@/hooks/use-toast";
import ContentForm from "@/features/generator/ContentForm";
import ContentPreview from "@/features/generator/ContentPreview";
import DraftsList from "@/features/generator/DraftsList";
import useContentGeneration from "@/features/generator/useContentGeneration";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Generator page for creating LinkedIn content posts
 * Supports creating new content and editing existing drafts
 */
const Generator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Use custom hook for content generation functionality
  const {
    isGenerating,
    isLoading,
    generatedContent,
    drafts,
    formData,
    regeneratePrompt,
    setRegeneratePrompt,
    isEditing,
    editedTitle,
    setEditedTitle,
    editedContent,
    setEditedContent,
    editedHashtags,
    setEditedHashtags,
    editMode,
    handleChange,
    handleSelectChange,
    handleCheckboxChange,
    handleSubmit,
    handleRegenerateContent,
    handleSaveContent,
    toggleEditMode,
    reloadDrafts
  } = useContentGeneration(user?.uid);

  const handleScheduleDraft = async (id: string, isoDate: string) => {
    if (!user) return;

    try {
      await scheduleContent(user.uid, id, isoDate);
      toast({
        title: "Post scheduled",
        description: `Added to your calendar for ${new Date(isoDate).toLocaleString()}.`,
      });
      await reloadDrafts();
    } catch (error) {
      console.error("Error scheduling draft:", error);
      toast({
        title: "Error",
        description: "Failed to schedule the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading post data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{editMode ? "Edit post" : "Generator"}</h1>
        <p className="mt-1 max-w-[60ch] text-brand-500">
          AI ghostwriting that sounds like you — drawn from your persona, pillars and avoid-list, never generic.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[380px_1fr]">
        <div>
          <ContentForm
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleSubmit}
            isGenerating={isGenerating}
            editMode={editMode}
            handleSaveContent={handleSaveContent}
          />
        </div>
        
        <div>
          {generatedContent ? (
            <ContentPreview
              generatedContent={generatedContent}
              isEditing={isEditing}
              toggleEditMode={toggleEditMode}
              editedTitle={editedTitle}
              setEditedTitle={setEditedTitle}
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              editedHashtags={editedHashtags}
              setEditedHashtags={setEditedHashtags}
              regeneratePrompt={regeneratePrompt}
              setRegeneratePrompt={setRegeneratePrompt}
              handleRegenerateContent={handleRegenerateContent}
              handleSaveContent={handleSaveContent}
              isGenerating={isGenerating}
              includeHashtags={formData.includeHashtags}
              editMode={editMode}
            />
          ) : (
            <DraftsList
              drafts={drafts}
              handleScheduleDraft={handleScheduleDraft}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;
