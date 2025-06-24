export interface BlogFrontmatter {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  excerpt?: string;
  featured?: boolean;
  draft?: boolean;
  image?: string;
  slug?: string;
}
