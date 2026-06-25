import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Save, Sparkles } from "lucide-react";
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

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "storytelling", label: "Storytelling" },
  { value: "conversational", label: "Conversational" },
];
const LENGTHS = [
  { value: "short", label: "Short", hint: "50–100w" },
  { value: "medium", label: "Medium", hint: "100–200w" },
  { value: "long", label: "Long", hint: "200–300w" },
];

const Segmented = ({
  options, value, onChange,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 min-w-[90px] rounded-lg border px-3 py-2.5 text-center text-[13px] font-semibold transition-colors",
            active
              ? "border-violet-600 bg-violet-50 text-violet-600"
              : "border-brand-200 bg-white text-brand-600 hover:border-violet-600/40",
          )}
        >
          {o.label}
          {o.hint && <small className={cn("mt-0.5 block text-[11px] font-medium", active ? "text-violet-600" : "text-brand-400")}>{o.hint}</small>}
        </button>
      );
    })}
  </div>
);

const ContentForm: React.FC<ContentFormProps> = ({
  formData, handleChange, handleSelectChange, handleCheckboxChange, handleSubmit, isGenerating, editMode, handleSaveContent,
}) => {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-brand-1">
      <h2 className="text-[17px] font-semibold tracking-tight">{editMode ? "Edit post" : "Create a post"}</h2>
      <p className="mt-1 text-sm text-brand-500">
        {editMode ? "Modify your existing LinkedIn post." : "Persona-aware drafts that sound like you — never generic."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="topic">What's the post about?</Label>
          <Textarea id="topic" name="topic" value={formData.topic} onChange={handleChange}
            placeholder="e.g., A hard lesson from a hire that didn't work out…" className="min-h-[80px]" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Special instructions <span className="font-normal text-brand-400">(optional)</span></Label>
          <Textarea id="instructions" name="instructions" value={formData.instructions || ''} onChange={handleChange}
            placeholder="Any specific points, angles or data to include…" className="min-h-[72px]" />
        </div>

        <div className="space-y-2">
          <Label>Voice</Label>
          <Segmented options={TONES} value={formData.tone} onChange={(v) => handleSelectChange("tone", v)} />
        </div>

        <div className="space-y-2">
          <Label>Length</Label>
          <Segmented options={LENGTHS} value={formData.postLength} onChange={(v) => handleSelectChange("postLength", v)} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" id="includeHashtags" name="includeHashtags" checked={formData.includeHashtags}
            onChange={handleCheckboxChange} className="h-4 w-4 rounded border-brand-300 text-violet-600 focus:ring-violet-500" />
          <span className="text-sm font-medium text-brand-700">Include relevant hashtags</span>
        </label>

        {!editMode ? (
          <Button type="submit" disabled={isGenerating} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating…" : "Generate post"}
          </Button>
        ) : (
          <Button type="button" onClick={handleSaveContent} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Update post
          </Button>
        )}
      </form>
    </div>
  );
};

export default ContentForm;
