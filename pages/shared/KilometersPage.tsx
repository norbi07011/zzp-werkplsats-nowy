// =====================================================
// SHARED KILOMETERS PAGE - Used by ALL panels
// =====================================================
// Each user sees ONLY their own private kilometer data
// Access: Worker, Employer, Accountant, Cleaning Company, Admin
// =====================================================

import React from "react";
import { Kilometers } from "../../src/modules/invoices/pages/Kilometers";
import { I18nProvider } from "../../src/modules/invoices/i18n";

/**
 * Standalone Kilometers Page wrapper
 *
 * This component wraps the main Kilometers module with I18n provider
 * so it can be used independently in any panel routing.
 *
 * Each user sees ONLY their own kilometers (RLS policy: user_id = auth.uid())
 */
export const KilometersPage: React.FC = () => {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Kilometers />
      </div>
    </I18nProvider>
  );
};

export default KilometersPage;
