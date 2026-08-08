import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/appLayout";
import { DashboardPage } from "../pages/dashboardPage";
import { DeploymentPage } from "../pages/deploymentPage";
import { EvidencePage } from "../pages/evidencePage";
import { TestRunPage } from "../pages/testRunPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "deployment", element: <DeploymentPage /> },
      { path: "test-run", element: <TestRunPage /> },
      { path: "evidence", element: <EvidencePage /> },
    ],
  },
]);
