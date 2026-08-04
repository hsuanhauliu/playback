export type DrawTool =
  | "none"
  | "pen"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "angle"
  | "text"
  | "erase";

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  tool: DrawTool;
  points: Point[];
  color: string;
  lineWidth: number;
  text?: string;
}

export interface Clip {
  id: string;
  name: string;
  url: string;
  file: File;
}
