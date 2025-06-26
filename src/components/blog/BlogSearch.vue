<template>
  <div class="search-page">
    <header class="search-header">
      <h1>Search Blog</h1>
      <div class="search-container">
        <input v-model="searchQuery" type="text" placeholder="Search posts, tags, or content..."
          class="blog-input search-input" @input="handleSearch" @keyup.enter="handleSearch" ref="searchInput" />
        <button @click="handleSearch" class="blog-btn blog-btn-primary search-btn">Search</button>
      </div>
    </header>

    <div v-if="searchQuery && searchResults.length > 0" class="search-results">
      <div class="results-info">
        <p>
          Found {{ searchResults.length }} result{{ searchResults.length !== 1 ? "s" : "" }} for "{{
            searchQuery
          }}"
        </p>
      </div>

      <div class="results-grid">
        <article v-for="result in paginatedResults" :key="result.post.slug" class="blog-card result-card"
          @click="navigateToPost(result.post.slug)">
          <div class="result-meta">
            <time>{{ formatDate(result.post.frontmatter.date) }}</time>
            <span class="blog-badge relevance-score">{{ Math.round((1 - result.score) * 100) }}% match</span>
          </div>

          <h2>{{ result.post.frontmatter.title }}</h2>

          <p class="excerpt">{{ result.post.frontmatter.excerpt }}</p>

          <!-- Highlight matching content -->
          <div v-if="result.matches.length > 0" class="match-highlights">
            <div v-for="match in result.matches.slice(0, 2)" :key="match.key" class="match-item">
              <span class="match-field">{{ getFieldName(match.key ?? "") }}:</span>
              <span class="match-text">{{ getMatchText(match) }}</span>
            </div>
          </div>

          <div class="result-tags" v-if="result.post.frontmatter.tags">
            <span v-for="tag in result.post.frontmatter.tags.slice(0, 3)" :key="tag" class="blog-tag">
              {{ tag }}
            </span>
          </div>
        </article>
      </div>

      <!-- Pagination for search results -->
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

    <div v-else-if="searchQuery && searchResults.length === 0" class="no-results">
      <h3>No results found</h3>
      <p>Try different keywords or check your spelling.</p>
      <div class="search-suggestions">
        <h4>Search suggestions:</h4>
        <ul>
          <li>Try using more general terms</li>
          <li>Check for typos in your search</li>
          <li>Use different keywords</li>
          <li>Browse by <router-link to="/blog">categories</router-link></li>
        </ul>
      </div>
    </div>

    <div v-else class="search-placeholder">
      <h3>Start typing to search</h3>
      <p>Search through all blog posts, tags, and content.</p>

      <div class="popular-tags">
        <h4>Popular tags:</h4>
        <div class="tag-cloud">
          <router-link v-for="tag in popularTags" :key="tag" :to="`/blog/tag/${tag}`" class="blog-tag tag-link">
            {{ tag }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { SearchResult } from "@/blog/types";

const router = useRouter();
const route = useRoute();
const { allTags, searchPostsWithQuery } = useBlog();

const searchQuery = ref("");
const searchResults = ref<SearchResult[]>([]);
const currentPage = ref(1);
const resultsPerPage = 10;
const searchInput = ref<HTMLInputElement>();

const popularTags = computed(() => {
  return allTags.value.slice(0, 10); // Show top 10 tags
});

const totalPages = computed(() => {
  return Math.ceil(searchResults.value.length / resultsPerPage);
});

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  return searchResults.value.slice(start, end);
});

const handleSearch = (): void => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  searchResults.value = searchPostsWithQuery(searchQuery.value);
  currentPage.value = 1;

  // Update URL with search query
  router.replace({
    path: "/blog/search",
    query: { q: searchQuery.value },
  });
};

const navigateToPost = (slug: string): void => {
  router.push(`/blog/${slug}`);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getFieldName = (field: string): string => {
  const fieldMap: Record<string, string> = {
    "frontmatter.title": "Title",
    "frontmatter.excerpt": "Excerpt",
    "frontmatter.tags": "Tags",
    rawContent: "Content",
  };
  return fieldMap[field] || field;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMatchText = (match: any): string => {
  if (typeof match.value === "string") {
    return match.value.length > 100 ? match.value.substring(0, 100) + "..." : match.value;
  }
  return String(match.value);
};

onMounted(async () => {
  // Check if there's a search query in the URL
  const query = route.query.q as string;
  if (query) {
    searchQuery.value = query;
    handleSearch();
  }

  // Focus search input
  await nextTick();
  searchInput.value?.focus();
});
</script>

<style>
@import "@/assets/blog/theme.css";
</style>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--blog-spacing-xl);
}

