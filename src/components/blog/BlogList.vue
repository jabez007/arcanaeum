<template>
  <div class="blog-container">
    <header class="blog-header">
      <h1>{{ blogTitle }}</h1>
      <p>Crafting code, weaving algorithms, and brewing solutions in the realm of technology</p>
    </header>

    <!-- Search and Filters -->
    <div class="blog-controls">
      <div class="search-container">
        <input v-model="searchQuery" type="text" placeholder="Search posts..." class="blog-input search-input"
          @input="handleSearch" />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search">✕</button>
      </div>

      <div class="filters-container">
        <select v-model="selectedAuthor" class="blog-input filter-select">
          <option value="">All Authors</option>
          <option v-for="author in allAuthors" :key="author" :value="author">
            {{ author }}
          </option>
        </select>

        <button @click="showFeaturedOnly = !showFeaturedOnly" :class="{ active: showFeaturedOnly }"
          class="blog-btn blog-btn-secondary featured-toggle">
          Featured Only
        </button>
      </div>
    </div>

    <!-- Tags Filter -->
    <div class="blog-tags">
      <button @click="selectedTag = ''" :class="{ active: !selectedTag }" class="blog-tag tag-btn">
        All Posts ({{ filteredPosts.length }})
      </button>
      <button v-for="tag in allTags" :key="tag" @click="selectedTag = tag" :class="{ active: selectedTag === tag }"
        class="blog-tag tag-btn">
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
    <div v-if="loading" class="blog-loading">Loading posts...</div>

    <!-- Error State -->
    <div v-if="error" class="blog-error">
      {{ error }}
    </div>

    <!-- Posts Grid -->
    <div class="posts-grid" v-if="!loading && !error">
      <article v-for="post in paginatedPosts" :key="post.slug" class="blog-card post-card"
        @click="navigateToPost(post.slug)">
        <div class="post-meta">
          <time>{{ formatDate(post.frontmatter.date) }}</time>
          <span v-if="post.frontmatter.featured" class="blog-badge blog-badge-featured">
            Featured
          </span>
          <span class="blog-badge blog-badge-reading-time">{{ post.readingTime }} min read</span>
        </div>

        <h2>{{ post.frontmatter.title }}</h2>

        <p class="excerpt">{{ post.frontmatter.excerpt }}</p>

        <div class="post-footer">
          <div class="post-tags">
            <span v-for="tag in post.frontmatter.tags?.slice(0, 3)" :key="tag" class="blog-tag tag"
              @click.stop="selectTag(tag)">
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
      <button @click="clearAllFilters" class="blog-btn blog-btn-primary">Clear All Filters</button>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="blog-pagination">
      <button @click="currentPage--" :disabled="currentPage === 1" class="blog-page-btn">
        Previous
      </button>

      <span class="blog-page-info"> Page {{ currentPage }} of {{ totalPages }} </span>

      <button @click="currentPage++" :disabled="currentPage === totalPages" class="blog-page-btn">
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

const blogTitle = "Commits & Conjurations";

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
  document.title = `${blogTitle} - Blog`;

  loadPosts();
});
</script>

<style>
@import "@/assets/blog/theme.css";
</style>

<style scoped>
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--blog-spacing-xl);
}

.blog-header {
  text-align: center;
  margin-bottom: var(--blog-spacing-2xl);
}

.blog-header h1 {
  font-size: var(--blog-font-size-4xl);
  margin-bottom: var(--blog-spacing-sm);
  color: var(--blog-text-primary);
}

.blog-header p {
  font-size: var(--blog-font-size-xl);
  color: var(--blog-text-muted);
}

.blog-controls {
  display: flex;
  gap: var(--blog-spacing-xl);
  margin-bottom: var(--blog-spacing-xl);
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
}

.clear-search {
  position: absolute;
  right: var(--blog-spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--blog-spacing-sm);
  color: var(--blog-text-muted);
}

.filters-container {
  display: flex;
  gap: var(--blog-spacing-md);
  align-items: center;
}

.filter-select {
  background: var(--blog-background);
  cursor: pointer;
}

.featured-toggle.active {
  border-color: var(--blog-secondary);
  background: var(--blog-secondary);
  color: white;
}

.blog-tags {
  display: flex;
  gap: var(--blog-spacing-sm);
  margin-bottom: var(--blog-spacing-xl);
  flex-wrap: wrap;
  justify-content: center;
}

.tag-btn {
  border: 2px solid var(--blog-border);
  border-radius: var(--blog-radius-full);
  font-size: 0.9rem;
}

.tag-btn.active {
  border-color: var(--blog-primary);
  background: var(--blog-primary);
  color: white;
}

.search-info {
  margin-bottom: var(--blog-spacing-lg);
  padding: var(--blog-spacing-md);
  background: var(--blog-background-light);
  border-radius: var(--blog-radius-md);
  text-align: center;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--blog-spacing-xl);
  margin-bottom: var(--blog-spacing-2xl);
}

.post-card {
  padding: var(--blog-spacing-lg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--blog-spacing-md);
  font-size: 0.9rem;
  color: var(--blog-text-muted);
  flex-wrap: wrap;
  gap: var(--blog-spacing-sm);
}

.post-card h2 {
  font-family: var(--blog-font-heading);
  margin-bottom: var(--blog-spacing-md);
  color: var(--blog-text-primary);
  line-height: var(--blog-line-height-tight);
  flex-grow: 0;
}

.excerpt {
  font-family: var(--blog-font-primary);
  color: var(--blog-text-secondary);
  line-height: var(--blog-line-height-base);
  margin-bottom: var(--blog-spacing-md);
  flex-grow: 1;
}

.post-footer {
  margin-top: auto;
  margin-bottom: var(--blog-spacing-md);
}

.post-tags {
  display: flex;
  gap: var(--blog-spacing-sm);
  margin-bottom: var(--blog-spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.tag-more {
  color: var(--blog-text-muted);
  font-size: 0.8rem;
}

.post-author {
  font-size: 0.9rem;
  color: var(--blog-text-muted);
}

.post-author span {
  cursor: pointer;
  transition: color var(--blog-transition-base);
}

.post-author span:hover {
  color: var(--blog-primary);
}

.read-more {
  color: var(--blog-primary);
  font-weight: 500;
  margin-top: var(--blog-spacing-sm);
}

.empty-state {
  text-align: center;
  padding: var(--blog-spacing-2xl);
  color: var(--blog-text-muted);
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
