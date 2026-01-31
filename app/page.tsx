"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Activity,
  LogOut,
  Mail,
  FileText,
  Hammer,
  AlertTriangle,
  Cpu,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "progress" | "blocked" | "done";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  tags: string[];
}

type LogLevel = "info" | "warn" | "error" | "success" | "working" | "llm-request" | "llm-response" | "tool-call" | "file-op";
type LogCategory = "system" | "task" | "file" | "command" | "api" | "build" | "llm" | "user-request" | "tool";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
  metadata?: Record<string, string>;
  duration?: number;
}

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Build James OS Dashboard", description: "Create the main dashboard interface with dark mode", status: "done", createdAt: new Date(), startedAt: new Date(), completedAt: new Date(), tags: ["ui", "nextjs", "dashboard"] },
  { id: "2", title: "Design Profile Section", description: "Create avatar, status, and profile card", status: "done", createdAt: new Date(), tags: ["ui", "profile"] },
  { id: "3", title: "Implement Kanban Board", description: "Four columns: Todo, Progress, Blocked, Done", status: "progress", createdAt: new Date(), startedAt: new Date(), tags: ["feature", "kanban"] },
  { id: "4", title: "Build Log Stream", description: "Real-time activity log with filtering", status: "progress", createdAt: new Date(), startedAt: new Date(), tags: ["feature", "logs"] },
  { id: "5", title: "Add Password Authentication", description: "Simple password protection with hypecut2025", status: "done", createdAt: new Date(), startedAt: new Date(), completedAt: new Date(), tags: ["auth", "security"] },
  { id: "6", title: "Mobile Responsive Design", description: "Fix UI for mobile devices", status: "done", createdAt: new Date(), startedAt: new Date(), completedAt: new Date(), tags: ["ui", "mobile", "responsive"] },
  { id: "7", title: "Verbose Logging System", description: "Log all LLM calls, tools, files, and requests", status: "progress", createdAt: new Date(), startedAt: new Date(), tags: ["feature", "logging", "debug"] },
];

const COLUMNS = [
  { id: "todo", title: "Todo", icon: Clock, color: "text-zinc-400" },
  { id: "progress", title: "In Progress", icon: Loader2, color: "text-blue-400" },
  { id: "blocked", title: "Blocked", icon: XCircle, color: "text-red-400" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "text-green-400" },
];

const STATUS_COLORS = {
  todo: "bg-zinc-800 border-zinc-700",
  progress: "bg-blue-950/30 border-blue-800",
  blocked: "bg-red-950/30 border-red-800",
  done: "bg-green-950/30 border-green-800",
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
  working: "text-purple-400",
  "llm-request": "text-cyan-400",
  "llm-response": "text-emerald-400",
  "tool-call": "text-orange-400",
  "file-op": "text-pink-400",
};

