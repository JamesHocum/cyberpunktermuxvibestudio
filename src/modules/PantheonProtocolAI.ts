import config from '../../pantheon.config';

export const summonPersona = async (personaId: string, args: string[]) => {
  const persona = config.personas.find(p => p.id === personaId.toLowerCase());
  
  if (!persona) {
    console.error(`Persona ${personaId} not found in Pantheon Protocol`);
    return null;
  }

  console.log(`🔮 Summoning ${persona.name}...`);
  console.log(`Mode: ${args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'standard'}`);
  console.log(`Capabilities: ${persona.capabilities.join(', ')}`);
  
  return {
    persona,
    mode: args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'standard',
    execute: async (prompt: string) => {
      // This would call the AI with the persona's system prompt
      console.log(`Executing with ${persona.name}: ${prompt}`);
      return {
        personaId: persona.id,
        model: persona.model,
        prompt
      };
    }
  };
};

export const getActivePersonas = () => {
  return config.personas;
};

export const isPantheonDevMode = () => {
  return config.mode === 'dev';
};
