import type { BlogFrontmatter } from "./blog-frontmatter";

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  rawContent: string;
  readingTime?: number;
}
