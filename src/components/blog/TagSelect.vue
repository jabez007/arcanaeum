<template>
  <div class="tag-select-container" ref="containerRef">
    <div 
      class="tag-select-trigger" 
      :class="{ 'is-active': isOpen }"
      tabindex="0"
      role="button"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      ref="triggerRef"
      @click="toggleDropdown"
      @keydown.enter.self.prevent="toggleDropdown"
      @keydown.space.self.prevent="toggleDropdown"
      @keydown.down.self.prevent="openAndFocusFirst"
    >
      <div class="selected-tags-display">
        <span v-if="selectedTags.length === 0" class="placeholder">Filter by Tags...</span>
        <div v-else class="tag-chips">
          <span v-for="tag in selectedTags" :key="tag" class="tag-chip">
            {{ tag }}
            <button 
              @click.stop="removeTag(tag)" 
              class="remove-tag"
              :aria-label="`Remove tag: ${tag}`"
            >✕</button>
          </span>
        </div>
      </div>
      <div class="trigger-icons">
        <button 
          v-if="selectedTags.length > 0" 
          @click.stop="clearAll" 
          class="clear-all" 
          title="Clear All"
          aria-label="Clear all selected tags"
        >✕</button>
        <span class="chevron" :class="{ 'is-rotated': isOpen }">▼</span>
      </div>
    </div>

    <Transition name="fade-slide">
      <div v-if="isOpen" class="tag-dropdown">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search tags..." 
            ref="searchInputRef"
            @keydown.esc="closeDropdown(true)"
            @keydown.down.prevent="focusFirstOption"
            class="tag-search-input"
          />
        </div>
        
        <div class="tag-options" role="listbox" aria-multiselectable="true">
          <div 
            v-for="(tag, index) in filteredTags" 
            :key="tag" 
            class="tag-option"
            :class="{ 'is-selected': selectedTags.includes(tag) }"
            tabindex="0"
            role="option"
            :aria-selected="selectedTags.includes(tag)"
            :ref="el => { if (el) optionRefs[index] = el as HTMLElement }"
            @click="toggleTag(tag)"
            @keydown.enter.prevent="toggleTag(tag)"
            @keydown.space.prevent="toggleTag(tag)"
            @keydown.down.prevent="focusNextOption(index)"
            @keydown.up.prevent="focusPrevOption(index)"
            @keydown.esc.stop="closeDropdown(true)"
          >
            <span class="tag-name">{{ tag }}</span>
            <span class="tag-count">({{ getTagCount(tag) }})</span>
            <span v-if="selectedTags.includes(tag)" class="check-icon">✓</span>
          </div>
          
          <div v-if="filteredTags.length === 0" class="no-tags">
            No matching tags found
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, onBeforeUpdate } from 'vue';

interface Props {
  allTags: string[];
  selectedTags: string[];
  getTagCount: (tag: string) => number;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:selectedTags']);

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const optionRefs = ref<HTMLElement[]>([]);

onBeforeUpdate(() => {
  optionRefs.value = [];
});

const filteredTags = computed(() => {
  if (!searchQuery.value) return props.allTags;
  const query = searchQuery.value.toLowerCase();
  return props.allTags.filter(tag => tag.toLowerCase().includes(query));
});

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown();
  } else {
    isOpen.value = true;
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

const openAndFocusFirst = () => {
  if (!isOpen.value) {
    toggleDropdown();
  } else {
    focusFirstOption();
  }
};

const focusFirstOption = () => {
  if (optionRefs.value.length > 0) {
    optionRefs.value[0].focus();
  }
};

const focusNextOption = (index: number) => {
  if (index < optionRefs.value.length - 1) {
    optionRefs.value[index + 1].focus();
  }
};

const focusPrevOption = (index: number) => {
  if (index > 0) {
    optionRefs.value[index - 1].focus();
  } else {
    searchInputRef.value?.focus();
  }
};

const closeDropdown = (restoreFocus = false) => {
  isOpen.value = false;
  searchQuery.value = '';
  if (restoreFocus) {
    nextTick(() => {
      triggerRef.value?.focus();
    });
  }
};

const toggleTag = (tag: string) => {
  const newSelected = [...props.selectedTags];
  const index = newSelected.indexOf(tag);
  
  if (index === -1) {
    newSelected.push(tag);
  } else {
    newSelected.splice(index, 1);
  }
  
  emit('update:selectedTags', newSelected);
};

const removeTag = (tag: string) => {
  const newSelected = props.selectedTags.filter(t => t !== tag);
  emit('update:selectedTags', newSelected);
};

const clearAll = () => {
  emit('update:selectedTags', []);
};

// Handle clicks outside
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// Reset search when dropdown closes
watch(isOpen, (newVal) => {
  if (newVal) {
    // Dropdown opened, focus management is handled in toggleDropdown/openAndFocusFirst
  }
});
</script>

<style scoped>
.tag-select-container {
  position: relative;
  min-width: 250px;
  flex: 1;
  max-width: 400px;
}

.tag-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--blog-spacing-sm) var(--blog-spacing-md);
  background: var(--blog-background-elevated);
  border: 2px solid var(--blog-border);
  border-radius: var(--blog-radius-lg);
  cursor: pointer;
  transition: all var(--blog-transition-mystical);
  min-height: 42px;
}

