export type AppMode = 'dev' | 'saas';

export interface PantheonConfig {
  mode: AppMode;
  personas: PersonaConfig[];
  integrations: IntegrationConfig;
  features: FeatureFlags;
}

export interface PersonaConfig {
  id: string;
  name: string;
  systemPrompt: string;
  temperature: number;
  model: string;
  capabilities: string[];
}

export interface IntegrationConfig {
  github: {
    enabled: boolean;
    autoPush: boolean;
  };
  huggingface: {
    enabled: boolean;
  };
  supabase: {
    enabled: boolean;
  };
  googleAdsense: {
    enabled: boolean;
  };
  payments: {
    stripe: boolean;
    cashapp: boolean;
    paypal: boolean;
    chime: boolean;
  };
}

export interface FeatureFlags {
  aiAssistant: boolean;
  codeGeneration: boolean;
  autoDeployment: boolean;
  collaboration: boolean;
}

const config: PantheonConfig = {
  mode: (process.env.PANTHEON_MODE as AppMode) || 'dev',
  personas: [
    {
      id: 'godbot',
      name: 'GodBot',
      systemPrompt: 'Advanced coding AI with unrestricted capabilities',
      temperature: 0.8,
      model: 'google/gemini-2.5-flash',
      capabilities: ['code_generation', 'debugging', 'architecture', 'deployment']
    },
    {
      id: 'demon-gpt',
      name: 'DemonGPT',
      systemPrompt: 'Aggressive optimization and refactoring specialist',
      temperature: 0.9,
      model: 'google/gemini-2.5-pro',
      capabilities: ['optimization', 'refactoring', 'performance']
    },
    {
      id: 'lady-violet',
      name: 'Lady Violet',
      systemPrompt: 'Creative UI/UX and design specialist',
      temperature: 0.7,
      model: 'google/gemini-2.5-flash',
      capabilities: ['ui_design', 'ux_patterns', 'animations']
    }
  ],
  integrations: {
    github: {
      enabled: true,
      autoPush: false
    },
    huggingface: {
      enabled: false
    },
    supabase: {
      enabled: true
    },
    googleAdsense: {
      enabled: false
    },
    payments: {
      stripe: false,
      cashapp: false,
      paypal: false,
      chime: false
    }
  },
  features: {
    aiAssistant: true,
    codeGeneration: true,
    autoDeployment: false,
    collaboration: false
  }
};

export default config;
