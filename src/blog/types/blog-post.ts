import type { BlogFrontmatter } from "./blog-frontmatter";

export interface BlogPostMetadata {
  id: string;
  slug: string;
  frontmatter: BlogFrontmatter;
  readingTime: number;
}

export interface BlogPost extends BlogPostMetadata {
  content: string;
  rawContent: string;
}
