"use client";

import { useState } from "react";
import { NestedSearch, type SearchItem } from "@/registry/search/components/nested-search";

export const description = "Search a collapsible library with a nested list on the left and content preview on the right.";

const items: SearchItem[] = [
  { id: "research", label: "Research", description: "Notes, experiments, and ideas worth keeping.", children: [
    { id: "ecology", label: "Ecology", children: [
      { id: "field-notes", label: "Field notes.md", description: "Observation log · 4 September", content: "# A morning at the wetlands\n\n06:40 — Arrived at the northern observation point.\nWater level is lower than the previous survey.\n\n## Bird activity\n\n• Three black swans near the reed beds\n• A pair of grey teal in the open water\n• Welcome swallows feeding above the shore\n\n## Next visit\n\nRepeat the count at the same time next week.\nBring the longer lens and water sampling kit." },
      { id: "water", label: "Water samples.json", description: "Sampling station A · three observations", content: '{\n  "station": "A",\n  "samples": [\n    { "depth_cm": 10, "temperature_c": 18.2 },\n    { "depth_cm": 30, "temperature_c": 17.8 },\n    { "depth_cm": 60, "temperature_c": 16.9 }\n  ]\n}' },
    ] },
    { id: "methods", label: "Methods", children: [
      { id: "protocol", label: "Survey protocol.md", content: "# Survey protocol\n\n1. Record the time and weather.\n2. Walk the marked transect slowly.\n3. Log each observation with its location.\n4. Review uncertain identifications.\n\nKeep the sampling effort consistent between visits." },
    ] },
  ] },
  { id: "project", label: "Project", children: [
    { id: "src", label: "src", children: [
      { id: "index", label: "index.ts", description: "Application entry point", content: 'import { summarize } from "./summarize";\n\nconst readings = [18.2, 17.8, 16.9];\n\nconsole.log(summarize(readings));' },
      { id: "summarize", label: "summarize.ts", content: "export function summarize(values: number[]) {\n  if (!values.length) return null;\n\n  const total = values.reduce((a, b) => a + b, 0);\n  return {\n    count: values.length,\n    mean: total / values.length,\n    min: Math.min(...values),\n    max: Math.max(...values),\n  };\n}" },
    ] },
    { id: "readme", label: "README.md", content: "# Fieldwork toolkit\n\nA small home for observations and analysis.\n\n## Getting started\n\nCollect a few readings, then run the summary.\nKeep raw observations in Research/Ecology." },
    { id: "archive", label: "Archive", children: [] },
  ] },
  { id: "inbox", label: "Inbox", children: [
    { id: "ideas", label: "Ideas.md", content: "# Things to explore\n\n• Compare seasonal changes in water temperature\n• Map the observation points\n• Turn the survey protocol into a checklist" },
  ] },
];

export function NestedSearchDemo() {
  const [opened, setOpened] = useState<string>();
  return <div className="mx-auto w-full max-w-6xl space-y-3">
    <NestedSearch items={items} showModeSwitch={false} defaultSelectedId="field-notes" aria-label="Library" onOpen={(item) => setOpened(item.label)} />
    <p className="text-xs text-muted-foreground" role="status">{opened ? `Opened ${opened}` : 'Try “field”, “src”, or “research/ecology”. Type to search, use arrows to navigate, or Tab to cycle through results.'}</p>
  </div>;
}
