
import React from "react";
import { Button } from "@/components/ui/button";

interface ContentListProps {
  contents: any[];
  onFinalize?: (id: string) => void;
  onSchedule?: (id: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({ contents, onFinalize, onSchedule }) => (
  <ul className="space-y-3">
    {contents.map((item) => (
      <li key={item.id} className="border rounded px-3 py-2 flex justify-between items-center">
        <span>{item.title || item.topic}</span>
        <div className="flex gap-2">
          {onFinalize && <Button size="sm" variant="outline" onClick={() => onFinalize(item.id)}>Finalize</Button>}
          {onSchedule && <Button size="sm" onClick={() => onSchedule(item.id)}>Schedule</Button>}
        </div>
      </li>
    ))}
  </ul>
);

export default ContentList;
