/* eslint-disable @typescript-eslint/no-explicit-any */
import matter from "front-matter";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import type { BlogPost, BlogFrontmatter, BlogIndex } from "../types";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (err) {
        console.error(err);
      }
    }
    return "";
  },
});

// Function to import all markdown files
function importAll(modules: Record<string, any>): Record<string, any> {
  const posts: Record<string, string> = {};

  Object.keys(modules).forEach((path: string) => {
    // Extract filename from path: "../posts/filename.md" -> "filename"
    console.debug("Extracting filename from", path);
    const key = path.replace("../posts/", "").replace(".md", "");
    console.debug("Extracted key", key);
    posts[key] = modules[path];
  });
  return posts;
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Extract excerpt from content if not provided
function extractExcerpt(content: string, maxLength: number = 160): string {
  const plainText = content.replace(/[#*`]/g, "").trim();
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

// Load all blog posts
const blogPosts = importAll(
  import.meta.glob("../posts/*.md", { eager: true, query: "?raw", import: "default" }),
);

let cachedPosts: BlogPost[] | null = null;
let cachedIndex: BlogIndex | null = null;

export function getAllPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts;

  const posts: BlogPost[] = [];

  Object.keys(blogPosts).forEach((key) => {
    const post = blogPosts[key];
    console.debug("Loaded post\n", post);
    const { attributes, body }: { attributes: BlogFrontmatter; body: string } = matter(post);

    // Skip draft posts in production
    // @ts-expect-error process
    if (attributes.draft && process.env.NODE_ENV === "production") {
      return;
    }

    // Extract slug from filename or use custom slug
    const slug = attributes.slug || key.replace(/^\d{4}-\d{2}-\d{2}-/, "");

    // Generate excerpt if not provided
    const excerpt = attributes.excerpt || extractExcerpt(body);

    const blogPost: BlogPost = {
      slug,
      frontmatter: {
        ...attributes,
        excerpt,
        date: attributes.date || new Date().toISOString().split("T")[0],
      } as BlogFrontmatter,
      content: md.render(body),
      rawContent: body,
      readingTime: calculateReadingTime(body),
    };

    posts.push(blogPost);
  });

  // Sort by date (newest first)
  cachedPosts = posts.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
  );

  return cachedPosts;
}

export function getBlogIndex(): BlogIndex {
  if (cachedIndex) return cachedIndex;

  const posts = getAllPosts();
  const tags = new Set<string>();
  const authors = new Set<string>();

  posts.forEach((post) => {
    if (post.frontmatter.tags) {
      post.frontmatter.tags.forEach((tag) => tags.add(tag));
    }
    if (post.frontmatter.author) {
      authors.add(post.frontmatter.author);
    }
  });

  cachedIndex = {
    posts,
    tags: Array.from(tags).sort(),
    authors: Array.from(authors).sort(),
    totalPosts: posts.length,
  };

  return cachedIndex;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter((post) => post.frontmatter.featured);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) => post.frontmatter.tags?.includes(tag));
}

export function getPostsByAuthor(author: string): BlogPost[] {
  return getAllPosts().filter((post) => post.frontmatter.author === author);
}

export function getRecentPosts(count: number = 5): BlogPost[] {
  return getAllPosts().slice(0, count);
}
