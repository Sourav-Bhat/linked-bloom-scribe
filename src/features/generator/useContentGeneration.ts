
import { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentPost, GenerationParams } from '@/lib/types';
import {
  saveGeneratedContent,
  getContent,
  updateContent,
  getUserContents
} from '@/features/generator/contentService';

/**
 * Custom hook for content generation functionality
 */
const useContentGeneration = (userId: string | undefined) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editPostId = searchParams.get('edit');

  // Form and content states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Partial<ContentPost> | null>(null);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);
  const [formData, setFormData] = useState<GenerationParams>({
    topic: "",
    tone: "professional",
    instructions: "",
    includeHashtags: true,
    postLength: "medium",
  });
  
  // Edit states
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Load existing content if in edit mode
  useEffect(() => {
    async function loadEditContent() {
      if (userId && editPostId) {
        setIsLoading(true);
        setEditMode(true);
        try {
          const postData = await getContent(userId, editPostId);
          if (postData) {
            // Create a type-safe version of the post data
            const typedPostData: Partial<ContentPost> = {
              ...postData,
              status: postData.status as ContentPost['status']
            };
            
            setGeneratedContent(typedPostData);
            setEditedTitle(typedPostData.title || "");
            setEditedContent(typedPostData.content || "");
            setEditedHashtags(typedPostData.hashtags || "");
            setFormData({
              topic: typedPostData.topic || "",
              tone: typedPostData.tone || "professional",
              instructions: typedPostData.instructions || "",
              includeHashtags: Boolean(typedPostData.hashtags),
              postLength: typedPostData.postLength as "short" | "medium" | "long" || "medium",
            });
            setIsEditing(true);
          }
        } catch (error) {
          console.error("Error loading post data:", error);
          toast({
            title: "Error",
            description: "Failed to load post data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadEditContent();
  }, [userId, editPostId, toast]);

  // Load drafts
  useEffect(() => {
    async function loadDrafts() {
      if (userId) {
        try {
          const userDrafts = await getUserContents(userId);
          setDrafts(userDrafts as ContentPost[]);
        } catch (error) {
          console.error("Error loading drafts:", error);
          toast({
            title: "Error",
            description: "Failed to load drafts. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
    loadDrafts();
  }, [userId, toast]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Submit handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          topic: formData.topic,
          tone: formData.tone,
          instructions: formData.instructions,
          includeHashtags: formData.includeHashtags,
          postLength: formData.postLength,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generatedPost: Partial<ContentPost> = {
        title: data.title,
        content: data.content,
        hashtags: data.hashtags || "",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId,
        topic: formData.topic,
        tone: formData.tone,
        instructions: formData.instructions,
        postLength: formData.postLength as "short" | "medium" | "long",
      };

      setGeneratedContent(generatedPost);
      setEditedTitle(generatedPost.title || "");
      setEditedContent(generatedPost.content || "");
      setEditedHashtags(generatedPost.hashtags || "");
      toast({
        title: "Content Generated",
        description: "Your LinkedIn post is ready. Edit it before saving.",
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRegenerateContent = async () => {
    if (!userId) return;
    
    setIsGenerating(true);
    try {
      // Save current version before regenerating
      const currentVersion = {
        date: new Date().toISOString(),
        content: isEditing ? editedContent : (generatedContent?.content || ""),
        hashtags: isEditing ? editedHashtags : (generatedContent?.hashtags || ""),
      };

      // Get existing versions or create a new array
      const existingVersions = generatedContent?.versions || [];

      const previousContent = isEditing ? editedContent : (generatedContent?.content || "");

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          topic: formData.topic,
          tone: formData.tone,
          instructions: formData.instructions,
          includeHashtags: formData.includeHashtags,
          postLength: formData.postLength,
          regeneratePrompt,
          previousContent,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const regeneratedPost: Partial<ContentPost> = {
        ...generatedContent,
        title: data.title,
        content: data.content,
        hashtags: data.hashtags || "",
        status: "draft",
        updated_at: new Date().toISOString(),
        user_id: userId,
        topic: formData.topic,
        tone: formData.tone,
        instructions: regeneratePrompt,
        versions: [...existingVersions, currentVersion],
      };

      setGeneratedContent(regeneratedPost);
      setEditedTitle(regeneratedPost.title || "");
      setEditedContent(regeneratedPost.content || "");
      setEditedHashtags(regeneratedPost.hashtags || "");
      setRegeneratePrompt("");
      toast({
        title: "Content Regenerated",
        description: "Your post has been updated with the new instructions.",
      });
    } catch (error: any) {
      console.error("Error regenerating content:", error);
      toast({
        title: "Regeneration Failed",
        description: error?.message || "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!userId || !generatedContent) return;
    
    try {
      const contentToSave = isEditing ? {
        ...generatedContent,
        title: editedTitle,
        content: editedContent,
        hashtags: editedHashtags,
        updated_at: new Date().toISOString(),
        topic: formData.topic,
        tone: formData.tone,
        instructions: formData.instructions,
        postLength: formData.postLength
      } : {
        ...generatedContent,
        topic: formData.topic,
        tone: formData.tone,
        instructions: formData.instructions,
        postLength: formData.postLength
      };
      
      if (editMode && editPostId) {
        // Update existing content
        await updateContent(userId, editPostId, contentToSave);
        
        toast({ 
          title: "Post Updated", 
          description: "Your content has been updated successfully." 
        });
      } else {
        // Save new content
        await saveGeneratedContent(userId, contentToSave);
        
        toast({ 
          title: "Draft Saved", 
          description: "Your content has been saved as a draft." 
        });
      }
      
      // Reset state after saving
      setGeneratedContent(null);
      setEditedTitle("");
      setEditedContent("");
      setEditedHashtags("");
      setIsEditing(false);
      setEditMode(false);
      setFormData({
        topic: "",
        tone: "professional",
        instructions: "",
        includeHashtags: true,
        postLength: "medium",
      });
      
      // Reload drafts
      const updatedDrafts = await getUserContents(userId);
      setDrafts(updatedDrafts as ContentPost[]);
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  // UI state handlers
  const toggleEditMode = () => {
    if (!isEditing && generatedContent) {
      setEditedTitle(generatedContent.title || "");
      setEditedContent(generatedContent.content || "");
      setEditedHashtags(generatedContent.hashtags || "");
    }
    setIsEditing(!isEditing);
  };

  return {
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
    toggleEditMode
  };
};

export default useContentGeneration;
