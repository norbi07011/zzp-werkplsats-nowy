// Analiza wszystkich tabel w bazie danych Supabase
import { createClient } from "@supabase/supabase-js";

// Note: This is a diagnostic script, using service_role key for full database access
const supabaseUrl = "https://dtnotuyagygexmkyqtgb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bm90dXlhZ3lnZXhta3lxdGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4NTMzMCwiZXhwIjoyMDc1MzYxMzMwfQ.H-_sd9_qn40CfLD_dFschmDKkTbPP57lcfqp-20RVk8";

// Service role client for diagnostic purposes only
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTables() {
  console.log("🔍 ANALIZA WSZYSTKICH TABEL W BAZIE DANYCH\n");
  console.log("=".repeat(80));

  // Lista tabel do sprawdzenia
  const tables = [
    "profiles",
    "workers",
    "employers",
    "cleaning_companies",
    "messages",
    "notifications",
    "reviews",
    "cleaning_reviews",
    "profile_views",
    "contact_attempts",
    "applications",
    "jobs",
    "certificates",
    "worker_portfolio",
    "worker_availability",
    "worker_skills",
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`❌ ${table.padEnd(25)} - BRAK (${error.message})`);
      } else {
        console.log(`✅ ${table.padEnd(25)} - ${count || 0} rekordów`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(25)} - ERROR: ${err}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 SZCZEGÓŁOWA ANALIZA CLEANING COMPANIES:\n");

  // Analiza cleaning_companies
  try {
    const { data: cleaningCompanies, error } = await supabase
      .from("cleaning_companies")
      .select("*");

    if (error) {
      console.log("❌ cleaning_companies NIE ISTNIEJE:", error.message);
    } else {
      console.log(
        `✅ cleaning_companies: ${cleaningCompanies?.length || 0} firm\n`
      );

      if (cleaningCompanies && cleaningCompanies.length > 0) {
        console.log("📋 Lista firm sprzątających:");
        cleaningCompanies.forEach((company: any, i: number) => {
          console.log(`\n${i + 1}. ${company.company_name || "BRAK NAZWY"}`);
          console.log(`   ID: ${company.id}`);
          console.log(`   Profile ID: ${company.profile_id}`);
          console.log(`   Email: ${company.email}`);
          console.log(
            `   Portfolio: ${company.portfolio_images?.length || 0} zdjęć`
          );
          console.log(
            `   Opinie: ${company.total_reviews || 0} (średnia: ${
              company.average_rating
            })`
          );
        });
      }
    }
  } catch (err) {
    console.log("❌ ERROR przy cleaning_companies:", err);
  }

  // Analiza profile_views
  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 ANALIZA profile_views:\n");

  try {
    const { data: views, error } = await supabase
      .from("profile_views")
      .select("*")
      .limit(5);

    if (error) {
      console.log("❌ profile_views NIE ISTNIEJE:", error.message);
      console.log("   Trzeba użyć workers.profile_views (integer counter)");
    } else {
      console.log(
        `✅ profile_views istnieje: ${views?.length || 0} rekordów (pokazuję 5)`
      );
      if (views && views.length > 0) {
        views.forEach((view: any) => {
          console.log(
            `   - ${view.cleaning_company_id || view.worker_id} wyświetlony ${
              view.viewed_at
            }`
          );
        });
      }
    }
  } catch (err) {
    console.log("❌ ERROR:", err);
  }

  // Analiza contact_attempts
  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 ANALIZA contact_attempts:\n");

  try {
    const { data: contacts, error } = await supabase
      .from("contact_attempts")
      .select("*")
      .limit(5);

    if (error) {
      console.log("❌ contact_attempts NIE ISTNIEJE:", error.message);
    } else {
      console.log(
        `✅ contact_attempts istnieje: ${contacts?.length || 0} rekordów`
      );
    }
  } catch (err) {
    console.log("❌ ERROR:", err);
  }

  // Analiza messages
  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 ANALIZA messages:\n");

  try {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, subject, created_at")
      .limit(5);

    if (error) {
      console.log("❌ messages ERROR:", error.message);
    } else {
      console.log(
        `✅ messages: ${messages?.length || 0} wiadomości (pokazuję 5)`
      );
      if (messages && messages.length > 0) {
        messages.forEach((msg: any) => {
          console.log(
            `   - "${msg.subject}" (${msg.sender_id} → ${msg.recipient_id})`
          );
        });
      }
    }
  } catch (err) {
    console.log("❌ ERROR:", err);
  }

  // Analiza notifications
  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 ANALIZA notifications:\n");

  try {
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, read, created_at")
      .limit(5);

    if (error) {
      console.log("❌ notifications ERROR:", error.message);
    } else {
      console.log(
        `✅ notifications: ${
          notifications?.length || 0
        } powiadomień (pokazuję 5)`
      );
      if (notifications && notifications.length > 0) {
        notifications.forEach((notif: any) => {
          console.log(
            `   - [${notif.type}] ${notif.title} (read: ${notif.read})`
          );
        });
      }
    }
  } catch (err) {
    console.log("❌ ERROR:", err);
  }

  // Analiza reviews vs cleaning_reviews
  console.log("\n" + "=".repeat(80));
  console.log("\n🔎 ANALIZA REVIEWS:\n");

  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    const { data: cleaningReviews, error: cleaningError } = await supabase
      .from("cleaning_reviews")
      .select("*", { count: "exact", head: true });

    console.log(
      `reviews: ${reviewsError ? "❌ BRAK" : `✅ ${reviews || 0} rekordów`}`
    );
    console.log(
      `cleaning_reviews: ${
        cleaningError ? "❌ BRAK" : `✅ ${cleaningReviews || 0} rekordów`
      }`
    );
  } catch (err) {
    console.log("❌ ERROR:", err);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ ANALIZA ZAKOŃCZONA\n");
}

analyzeTables().catch(console.error);
