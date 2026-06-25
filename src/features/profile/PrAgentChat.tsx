import { useState, useEffect, useRef } from "react";
import {
  collection, getDocs, deleteDoc, addDoc, query, orderBy,
} from 'firebase/firestore';
import { useNavigate } from "react-router-dom";
import { db } from '@/lib/firebase';
import { getIdToken } from '@/features/auth/authService';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Trash2, PenLine } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL}/prAgentChat`;

// Number of prior turns sent to the model for continuity.
const HISTORY_TURNS = 20;

const MODES: Array<{ id: string; label: string; blurb: string; prompts: string[] }> = [
  {
    id: "discovery",
    label: "Discovery",
    blurb: "Let's go deeper on who you are and what you stand for.",
    prompts: ["Help me sharpen my positioning", "What makes my POV different?", "Interview me about my expertise"],
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    blurb: "Let's find sharp angles worth posting this week.",
    prompts: ["Give me 3 post angles", "What's a contrarian take I could share?", "Turn my week into a post idea"],
  },
  {
    id: "strategy",
    label: "Strategy",
    blurb: "Let's review whether your content is on-brand and working.",
    prompts: ["Review my content strategy", "Am I drifting off-brand?", "What should I double down on?"],
  },
  {
    id: "accountability",
    label: "Accountability",
    blurb: "Let's make sure you actually ship.",
    prompts: ["Keep me accountable this week", "I keep not posting — help", "What's my one next action?"],
  },
];

interface PrAgentChatProps {
  userId: string;
}

const PrAgentChat = ({ userId }: PrAgentChatProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<string>("discovery");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const q = query(
          collection(db, 'users', userId, 'chatMessages'),
          orderBy('createdAt', 'asc'),
        );
        const snap = await getDocs(q);
        const msgs = snap.docs
          .slice(-50)
          .map((d) => ({ role: d.data().role, content: d.data().content } as Msg));
        if (msgs.length) setMessages(msgs);
      } catch {
        // history unavailable — start fresh
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = async () => {
    const snap = await getDocs(collection(db, 'users', userId, 'chatMessages'));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    setMessages([]);
    toast({ title: "Conversation cleared" });
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    // Build the running history we send to the model (prior turns + this one).
    const history = [...messages, userMsg].slice(-HISTORY_TURNS);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const token = await getIdToken();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history, mode }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("text/html")) {
        throw new Error("AI service is misconfigured (received a non-JSON response). Check Hosting rewrites / VITE_CLOUD_FUNCTIONS_BASE_URL.");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Persist both messages to Firestore
      const ts = new Date().toISOString();
      await addDoc(collection(db, 'users', userId, 'chatMessages'), {
        role: 'user', content: text, createdAt: ts,
      });
      if (assistantSoFar) {
        await addDoc(collection(db, 'users', userId, 'chatMessages'), {
          role: 'assistant', content: assistantSoFar, createdAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      toast({
        title: "Message failed",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
      if (!assistantSoFar) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const turnIntoPost = (seed: string) => {
    navigate(`/generator?instructions=${encodeURIComponent(seed.slice(0, 600))}`);
  };

  const activeMode = MODES.find((m) => m.id === mode) || MODES[0];

  if (!historyLoaded) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your PR agent...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Your PR Agent</h3>
          <p className="text-xs text-muted-foreground">Personal brand strategist · Remembers your conversations</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} aria-label="Clear conversation" className="text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Session mode selector */}
      <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "border border-input text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 max-w-sm">
              <p className="text-sm font-medium text-foreground">{activeMode.label} session</p>
              <p className="text-sm text-muted-foreground">{activeMode.blurb}</p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {activeMode.prompts.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border border-input text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.role === "user" ? "" : "space-y-1"}`}>
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "assistant" && msg.content && (
                <button
                  onClick={() => turnIntoPost(msg.content)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <PenLine className="h-3 w-3" /> Turn into a post
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your PR agent anything..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            size="icon"
            aria-label="Send message"
            className="shrink-0 h-[44px] w-[44px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrAgentChat;
