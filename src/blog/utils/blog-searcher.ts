import Fuse, { type IFuseOptions } from "fuse.js";
import type { BlogPostMetadata, SearchResult, BlogFilters } from "../types";
import { getAllPosts } from "./blog-loader";

let searchIndex: Fuse<BlogPostMetadata> | null = null;

export function initializeSearch(): Fuse<BlogPostMetadata> {
  if (searchIndex) return searchIndex;

  const posts = getAllPosts();

  const options: IFuseOptions<BlogPostMetadata> = {
    keys: [
      { name: "frontmatter.title", weight: 0.7 },
      { name: "frontmatter.excerpt", weight: 0.3 },
      { name: "frontmatter.tags", weight: 0.2 },
    ],
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    minMatchCharLength: 2,
  };

  searchIndex = new Fuse(posts, options);
  return searchIndex;
}

export function searchPosts(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const fuse = initializeSearch();
  const results = fuse.search(query);

  return results.map((result) => ({
    post: result.item,
    score: result.score || 0,
    matches: result.matches || [],
  }));
}

export function filterPosts(filters: BlogFilters): BlogPostMetadata[] {
  let posts = getAllPosts();

  if (filters.search) {
    const searchResults = searchPosts(filters.search);
    posts = searchResults.map((result) => result.post);
  }

  if (filters.tag) {
    posts = posts.filter((post) => post.frontmatter.tags?.includes(filters.tag!));
  }

  if (filters.author) {
    posts = posts.filter((post) => post.frontmatter.author === filters.author);
  }

  if (filters.featured !== undefined) {
    posts = posts.filter((post) => Boolean(post.frontmatter.featured) === filters.featured);
  }

  return posts;
}

// Get related posts based on tags
export function getRelatedPosts(currentPost: BlogPostMetadata, count: number = 3): BlogPostMetadata[] {
  if (!currentPost.frontmatter.tags) return [];

  const allPosts = getAllPosts().filter((post) => post.slug !== currentPost.slug);
  const currentTags = currentPost.frontmatter.tags;

  // Score posts by number of matching tags
  const scoredPosts = allPosts.map((post) => {
    const matchingTags = post.frontmatter.tags?.filter((tag) => currentTags.includes(tag)) || [];

    return {
      post,
      score: matchingTags.length,
    };
  });

  // Sort by score and return top matches
  return scoredPosts
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
}
