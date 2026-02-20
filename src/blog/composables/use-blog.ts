import { ref, computed, type Ref } from "vue";
import type { BlogPost, BlogPostMetadata, BlogFilters, SearchResult } from "../types";
import { getAllPosts, getBlogIndex, getPostBySlug } from "../utils/blog-loader";
import { filterPosts, searchPosts, getRelatedPosts } from "../utils/blog-searcher";

export function useBlog() {
  const posts: Ref<BlogPostMetadata[]> = ref([]);
  const postsLoading = ref(true);
  const postLoading = ref(false);
  const loading = computed(() => postsLoading.value || postLoading.value);
  const error = ref<string | null>(null);

  const blogIndex = computed(() => getBlogIndex());
  const allTags = computed(() => blogIndex.value.tags);
  const allAuthors = computed(() => blogIndex.value.authors);

  const loadPosts = () => {
    try {
      error.value = null;
      postsLoading.value = true;
      posts.value = getAllPosts();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load posts";
    } finally {
      postsLoading.value = false;
    }
  };

  const getPost = async (slug: string): Promise<BlogPost | undefined> => {
    try {
      error.value = null;
      postLoading.value = true;
      return await getPostBySlug(slug);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load post";
      return undefined;
    } finally {
      postLoading.value = false;
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
    postsLoading,
    postLoading,
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
