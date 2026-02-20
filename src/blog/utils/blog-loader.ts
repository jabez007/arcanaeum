import matter from "front-matter";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import type { BlogPost, BlogIndex, BlogPostMetadata } from "../types";
import blogIndexData from "../posts-index.json";

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

// Lazy load all markdown files
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postModules = import.meta.glob("../posts/*.md", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;

export function getAllPosts(): BlogPostMetadata[] {
  // Use the pre-generated index
  return (blogIndexData.posts as BlogPostMetadata[]).filter((post) => {
    // Skip draft posts in production (though the script already skips them)
    // @ts-expect-error process
    if (post.frontmatter.draft && process.env.NODE_ENV === "production") {
      return false;
    }
    return true;
  });
}

export function getBlogIndex(): BlogIndex {
  const posts = getAllPosts();
  return {
    posts,
    tags: blogIndexData.tags,
    authors: blogIndexData.authors,
    totalPosts: posts.length,
  };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const metadata = getAllPosts().find((post) => post.slug === slug);
  if (!metadata) return undefined;

  // Find the module corresponding to this post
  const modulePath = `../posts/${metadata.id}.md`;
  const loadModule = postModules[modulePath];

  if (!loadModule) {
    console.error(`Could not find module for post: ${metadata.id}`);
    return undefined;
  }

  try {
    const rawContent = await loadModule();
    const { body } = matter(rawContent);

    return {
      ...metadata,
      content: md.render(body),
      rawContent: body,
    };
  } catch (err) {
    console.error(`Failed to load post content for ${slug}:`, err);
    return undefined;
  }
}

export function getFeaturedPosts(): BlogPostMetadata[] {
  return getAllPosts().filter((post) => post.frontmatter.featured);
}

export function getPostsByTag(tag: string): BlogPostMetadata[] {
  return getAllPosts().filter((post) => post.frontmatter.tags?.includes(tag));
}

export function getPostsByAuthor(author: string): BlogPostMetadata[] {
  return getAllPosts().filter((post) => post.frontmatter.author === author);
}

export function getRecentPosts(count: number = 5): BlogPostMetadata[] {
  return getAllPosts().slice(0, count);
}
