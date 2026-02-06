/**
 * Extension Loader Utility
 * Dynamically loads and initializes community extensions
 */

interface ExtensionModule {
  default?: () => void | Promise<void>;
  init?: () => void | Promise<void>;
  name?: string;
  version?: string;
}

// Track loaded extensions to prevent duplicates
const loadedExtensions = new Set<string>();

/**
 * Load and initialize an extension from a URL
 * Uses dynamic import with Vite ignore to load external modules
 */
export const loadExtension = async (url: string): Promise<void> => {
  // Prevent loading the same extension twice
  if (loadedExtensions.has(url)) {
    console.log(`Extension already loaded: ${url}`);
    return;
  }

  try {
    // Use Vite's ignore comment to allow external dynamic imports
    const module: ExtensionModule = await import(/* @vite-ignore */ url);
    
    // Mark as loaded
    loadedExtensions.add(url);
    
    // Initialize the extension
    if (module.default && typeof module.default === 'function') {
      await module.default();
      console.log(`Extension initialized (default): ${module.name || url}`);
    } else if (module.init && typeof module.init === 'function') {
      await module.init();
      console.log(`Extension initialized (init): ${module.name || url}`);
    } else {
      console.log(`Extension loaded (no init): ${url}`);
    }
  } catch (err) {
    loadedExtensions.delete(url); // Allow retry on failure
    console.error('Failed to load extension:', err);
    throw new Error(`Failed to load extension from ${url}`);
  }
};

/**
 * Unload an extension (remove from loaded set)
 * Note: This doesn't actually unload the module from memory,
 * it just allows it to be reloaded if needed
 */
export const unloadExtension = (url: string): void => {
  loadedExtensions.delete(url);
};

/**
 * Check if an extension is loaded
 */
export const isExtensionLoaded = (url: string): boolean => {
  return loadedExtensions.has(url);
};

/**
 * Get all loaded extension URLs
 */
export const getLoadedExtensions = (): string[] => {
  return [...loadedExtensions];
};

/**
 * Clear all loaded extensions (for development/testing)
 */
export const clearLoadedExtensions = (): void => {
  loadedExtensions.clear();
};
