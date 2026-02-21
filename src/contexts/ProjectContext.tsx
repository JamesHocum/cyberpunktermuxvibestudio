import React, { createContext, useContext, ReactNode } from 'react';
import { useProject } from '@/hooks/useProject';

type ProjectContextType = ReturnType<typeof useProject>;

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const project = useProject();
  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
