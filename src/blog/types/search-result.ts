import type { FuseResultMatch } from "fuse.js";
import type { BlogPostMetadata } from "./blog-post";

export interface SearchResult {
  post: BlogPostMetadata;
  score: number;
  matches: readonly FuseResultMatch[];
}
