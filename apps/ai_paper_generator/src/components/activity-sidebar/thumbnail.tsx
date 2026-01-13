// subject-icons.ts
import {
  Pi,
  Dna,
  Atom,
  FlaskConical,
//   Calculator,
  BookOpen,
  Library,
  Globe,
  Landmark,
  Cpu,
  MonitorSmartphone,
  Palette,
  Brush,
  Microscope,
//   Beaker,
  Brain,
} from "lucide-react";

export const subjectIcons = {
  maths: Pi,
  mathematics: Pi,
  math: Pi,

  biology: Dna,
  bio: Dna,

  chemistry: FlaskConical,
  chem: FlaskConical,

  physics: Atom,

  science: Microscope,

  english: BookOpen,
  hindi: Library,
  language: BookOpen,

  geography: Globe,
  geo: Globe,

  history: Landmark,
  civics: Landmark,
  sst: Landmark, // general SST icon

  computer: Cpu,
  cs: Cpu,
  it: MonitorSmartphone,

  art: Palette,
  drawing: Brush,

  psychology: Brain,
};

export type SubjectKey = keyof typeof subjectIcons;
