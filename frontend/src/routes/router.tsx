import { createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "../components/auth/requireAuth";
import { AppLayout } from "../layouts/appLayout";
import { ProjectShell } from "../layouts/projectShell";
import { DashboardPage } from "../pages/dashboardPage";
import { DeploymentPage } from "../pages/deploymentPage";
import { EvidencePage } from "../pages/evidencePage";
import { LandingPage } from "../pages/landingPage";
import { LoginPage } from "../pages/loginPage";
import { ProjectFormPage } from "../pages/projectFormPage";
import { ProjectsListPage } from "../pages/projectsListPage";
import { SignupPage } from "../pages/signupPage";
import { TestRunPage } from "../pages/testRunPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "projects", element: <ProjectsListPage /> },
          { path: "projects/new", element: <ProjectFormPage /> },
          { path: "projects/:projectId/edit", element: <ProjectFormPage /> },
          {
            path: "projects/:projectId",
            element: <ProjectShell />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "deployment", element: <DeploymentPage /> },
              { path: "test-run", element: <TestRunPage /> },
              { path: "evidence", element: <EvidencePage /> },
            ],
          },
        ],
      },
    ],
  },
]);
