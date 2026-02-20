import { ref, computed, type Ref } from "vue";
import type { BlogPost, BlogPostMetadata, BlogFilters, SearchResult } from "../types";
import { getAllPosts, getBlogIndex, getPostBySlug } from "../utils/blog-loader";
import { filterPosts, searchPosts, getRelatedPosts } from "../utils/blog-searcher";

export function useBlog() {
  const posts: Ref<BlogPostMetadata[]> = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const blogIndex = computed(() => getBlogIndex());
  const allTags = computed(() => blogIndex.value.tags);
  const allAuthors = computed(() => blogIndex.value.authors);

  const loadPosts = () => {
    try {
      loading.value = true;
      posts.value = getAllPosts();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load posts";
    } finally {
      loading.value = false;
    }
  };

  const getPost = async (slug: string): Promise<BlogPost | undefined> => {
    try {
      loading.value = true;
      return await getPostBySlug(slug);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load post";
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const filterPostsByFilters = (filters: BlogFilters): BlogPostMetadata[] => {
    return filterPosts(filters);
  };

  const searchPostsWithQuery = (query: string): SearchResult[] => {
    return searchPosts(query);
  };

  const getRelatedPostsForPost = (post: BlogPostMetadata, count?: number): BlogPostMetadata[] => {
    return getRelatedPosts(post, count);
  };

  return {
    posts,
    loading,
    error,
    allTags,
    allAuthors,
    blogIndex,
    loadPosts,
    getPost,
    filterPostsByFilters,
    searchPostsWithQuery,
    getRelatedPostsForPost,
  };
}
