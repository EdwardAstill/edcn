"use client";

import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNestedSearch } from "@/registry/search/hooks/use-nested-search";
import { SearchInput, SearchPreview, SearchResults } from "@/registry/search/ui/search";
import type { SearchItem } from "@/registry/search/lib/search";

export const description = "Build your own course browser with shared navigation, custom rows, and a completely custom preview.";

type Lesson = { minutes: number; completed: boolean; summary: string };
const items: SearchItem<Lesson>[] = [
  { id: "course", label: "Field ecology", children: [
    { id: "observing", label: "Observing", children: [
      { id: "habitats", label: "Reading a habitat", data: { minutes: 12, completed: true, summary: "Recognise the features that make a habitat suitable for different species." } },
      { id: "survey", label: "Your first survey", data: { minutes: 20, completed: false, summary: "Plan a repeatable survey, choose observation points, and record your findings." } },
    ] },
    { id: "analysing", label: "Analysing", children: [
      { id: "patterns", label: "Finding patterns", data: { minutes: 15, completed: false, summary: "Compare observations across locations and look for changes over time." } },
    ] },
  ] },
];

export function ComposedSearchDemo() {
  const browser = useNestedSearch({ items, defaultMode: "miller", defaultSelectedId: "survey" });
  const lesson = browser.selected?.item;
  return <section aria-label="Course browser" className="overflow-hidden rounded-xl border">
    <div className="flex flex-wrap items-center gap-3 border-b p-4">
      <BookOpen aria-hidden="true" className="size-5" />
      <h3 className="flex-1 font-semibold">Explore the course</h3>
      <Button variant="outline" onClick={() => browser.setMode(browser.mode === "miller" ? "files" : "miller")}>
        {browser.mode === "miller" ? "Use hierarchy" : "Use columns"}
      </Button>
    </div>
    <div className="flex gap-3 border-b px-4 py-2">
      <SearchInput browser={browser} aria-label="Find a lesson" placeholder="Find a topic or lesson…" />
      <Button variant="ghost" onClick={() => { browser.setQuery(""); browser.select("survey"); }}>Resume learning</Button>
    </div>
    <SearchResults browser={browser}
      renderItem={({ item }, state) => <>
        {state.isContainer ? <BookOpen aria-hidden="true" className="size-4 shrink-0" /> : item.data?.completed ? <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-600" /> : <Circle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.data && <span className="text-xs text-muted-foreground">{item.data.minutes}m</span>}
      </>}
      preview={<SearchPreview className="overflow-y-auto p-6">
        {lesson?.data ? <>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{lesson.data.completed ? "Completed lesson" : "Up next"}</p>
          <h3 className="text-xl font-semibold">{lesson.label}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{lesson.data.summary}</p>
          <p className="mt-6 text-sm">{lesson.data.minutes} minute lesson</p>
        </> : <p className="text-sm text-muted-foreground">Choose a lesson to see what you’ll learn.</p>}
      </SearchPreview>} />
  </section>;
}
