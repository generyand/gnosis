"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Brain, Clock, Hash } from "lucide-react";
import type { LogEntry } from "@/hooks/use-graph-state";

interface NeuralLogProps {
  logs: LogEntry[];
}

export function NeuralLog({ logs }: NeuralLogProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed right-3 top-3 z-40 sm:right-4 sm:top-4"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-1.5 border-border bg-card/80 backdrop-blur-xl sm:gap-2"
        >
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">AI Log</span>
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary sm:px-2">
            {logs.length}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-30 h-full w-full border-l border-border bg-card/95 backdrop-blur-xl sm:w-80"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="h-5 w-5 text-primary" />
                  Neural Log
                </h2>
                <p className="text-sm text-muted-foreground">
                  AI reasoning for each expansion
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-border bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between text-sm">
                            <span className="truncate font-medium text-foreground">
                              {log.topic}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              {log.nodeCount}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(log.timestamp)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {log.reasoning}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
