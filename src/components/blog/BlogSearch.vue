<template>
  <div class="search-page">
    <header class="search-header">
      <h1>Search Blog</h1>
      <div class="search-container">
        <input v-model="searchQuery" type="text" placeholder="Search posts, tags, or content..." class="search-input"
          @input="handleSearch" @keyup.enter="handleSearch" ref="searchInput" />
        <button @click="handleSearch" class="search-btn">Search</button>
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
        <article v-for="result in paginatedResults" :key="result.post.slug" class="result-card"
          @click="navigateToPost(result.post.slug)">
          <div class="result-meta">
            <time>{{ formatDate(result.post.frontmatter.date) }}</time>
            <span class="relevance-score">{{ Math.round((1 - result.score) * 100) }}% match</span>
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
            <span v-for="tag in result.post.frontmatter.tags.slice(0, 3)" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </article>
      </div>

      <!-- Pagination for search results -->
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
          <router-link v-for="tag in popularTags" :key="tag" :to="`/blog/tag/${tag}`" class="tag-link">
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

<style scoped>
.search-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  text-align: center;
  margin-bottom: 3rem;
}

.search-header h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.search-container {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1.1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-btn {
  padding: 1rem 2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.3s ease;
}

.search-btn:hover {
  background: #2980b9;
}

.results-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.relevance-score {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.result-card h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
  line-height: 1.3;
}

.excerpt {
  color: #5a6c7d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.match-highlights {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #3498db;
}

.match-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.match-field {
  font-weight: 600;
  color: #2c3e50;
  margin-right: 0.5rem;
}

.match-text {
  color: #5a6c7d;
}

.result-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.search-suggestions {
  margin-top: 2rem;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.search-suggestions ul {
  padding-left: 1.5rem;
}

.search-suggestions li {
  margin-bottom: 0.5rem;
}

.search-placeholder {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.popular-tags {
  margin-top: 3rem;
}

.tag-cloud {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.tag-link {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.tag-link:hover {
  background: #3498db;
  color: white;
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
  .search-container {
    flex-direction: column;
  }

  .result-meta {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
