
import { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getIdToken } from "@/features/auth/authService";
import { ContentPost, GenerationParams } from '@/lib/types';
import {
  saveGeneratedContent,
  getContent,
  updateContent,
  getUserContents
} from '@/features/generator/contentService';

const GENERATE_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL}/generateContent`;

const useContentGeneration = (userId: string | undefined) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editPostId = searchParams.get('edit');

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

  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    async function loadEditContent() {
      if (userId && editPostId) {
        setIsLoading(true);
        setEditMode(true);
        try {
          const postData = await getContent(userId, editPostId);
          if (postData) {
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

  const callGenerateContent = async (body: object) => {
    const token = await getIdToken();
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsGenerating(true);
    try {
      const data = await callGenerateContent({
        topic: formData.topic,
        tone: formData.tone,
        instructions: formData.instructions,
        includeHashtags: formData.includeHashtags,
        postLength: formData.postLength,
      });

      const generatedPost: Partial<ContentPost> = {
        title: data.title,
        content: data.content,
        hashtags: data.hashtags || "",
        status: "draft",
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
      const currentVersion = {
        date: new Date().toISOString(),
        content: isEditing ? editedContent : (generatedContent?.content || ""),
        hashtags: isEditing ? editedHashtags : (generatedContent?.hashtags || ""),
      };

      const existingVersions = generatedContent?.versions || [];
      const previousContent = isEditing ? editedContent : (generatedContent?.content || "");

      const data = await callGenerateContent({
        topic: formData.topic,
        tone: formData.tone,
        instructions: formData.instructions,
        includeHashtags: formData.includeHashtags,
        postLength: formData.postLength,
        regeneratePrompt,
        previousContent,
      });

      const regeneratedPost: Partial<ContentPost> = {
        ...generatedContent,
        title: data.title,
        content: data.content,
        hashtags: data.hashtags || "",
        status: "draft",
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
        await updateContent(userId, editPostId, contentToSave);
        toast({ title: "Post Updated", description: "Your content has been updated successfully." });
      } else {
        await saveGeneratedContent(userId, contentToSave);
        toast({ title: "Draft Saved", description: "Your content has been saved as a draft." });
      }

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
