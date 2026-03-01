
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface LlmProviderOption {
  label: string;
  value: string;
}

interface ApiKeySettingsProps {
  llmProviderOptions: LlmProviderOption[];
}

export const ApiKeySettings = ({ llmProviderOptions }: ApiKeySettingsProps) => {
  const [llmProvider, setLlmProvider] = useState(() => 
    localStorage.getItem("llmProvider") || "openai"
  );
  const [llmApiKey, setLlmApiKey] = useState(() => 
    localStorage.getItem("llmApiKey") || ""
  );
  const [keySaved, setKeySaved] = useState(false);

  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("llmProvider", llmProvider);
    localStorage.setItem("llmApiKey", llmApiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="space-y-2 pt-2">
      <Label htmlFor="llmProvider">AI Provider</Label>
      <Select
        value={llmProvider}
        onValueChange={setLlmProvider}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select AI Provider" />
        </SelectTrigger>
        <SelectContent>
          {llmProviderOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label htmlFor="llmApiKey" className="mt-3">API Key for {llmProvider === "openai" ? "OpenAI" : "Gemini"}</Label>
      <Input
        id="llmApiKey"
        name="llmApiKey"
        type="text"
        value={llmApiKey}
        placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API Key`}
        onChange={e => setLlmApiKey(e.target.value)}
        className="w-full"
      />
      <form onSubmit={handleApiKeySave}>
        <Button type="submit" size="sm" className="mt-2">Save API Key</Button>
        {keySaved && <span className="text-green-600 text-sm ml-3">Key saved!</span>}
      </form>
      <div className="text-xs text-muted-foreground mt-1">
        Your API key is stored locally in your browser only.
      </div>
    </div>
  );
};

export default ApiKeySettings;
