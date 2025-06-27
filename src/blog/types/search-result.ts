import type { FuseResultMatch } from "fuse.js";
import type { BlogPost } from "./blog-post";

export interface SearchResult {
  post: BlogPost;
  score: number;
  matches: readonly FuseResultMatch[];
}
