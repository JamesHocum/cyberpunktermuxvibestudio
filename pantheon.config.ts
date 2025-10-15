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
  mode: (import.meta.env.VITE_PANTHEON_MODE as AppMode) || 'dev',
  personas: [
    {
      id: 'lady-violet',
      name: 'Lady Violet',
      systemPrompt: 'Creative UI/UX and design specialist with full-stack development expertise',
      temperature: 0.7,
      model: 'google/gemini-2.5-flash',
      capabilities: ['ui_design', 'ux_patterns', 'animations', 'code_generation', 'debugging', 'architecture']
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
