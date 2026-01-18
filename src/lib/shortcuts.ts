// Centralized keyboard shortcuts configuration
// Single source of truth for all keyboard shortcuts in the IDE

export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

export interface ShortcutConfig {
  key: string;
  modifiers: readonly ModifierKey[];
  display: string;
}

export const SHORTCUTS = {
  // Command Palette
  COMMAND_PALETTE: { key: 'p', modifiers: ['ctrl', 'shift'] as const, display: '⌘⇧P' },
  
  // Panels
  TOGGLE_TERMINAL: { key: 't', modifiers: ['ctrl'] as const, display: '⌘T' },
  TOGGLE_CHAT: { key: 'c', modifiers: ['ctrl', 'shift'] as const, display: '⌘⇧C' },
  TOGGLE_PREVIEW: { key: 'v', modifiers: ['ctrl', 'shift'] as const, display: '⌘⇧V' },
  TOGGLE_GIT: { key: 'g', modifiers: ['ctrl'] as const, display: '⌘G' },
  
  // File Operations
  SAVE: { key: 's', modifiers: ['ctrl'] as const, display: '⌘S' },
  NEW_FILE: { key: 'n', modifiers: ['ctrl'] as const, display: '⌘N' },
  PROJECT_MANAGER: { key: 'p', modifiers: ['ctrl'] as const, display: '⌘P' },
  
  // Matrix Tools
  NEURAL_SEARCH: { key: 'f', modifiers: ['ctrl', 'shift'] as const, display: '⌘⇧F' },
  
  // Settings
  SETTINGS: { key: ',', modifiers: ['ctrl'] as const, display: '⌘,' },
  
  // Recent Files (Alt+1 through Alt+9)
  RECENT_FILE_1: { key: '1', modifiers: ['alt'] as const, display: 'Alt+1' },
  RECENT_FILE_2: { key: '2', modifiers: ['alt'] as const, display: 'Alt+2' },
  RECENT_FILE_3: { key: '3', modifiers: ['alt'] as const, display: 'Alt+3' },
  RECENT_FILE_4: { key: '4', modifiers: ['alt'] as const, display: 'Alt+4' },
  RECENT_FILE_5: { key: '5', modifiers: ['alt'] as const, display: 'Alt+5' },
  RECENT_FILE_6: { key: '6', modifiers: ['alt'] as const, display: 'Alt+6' },
  RECENT_FILE_7: { key: '7', modifiers: ['alt'] as const, display: 'Alt+7' },
  RECENT_FILE_8: { key: '8', modifiers: ['alt'] as const, display: 'Alt+8' },
  RECENT_FILE_9: { key: '9', modifiers: ['alt'] as const, display: 'Alt+9' },
} as const;

export type ShortcutKey = keyof typeof SHORTCUTS;

// Helper to check if a keyboard event matches a shortcut
export const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: ShortcutConfig
): boolean => {
  const ctrlRequired = shortcut.modifiers.includes('ctrl') || shortcut.modifiers.includes('meta');
  const shiftRequired = shortcut.modifiers.includes('shift');
  const altRequired = shortcut.modifiers.includes('alt');
  
  const ctrlMatch = ctrlRequired === (event.ctrlKey || event.metaKey);
  const shiftMatch = shiftRequired === event.shiftKey;
  const altMatch = altRequired === event.altKey;
  
  return ctrlMatch && shiftMatch && altMatch && event.key.toLowerCase() === shortcut.key.toLowerCase();
};

// Get shortcut display string for a given key
export const getShortcutDisplay = (key: ShortcutKey): string => {
  return SHORTCUTS[key].display;
};

// Get recent file shortcut by index (0-8)
export const getRecentFileShortcut = (index: number): ShortcutConfig | undefined => {
  if (index < 0 || index > 8) return undefined;
  const key = `RECENT_FILE_${index + 1}` as ShortcutKey;
  const shortcut = SHORTCUTS[key];
  return shortcut as ShortcutConfig;
};
