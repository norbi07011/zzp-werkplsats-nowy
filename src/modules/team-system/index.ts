/**
 * ================================================================
 * TEAM SYSTEM - BARREL EXPORTS
 * ================================================================
 * Moduł systemu drużyny przeniesiony z BetonCoat B.V.
 */

// Types
export * from "./types";

// Translations
export * from "./translations";

// Context
export { TeamStoreProvider, useTeamStore } from "./context/TeamStoreContext";

// Pages
export { default as TeamPage } from "./pages/TeamPage";
export { ProjectsAndTasks } from "./pages/ProjectsAndTasks";
export { Dashboard as TeamDashboard } from "./pages/TeamDashboard";
export { CalendarPage } from "./pages/CalendarPage";
export { ChatPage } from "./pages/ChatPage";
export { RankingPage } from "./pages/RankingPage";

// Worker Pages
export { WorkerTeamDashboard } from "./pages/worker/WorkerTeamDashboard";