.search-header {
  text-align: center;
  margin-bottom: var(--blog-spacing-2xl);
}

.search-header h1 {
  font-size: var(--blog-font-size-4xl);
  margin-bottom: var(--blog-spacing-xl);
  color: var(--blog-text-primary);
}

.search-container {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: var(--blog-spacing-sm);
}

.search-input {
  flex: 1;
  font-size: var(--blog-font-size-lg);
}

.search-btn {
  font-size: var(--blog-font-size-lg);
  padding: var(--blog-spacing-sm) var(--blog-spacing-xl);
}

.results-info {
  margin-bottom: var(--blog-spacing-xl);
  padding: var(--blog-spacing-lg);
  background: var(--blog-background-light);
  border-radius: var(--blog-radius-md);
  text-align: center;
  color: var(--blog-text-secondary);
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: var(--blog-spacing-lg);
  margin-bottom: var(--blog-spacing-xl);
}

.result-card {
  padding: var(--blog-spacing-xl);
  cursor: pointer;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--blog-spacing-lg);
  font-size: 0.9rem;
  color: var(--blog-text-muted);
}

.relevance-score {
  background: var(--blog-background-lighter);
  color: var(--blog-text-muted);
  padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
  border-radius: var(--blog-radius-full);
  font-size: 0.8rem;
}

.result-card h2 {
  margin-bottom: var(--blog-spacing-lg);
  color: var(--blog-text-primary);
  line-height: var(--blog-line-height-tight);
  font-size: var(--blog-font-size-xl);
}

.excerpt {
  color: var(--blog-text-secondary);
  line-height: var(--blog-line-height-base);
  margin-bottom: var(--blog-spacing-lg);
}

.match-highlights {
  background: var(--blog-background-light);
  padding: var(--blog-spacing-lg);
  border-radius: var(--blog-radius-md);
  margin-bottom: var(--blog-spacing-lg);
  border-left: 4px solid var(--blog-primary);
}

.match-item {
  margin-bottom: var(--blog-spacing-sm);
  font-size: 0.9rem;
}

.match-field {
  font-weight: 600;
  color: var(--blog-text-primary);
  margin-right: var(--blog-spacing-sm);
}

.match-text {
  color: var(--blog-text-secondary);
}

.result-tags {
  display: flex;
  gap: var(--blog-spacing-sm);
  flex-wrap: wrap;
}

.no-results {
  text-align: center;
  padding: var(--blog-spacing-2xl);
  color: var(--blog-text-muted);
}

.no-results h3 {
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-lg);
}

.no-results p {
  margin-bottom: var(--blog-spacing-xl);
}

.search-suggestions {
  margin-top: var(--blog-spacing-xl);
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.search-suggestions h4 {
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-md);
}

.search-suggestions ul {
  padding-left: var(--blog-spacing-lg);
}

.search-suggestions li {
  margin-bottom: var(--blog-spacing-sm);
}

.search-suggestions a {
  color: var(--blog-primary);
  text-decoration: none;
  transition: color var(--blog-transition-base);
}

.search-suggestions a:hover {
  color: var(--blog-primary-dark);
}

.search-placeholder {
  text-align: center;
  padding: var(--blog-spacing-2xl);
  color: var(--blog-text-muted);
}

.search-placeholder h3 {
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-lg);
}

.search-placeholder p {
  margin-bottom: var(--blog-spacing-xl);
}

.popular-tags {
  margin-top: var(--blog-spacing-2xl);
}

.popular-tags h4 {
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-lg);
}

.tag-cloud {
  display: flex;
  gap: var(--blog-spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.tag-link {
  text-decoration: none;
  transition: all var(--blog-transition-base);
}

@media (max-width: 768px) {
  .search-page {
    padding: var(--blog-spacing-lg);
  }

  .search-header h1 {
    font-size: var(--blog-font-size-3xl);
  }

  .search-container {
    flex-direction: column;
  }

  .result-meta {
    flex-direction: column;
    gap: var(--blog-spacing-sm);
    align-items: flex-start;
  }
}
</style>