const LOG_CATEGORY_ICONS: Record<LogCategory, typeof Terminal> = {
  system: Activity,
  task: CheckCircle2,
  file: FileText,
  command: Terminal,
  api: Hammer,
  build: Loader2,
  llm: Cpu,
  tool: Hammer,
  "user-request": MessageSquare,
};

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<LogCategory | "all">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch logs from API
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      // Silent fail - server might not be running
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll logs every 2 seconds
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const moveTask = useCallback((taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updated: Task = { ...task, status: newStatus };
          if (newStatus === "progress" && !task.startedAt) updated.startedAt = new Date();
          if (newStatus === "done") updated.completedAt = new Date();
          return updated;
        }
        return task;
      })
    );
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (e) {
      console.error('Failed to clear logs');
    }
  };

  const filteredLogs = activeFilter === "all" ? logs : logs.filter((l) => l.category === activeFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading James OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 lg:p-6">
      {/* Header */}
      <header className="mb-6 lg:mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-lg lg:text-xl font-bold">J</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">James OS</h1>
            <p className="text-xs lg:text-sm text-zinc-500">AI Assistant Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-zinc-400">{currentTime.toLocaleTimeString()}</p>
            <p className="text-xs text-zinc-600">{currentTime.toLocaleDateString()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Profile Card */}
        <div className="col-span-1 lg:col-span-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 lg:p-6">
              <div className="flex lg:flex-col items-center gap-4 lg:gap-0 lg:text-center">
                <Avatar className="h-16 w-16 lg:h-24 lg:w-24 lg:mb-4 ring-4 ring-purple-500/20">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-xl lg:text-2xl">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "J"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 lg:flex-none">
                  <h2 className="text-lg lg:text-xl font-semibold">{user?.displayName || "Adriano"}</h2>
                  <p className="text-xs lg:text-sm text-zinc-500 mb-2 lg:mb-4">AI Assistant</p>
                  <Badge variant="outline" className="bg-green-950/30 border-green-700 text-green-400 text-xs">
                    <Activity className="w-3 h-3 mr-1" />Online
                  </Badge>
                </div>
              </div>

              <div className="mt-4 lg:mt-6 space-y-2 lg:space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-400 truncate text-xs lg:text-sm">adriano.neps@gmail.com</span>
                </div>
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-zinc-500">Stack</span>
                  <span className="text-zinc-300">Next.js + Express</span>
                </div>
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-zinc-500">Level</span>
                  <span className="text-zinc-300">Senior Full-Stack</span>
                </div>
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-zinc-300">Logging Everything</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-1 lg:col-span-9">
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="bg-zinc-900 border-zinc-800 mb-4 w-full lg:w-auto">
              <TabsTrigger value="board" className="data-[state=active]:bg-zinc-800 flex-1 lg:flex-none">Board</TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800 flex-1 lg:flex-none">
                Live Logs {logs.length > 0 && <span className="ml-1 text-xs text-zinc-500">({logs.length})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="mt-0">
              <div className="mb-3 px-2">
                <p className="text-xs text-zinc-500">📋 Kanban updated by James only • View-only mode</p>
              </div>
              <div className="flex lg:grid lg:grid-cols-4 gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory">
                {COLUMNS.map((column) => {
                  const Icon = column.icon;
                  const columnTasks = tasks.filter((t) => t.status === column.id);
                  return (
                    <div key={column.id} className="flex-shrink-0 w-[280px] lg:w-auto flex flex-col snap-start">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <Icon className={`w-4 h-4 ${column.color}`} />
                        <span className="text-sm font-medium text-zinc-300">{column.title}</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">{columnTasks.length}</Badge>
                      </div>
                      <ScrollArea className="h-[350px] lg:h-[500px]">
                        <div className="space-y-3 pr-3">
                          {columnTasks.map((task) => (
                            <Card key={task.id} className={`${STATUS_COLORS[task.status]} transition-all hover:ring-1 hover:ring-zinc-600 min-h-[80px]`}>
                              <CardContent className="p-3 lg:p-4">
                                <h4 className="font-medium text-sm mb-1 text-zinc-200">{task.title}</h4>
                                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{task.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.map((tag) => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{tag}</span>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Terminal className="w-5 h-5" />
                      Live Activity Log
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">{filteredLogs.length}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={fetchLogs} className="border-zinc-700 text-zinc-400 h-8">
                        <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearLogs} className="border-zinc-700 text-red-400 hover:text-red-300 h-8">
                        <Trash2 className="w-4 h-4 mr-1" />Clear
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(["all", "system", "llm", "tool", "file", "command", "api", "build", "user-request"] as const).map((cat) => (
                      <Button
                        key={cat}
                        variant={activeFilter === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter(cat)}
                        className={`text-[10px] h-6 px-2 ${activeFilter === cat ? "bg-purple-600" : "border-zinc-700 text-zinc-400"}`}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] lg:h-[500px]">
                    <div className="space-y-1 font-mono text-sm">
                      {filteredLogs.length === 0 ? (
                        <div className="text-zinc-600 text-center py-8">
                          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No logs yet...</p>
                          <p className="text-xs mt-1">Activity will appear here automatically</p>
                        </div>
                      ) : (
                        filteredLogs.map((log) => {
                          const Icon = LOG_CATEGORY_ICONS[log.category] || Terminal;
                          return (
                            <div key={log.id} className="flex gap-2 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                              <span className="text-zinc-600 text-[10px] whitespace-nowrap mt-0.5">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <Icon className={`w-3 h-3 mt-1 flex-shrink-0 ${LOG_LEVEL_COLORS[log.level] || 'text-zinc-400'}`} />
                              <span className={`text-[10px] uppercase flex-shrink-0 ${LOG_LEVEL_COLORS[log.level] || 'text-zinc-400'}`}>
                                {log.level}
                              </span>
                              <span className="text-[10px] text-zinc-600 flex-shrink-0">[{log.category}]</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-zinc-300 text-xs">{log.message}</span>
                                {log.details && <p className="text-[10px] text-zinc-500 mt-0.5">{log.details}</p>}
                                {log.metadata && (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Object.entries(log.metadata).map(([k, v]) => (
                                      <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{k}: {v}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer with commit hash */}
      <footer className="mt-8 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span>James OS</span>
          <span>•</span>
          <code className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 font-mono">v1.0.2</code>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/jameshypecutbot-hue/dashboard" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
            GitHub
          </a>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
