import { useOutletContext } from "react-router-dom";

import type { Project, Release } from "../types/domain";

export type ProjectContextValue = {
  project: Project;
  latestRelease: Release;
  releases: Release[];
};

export function useProjectContext() {
  return useOutletContext<ProjectContextValue>();
}
