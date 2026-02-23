import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface StepOneData {
  industry: string;
  experienceRange: string;
  location: string;
  futureGoal: string;
  linkedinUrl: string;
}

interface StepOneProps {
  data: StepOneData;
  onChange: (data: StepOneData) => void;
  errors: Partial<Record<keyof StepOneData, string>>;
}

const INDUSTRIES = [
  "Technology", "Finance", "Marketing", "Consulting", "Healthcare",
  "Education", "Legal", "Real Estate", "Retail", "Manufacturing", "Media", "Other",
];

const EXPERIENCE_OPTIONS = [
  { value: "0-3", label: "0-3 years" },
  { value: "4-7", label: "4-7 years" },
  { value: "8-15", label: "8-15 years" },
  { value: "15+", label: "15+ years" },
];

const StepOne = ({ data, onChange, errors }: StepOneProps) => {
  const charCount = data.futureGoal.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">Tell us about your professional world</h2>
        <p className="text-muted-foreground mt-1">
          This helps us calibrate your content to your actual experience level and industry.
        </p>
      </div>

      <div className="space-y-5">
        {/* LinkedIn Profile */}
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">Your LinkedIn Profile URL</Label>
          <Input
            id="linkedinUrl"
            value={data.linkedinUrl}
            onChange={(e) => onChange({ ...data, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/your-profile"
            className={errors.linkedinUrl ? "border-destructive" : ""}
          />
          {errors.linkedinUrl && <p className="text-sm text-destructive">{errors.linkedinUrl}</p>}
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={data.industry}
            onValueChange={(val) => onChange({ ...data, industry: val })}
          >
            <SelectTrigger id="industry" className={errors.industry ? "border-destructive" : ""}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i.toLowerCase().replace(/\s+/g, "-")}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
        </div>

        {/* Years of Experience */}
        <div className="space-y-3">
          <Label>Years of Experience</Label>
          <RadioGroup
            value={data.experienceRange}
            onValueChange={(val) => onChange({ ...data, experienceRange: val })}
            className="flex flex-wrap gap-3"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors ${
                  data.experienceRange === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
          {errors.experienceRange && <p className="text-sm text-destructive">{errors.experienceRange}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
            placeholder="City, Country -- e.g. Dubai, UAE"
            className={errors.location ? "border-destructive" : ""}
          />
          {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
        </div>

        {/* Future Goal */}
        <div className="space-y-2">
          <Label htmlFor="futureGoal">Where do you want to be professionally in 2 years?</Label>
          <Textarea
            id="futureGoal"
            value={data.futureGoal}
            onChange={(e) => {
              if (e.target.value.length <= 150) {
                onChange({ ...data, futureGoal: e.target.value });
              }
            }}
            placeholder="e.g. Move into a VP role, launch my own consultancy, become a recognised voice in sustainable finance"
            className={`min-h-[80px] ${errors.futureGoal ? "border-destructive" : ""}`}
          />
          <div className="flex justify-between">
            {errors.futureGoal && <p className="text-sm text-destructive">{errors.futureGoal}</p>}
            <p className={`text-xs ml-auto ${charCount >= 150 ? "text-destructive" : "text-muted-foreground"}`}>
              {charCount}/150
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;
