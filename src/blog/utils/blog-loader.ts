import type { BlogPost, BlogIndex, BlogPostMetadata } from "../types";
import blogIndexData from "../posts-index.json";

export function getAllPosts(): BlogPostMetadata[] {
  // Use the pre-generated index
  return (blogIndexData.posts as BlogPostMetadata[]).filter((post) => {
    // Skip draft posts in production (though the script already skips them)
    if (post.frontmatter.draft && import.meta.env.PROD) {
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

// Lazy load all rendered JSON files
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderedModules = import.meta.glob("../rendered/*.json", { import: "default" }) as Record<
  string,
  () => Promise<any>
>;

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const metadata = getAllPosts().find((post) => post.slug === slug);
  if (!metadata) return undefined;

  // Find the module corresponding to this post
  const modulePath = `../rendered/${slug}.json`;
  const loadModule = renderedModules[modulePath];

  if (!loadModule) {
    console.error(`Could not find rendered module for slug: ${slug}`);
    return undefined;
  }

  try {
    const postData = (await loadModule()) as BlogPost;
    return postData;
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
