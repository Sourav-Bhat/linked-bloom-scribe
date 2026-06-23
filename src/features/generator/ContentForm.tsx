
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { GenerationParams } from '@/lib/types';

interface ContentFormProps {
  formData: GenerationParams;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  editMode: boolean;
  handleSaveContent: () => void;
}

/**
 * Form component for content generation parameters
 */
const ContentForm: React.FC<ContentFormProps> = ({
  formData,
  handleChange,
  handleSelectChange,
  handleCheckboxChange,
  handleSubmit,
  isGenerating,
  editMode,
  handleSaveContent
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? "Edit Post" : "Create New LinkedIn Post"}</CardTitle>
        <CardDescription>
          {editMode 
            ? "Modify your existing LinkedIn post" 
            : "Generate a professional LinkedIn post based on your specifications"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Post Topic</Label>
            <Input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g., AI in Product Management"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={formData.instructions || ''}
              onChange={handleChange}
              placeholder="Any specific points you'd like to include..."
              className="min-h-[100px] max-h-[200px]"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Content Tone</Label>
              <Select
                value={formData.tone}
                onValueChange={(value) => handleSelectChange("tone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postLength">Post Length</Label>
              <Select
                value={formData.postLength}
                onValueChange={(value) => handleSelectChange("postLength", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="short">Short (50-100 words)</SelectItem>
                  <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                  <SelectItem value="long">Long (200-300 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeHashtags"
              name="includeHashtags"
              checked={formData.includeHashtags}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="includeHashtags" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Include relevant hashtags
            </Label>
          </div>
        </CardContent>
        
        <CardFooter>
          {!editMode ? (
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? "Generating..." : "Generate Post"}
            </Button>
          ) : (
            <Button type="button" onClick={handleSaveContent} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Update Post
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContentForm;