.tag-select-trigger:hover, .tag-select-trigger.is-active {
  border-color: var(--blog-primary);
  box-shadow: var(--blog-shadow-mystical);
  background: var(--blog-background-lighter);
}

.selected-tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: var(--blog-spacing-xs);
  flex: 1;
}

.placeholder {
  color: var(--blog-text-muted);
  font-size: 0.95rem;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--blog-spacing-xs);
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--blog-primary);
  color: white;
  padding: 2px 8px;
  border-radius: var(--blog-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 0.7rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-tag:hover {
  opacity: 1;
}

.trigger-icons {
  display: flex;
  align-items: center;
  gap: var(--blog-spacing-sm);
  margin-left: var(--blog-spacing-sm);
}

.clear-all {
  background: none;
  border: none;
  color: var(--blog-text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 2px;
}

.clear-all:hover {
  color: var(--blog-error);
}

.chevron {
  font-size: 0.7rem;
  color: var(--blog-text-muted);
  transition: transform 0.3s ease;
}

.chevron.is-rotated {
  transform: rotate(180deg);
}

.tag-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--blog-background-elevated);
  border: 1px solid var(--blog-border-mystical);
  border-radius: var(--blog-radius-lg);
  box-shadow: var(--blog-shadow-lg);
  z-index: 100;
  overflow: hidden;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: var(--blog-spacing-md);
  border-bottom: 1px solid var(--blog-border);
}

.tag-search-input {
  width: 100%;
  padding: var(--blog-spacing-sm);
  background: var(--blog-background);
  border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-md);
  color: var(--blog-text-primary);
  font-size: 0.9rem;
}

.tag-search-input:focus {
  outline: none;
  border-color: var(--blog-primary);
}

.tag-options {
  overflow-y: auto;
  padding: var(--blog-spacing-sm);
}

.tag-option {
  display: flex;
  align-items: center;
  padding: var(--blog-spacing-sm) var(--blog-spacing-md);
  cursor: pointer;
  border-radius: var(--blog-radius-md);
  transition: background 0.2s;
  font-size: 0.95rem;
}

.tag-option:hover {
  background: var(--blog-background-lighter);
  color: var(--blog-primary-light);
}

.tag-option.is-selected {
  background: rgba(139, 92, 246, 0.1);
  color: var(--blog-primary-light);
}

.tag-name {
  flex: 1;
}

.tag-count {
  font-size: 0.8rem;
  color: var(--blog-text-muted);
  margin-right: var(--blog-spacing-sm);
}

.check-icon {
  color: var(--blog-primary);
  font-weight: bold;
}

.no-tags {
  padding: var(--blog-spacing-lg);
  text-align: center;
  color: var(--blog-text-muted);
  font-style: italic;
}

/* Scrollbar styling */
.tag-options::-webkit-scrollbar {
  width: 6px;
}

.tag-options::-webkit-scrollbar-track {
  background: transparent;
}

.tag-options::-webkit-scrollbar-thumb {
  background: var(--blog-border);
  border-radius: 3px;
}

.tag-options::-webkit-scrollbar-thumb:hover {
  background: var(--blog-text-muted);
}

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
