import type { BlogPost } from "./blog-post";

export interface BlogIndex {
  posts: BlogPost[];
  tags: string[];
  authors: string[];
  totalPosts: number;
}
