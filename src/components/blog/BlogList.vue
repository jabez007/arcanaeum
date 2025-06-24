<template>
  <div class="blog-container">
    <header class="blog-header">
      <h1>Blog</h1>
      <p>Thoughts, tutorials, and updates</p>
    </header>

    <!-- Search and Filters -->
    <div class="blog-controls">
      <div class="search-container">
        <input v-model="searchQuery" type="text" placeholder="Search posts..." class="search-input"
          @input="handleSearch" />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
      </div>

      <div class="filters-container">
        <select v-model="selectedAuthor" class="filter-select">
          <option value="">All Authors</option>
          <option v-for="author in allAuthors" :key="author" :value="author">
            {{ author }}
          </option>
        </select>

        <button @click="showFeaturedOnly = !showFeaturedOnly" :class="{ active: showFeaturedOnly }"
          class="featured-toggle">
          Featured Only
        </button>
      </div>
    </div>

    <!-- Tags Filter -->
    <div class="blog-tags">
      <button @click="selectedTag = ''" :class="{ active: !selectedTag }" class="tag-btn">
        All Posts ({{ filteredPosts.length }})
      </button>
      <button v-for="tag in allTags" :key="tag" @click="selectedTag = tag" :class="{ active: selectedTag === tag }"
        class="tag-btn">
        {{ tag }} ({{ getTagCount(tag) }})
      </button>
    </div>

    <!-- Search Results Info -->
    <div v-if="searchQuery" class="search-info">
      <p>
        Found {{ filteredPosts.length }} result{{ filteredPosts.length !== 1 ? "s" : "" }} for "{{
          searchQuery
        }}"
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading posts...</div>

    <!-- Error State -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Posts Grid -->
    <div class="posts-grid" v-if="!loading && !error">
      <article v-for="post in paginatedPosts" :key="post.slug" class="post-card" @click="navigateToPost(post.slug)">
        <div class="post-meta">
          <time>{{ formatDate(post.frontmatter.date) }}</time>
          <span v-if="post.frontmatter.featured" class="featured-badge"> Featured </span>
          <span class="reading-time">{{ post.readingTime }} min read</span>
        </div>

        <h2>{{ post.frontmatter.title }}</h2>

        <p class="excerpt">{{ post.frontmatter.excerpt }}</p>

        <div class="post-footer">
          <div class="post-tags">
            <span v-for="tag in post.frontmatter.tags?.slice(0, 3)" :key="tag" class="tag" @click.stop="selectTag(tag)">
              {{ tag }}
            </span>
            <span v-if="post.frontmatter.tags && post.frontmatter.tags.length > 3" class="tag-more">
              +{{ post.frontmatter.tags.length - 3 }}
            </span>
          </div>

          <div class="post-author" v-if="post.frontmatter.author">
            <span @click.stop="selectAuthor(post.frontmatter.author!)">
              by {{ post.frontmatter.author }}
            </span>
          </div>
        </div>

        <div class="read-more">Read more →</div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && filteredPosts.length === 0" class="empty-state">
      <h3>No posts found</h3>
      <p>Try adjusting your search or filter criteria.</p>
      <button @click="clearAllFilters" class="clear-filters-btn">Clear All Filters</button>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
        Previous
      </button>

      <span class="page-info"> Page {{ currentPage }} of {{ totalPages }} </span>

      <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { BlogPost, BlogFilters } from "@/blog/types";

const router = useRouter();
const { posts, loading, error, allTags, allAuthors, loadPosts, filterPostsByFilters } = useBlog();

const searchQuery = ref("");
const selectedTag = ref("");
const selectedAuthor = ref("");
const showFeaturedOnly = ref(false);
const currentPage = ref(1);
const postsPerPage = 9;

const filters = computed(
  (): BlogFilters => ({
    search: searchQuery.value,
    tag: selectedTag.value || undefined,
    author: selectedAuthor.value || undefined,
    featured: showFeaturedOnly.value || undefined,
  }),
);

const filteredPosts = computed((): BlogPost[] => {
  return filterPostsByFilters(filters.value);
});

const totalPages = computed((): number => {
  return Math.ceil(filteredPosts.value.length / postsPerPage);
});

const paginatedPosts = computed((): BlogPost[] => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return filteredPosts.value.slice(start, end);
});

const getTagCount = (tag: string): number => {
  return posts.value.filter((post) => post.frontmatter.tags?.includes(tag)).length;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleSearch = (): void => {
  currentPage.value = 1; // Reset to first page on search
};

const clearSearch = (): void => {
  searchQuery.value = "";
};

const selectTag = (tag: string): void => {
  selectedTag.value = tag;
  currentPage.value = 1;
};

const selectAuthor = (author: string): void => {
  selectedAuthor.value = author;
  currentPage.value = 1;
};

const clearAllFilters = (): void => {
  searchQuery.value = "";
  selectedTag.value = "";
  selectedAuthor.value = "";
  showFeaturedOnly.value = false;
  currentPage.value = 1;
};

const navigateToPost = (slug: string): void => {
  router.push(`/blog/${slug}`);
};

// Reset page when filters change
watch(filters, () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-header {
  text-align: center;
  margin-bottom: 3rem;
}

.blog-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.blog-header p {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.blog-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #7f8c8d;
}

.filters-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.featured-toggle {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.featured-toggle.active,
.featured-toggle:hover {
  border-color: #f39c12;
  background: #f39c12;
  color: white;
}

.blog-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.tag-btn:hover,
.tag-btn.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.search-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.featured-badge {
  background: #f39c12;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.reading-time {
  background: #ecf0f1;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.post-card h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
  line-height: 1.3;
  flex-grow: 0;
}

.excerpt {
  color: #5a6c7d;
  line-height: 1.6;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.post-footer {
  margin-top: auto;
  margin-bottom: 1rem;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.tag {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.tag:hover {
  background: #3498db;
  color: white;
}

.tag-more {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.post-author {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.post-author span {
  cursor: pointer;
  transition: color 0.3s ease;
}

.post-author span:hover {
  color: #3498db;
}

.read-more {
  color: #3498db;
  font-weight: 500;
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.clear-filters-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.clear-filters-btn:hover {
  background: #2980b9;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #7f8c8d;
  font-weight: 500;
}

@media (max-width: 768px) {
  .blog-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    min-width: auto;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
