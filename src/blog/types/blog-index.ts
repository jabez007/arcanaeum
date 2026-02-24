import type { BlogPostMetadata } from "./blog-post";

export interface BlogIndex {
  posts: BlogPostMetadata[];
  tags: string[];
  authors: string[];
  totalPosts: number;
}
