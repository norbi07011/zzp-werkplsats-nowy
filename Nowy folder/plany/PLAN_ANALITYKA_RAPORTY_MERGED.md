# 📊 PLAN - ANALITYKA & RAPORTY (MERGED SUPER PANEL)

**Data:** 13.11.2025  
**Status:** Merge 2 kart → 1 MOCNY PANEL  
**Inspiracja:** `src/modules/invoices/pages/Reports.tsx` (348 linii gotowej logiki!)

---

## 🎯 TWOJA DECYZJA

### **BYŁO (2 karty):**

```
1. 📊 Analityka & Raporty
   - Advanced data analytics, business intelligence, real-time monitoring
   - File: pages/Admin/AnalyticsManager.tsx (383 linie)

2. 📈 Generator Raportów
   - Tworzenie raportów PDF, CSV, Excel z danymi
   - File: pages/Admin/ReportsManager.tsx (711 linii)
```

### **BĘDZIE (1 karta):**

```
📊 Analityka & Raporty
   - Wykresy wzrostu platformy
   - Statystyki wszystkich modułów
   - Pobieranie PDF/CSV/Excel
   - Live monitoring
```

---

## 🔥 CO SKOPIOWAĆ Z INVOICES/REPORTS.TSX

**Lokalizacja:** `src/modules/invoices/pages/Reports.tsx`

### **✅ SUPER LOGIKA (już działa!):**

#### **1. Year Selection Dropdown**

```tsx
const [selectedYear, setSelectedYear] = useState(currentYear.toString());

// Auto-detect available years from data
const availableYears = useMemo(() => {
  const years = new Set<number>();
  invoices.forEach((inv) => {
    const year = new Date(inv.invoice_date).getFullYear();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b - a);
}, [invoices]);

// UI
<select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
  {availableYears.map((year) => (
    <option key={year} value={year}>
      {year}
    </option>
  ))}
</select>;
```

#### **2. Summary Cards (4 metrics)**

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-100">
    <div className="text-sm text-gray-600 mb-1">Przychody brutto</div>
    <div className="text-3xl font-bold text-blue-600">{formatCurrency(yearData.totalRevenue)}</div>
    <div className="text-xs text-gray-500 mt-1">{yearData.invoicesCount} faktur</div>
  </Card>
  <!-- 3 more cards -->
</div>
```

#### **3. Monthly Breakdown**

```tsx
const monthlyData = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.invoice_date);
      return invDate.getFullYear() === year && invDate.getMonth() + 1 === month;
    });
    return {
      month,
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      revenue: monthInvoices.reduce((sum, inv) => sum + inv.total_gross, 0),
      count: monthInvoices.length,
    };
  });
  return months;
}, [selectedYear, invoices]);
```

#### **4. Quarterly Breakdown**

```tsx
const quarterlyData = useMemo(() => {
  const quarters = [
    { quarter: "Q1", months: [1, 2, 3] },
    { quarter: "Q2", months: [4, 5, 6] },
    { quarter: "Q3", months: [7, 8, 9] },
    { quarter: "Q4", months: [10, 11, 12] },
  ];
  return quarters.map((q) => {
    const qMonths = monthlyData.filter((m) => q.months.includes(m.month));
    const revenue = qMonths.reduce((sum, m) => sum + m.revenue, 0);
    return {
      quarter: q.quarter,
      revenue,
      count: qMonths.reduce((sum, m) => sum + m.count, 0),
    };
  });
}, [monthlyData]);
```

---

## 📊 NOWY PANEL - WYKRESY (nie zarobki, info o platformie!)

### **SEKCJA 1: WZROST PLATFORMY (Users Growth)**

#### **Wykres #1: Rejestracje w czasie**

```tsx
// Data source: profiles table
const userGrowth = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthUsers = profiles.filter((p) => {
      const regDate = new Date(p.created_at);
      return regDate.getFullYear() === year && regDate.getMonth() + 1 === month;
    });

    return {
      month,
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalRegistrations: monthUsers.length,
      workers: monthUsers.filter((u) => u.role === "worker").length,
      employers: monthUsers.filter((u) => u.role === "employer").length,
      companies: monthUsers.filter((u) => u.role === "company").length,
    };
  });
  return months;
}, [selectedYear, profiles]);

// CHART
<BarChart data={userGrowth}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="workers" fill="#3b82f6" name="Workers" />
  <Bar dataKey="employers" fill="#10b981" name="Employers" />
  <Bar dataKey="companies" fill="#f59e0b" name="Companies" />
</BarChart>;
```

**WYNIK:**

```
Rejestracje 2025:
Styczeń:   50 (30 Workers, 15 Employers, 5 Companies)
Luty:      75 (45 Workers, 20 Employers, 10 Companies)
Marzec:   120 (80 Workers, 30 Employers, 10 Companies)
...
```

---

#### **Wykres #2: Total Users na platformie (cumulative)**

```tsx
const cumulativeUsers = useMemo(() => {
  let totalWorkers = 0;
  let totalEmployers = 0;
  let totalCompanies = 0;

  return userGrowth.map((m) => {
    totalWorkers += m.workers;
    totalEmployers += m.employers;
    totalCompanies += m.companies;

    return {
      monthName: m.monthName,
      totalWorkers,
      totalEmployers,
      totalCompanies,
      totalUsers: totalWorkers + totalEmployers + totalCompanies,
    };
  });
}, [userGrowth]);

// CHART - Line Chart
<LineChart data={cumulativeUsers}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="totalUsers" stroke="#8b5cf6" strokeWidth={3} />
  <Line type="monotone" dataKey="totalWorkers" stroke="#3b82f6" />
  <Line type="monotone" dataKey="totalEmployers" stroke="#10b981" />
</LineChart>;
```

**WYNIK:**

```
Total Users Growth:
Styczeń:     50 users
Luty:       125 users (+75)
Marzec:     245 users (+120)
...
Grudzień: 1,250 users
```

---

### **SEKCJA 2: AKTYWNOŚĆ (Activity)**

#### **Wykres #3: Odwiedziny strony (visits)**

```tsx
// Data source: activity_logs (jeśli będzie) lub analytics tracking
const monthlyVisits = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;

    // Jeśli masz activity_logs:
    const monthVisits = activityLogs.filter((log) => {
      const logDate = new Date(log.created_at);
      return (
        logDate.getFullYear() === year &&
        logDate.getMonth() + 1 === month &&
        log.action === "page.viewed"
      );
    });

    // Unique users
    const uniqueUsers = new Set(monthVisits.map((v) => v.user_id)).size;

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalVisits: monthVisits.length,
      uniqueUsers,
    };
  });
  return months;
}, [selectedYear, activityLogs]);

// CHART
<AreaChart data={monthlyVisits}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="totalVisits" fill="#8b5cf6" stroke="#8b5cf6" />
  <Area type="monotone" dataKey="uniqueUsers" fill="#3b82f6" stroke="#3b82f6" />
</AreaChart>;
```

---

#### **Wykres #4: Aktywne vs Nieaktywne konta**

```tsx
const activityStatus = useMemo(() => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const active = profiles.filter(
    (p) => new Date(p.last_sign_in_at) > thirtyDaysAgo
  ).length;
  const inactive30 = profiles.filter((p) => {
    const lastLogin = new Date(p.last_sign_in_at);
    return lastLogin > sixtyDaysAgo && lastLogin <= thirtyDaysAgo;
  }).length;
  const inactive60 = profiles.filter(
    (p) => new Date(p.last_sign_in_at) <= sixtyDaysAgo
  ).length;

  return [
    { name: "Aktywne (<30 dni)", value: active, fill: "#10b981" },
    { name: "Nieaktywne (30-60 dni)", value: inactive30, fill: "#f59e0b" },
    { name: "Nieaktywne (>60 dni)", value: inactive60, fill: "#ef4444" },
  ];
}, [profiles]);

// PIE CHART
<PieChart>
  <Pie
    data={activityStatus}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
  >
    {activityStatus.map((entry, index) => (
      <Cell key={index} fill={entry.fill} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>;
```

---

### **SEKCJA 3: JOBS & APPLICATIONS**

#### **Wykres #5: Oferty pracy publikowane**

```tsx
const jobsPublished = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthJobs = jobs.filter((j) => {
      const jobDate = new Date(j.created_at);
      return jobDate.getFullYear() === year && jobDate.getMonth() + 1 === month;
    });

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalJobs: monthJobs.length,
      activeJobs: monthJobs.filter((j) => j.status === "active").length,
      closedJobs: monthJobs.filter((j) => j.status === "closed").length,
    };
  });
  return months;
}, [selectedYear, jobs]);

// CHART
<BarChart data={jobsPublished}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="totalJobs" fill="#3b82f6" />
</BarChart>;
```

---

#### **Wykres #6: Aplikacje na joby**

```tsx
const jobApplications = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthApps = applications.filter((a) => {
      const appDate = new Date(a.created_at);
      return appDate.getFullYear() === year && appDate.getMonth() + 1 === month;
    });

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalApplications: monthApps.length,
      accepted: monthApps.filter((a) => a.status === "accepted").length,
      rejected: monthApps.filter((a) => a.status === "rejected").length,
      pending: monthApps.filter((a) => a.status === "pending").length,
    };
  });
  return months;
}, [selectedYear, applications]);

// STACKED BAR CHART
<BarChart data={jobApplications}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="accepted" stackId="a" fill="#10b981" />
  <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
  <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
</BarChart>;
```

---

### **SEKCJA 4: CERTYFIKATY**

#### **Wykres #7: Certyfikaty uploadowane**

```tsx
const certificatesUploaded = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthCerts = certificates.filter((c) => {
      const certDate = new Date(c.created_at);
      return (
        certDate.getFullYear() === year && certDate.getMonth() + 1 === month
      );
    });

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      total: monthCerts.length,
      verified: monthCerts.filter((c) => c.status === "verified").length,
      pending: monthCerts.filter((c) => c.status === "pending").length,
      rejected: monthCerts.filter((c) => c.status === "rejected").length,
    };
  });
  return months;
}, [selectedYear, certificates]);

// AREA CHART
<AreaChart data={certificatesUploaded}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="total" fill="#8b5cf6" stroke="#8b5cf6" />
</AreaChart>;
```

---

### **SEKCJA 5: PŁATNOŚCI (Payment Analytics)**

#### **Wykres #8: Przychody platformy (payments)**

```tsx
const revenueData = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthPayments = payments.filter((p) => {
      const payDate = new Date(p.created_at);
      return payDate.getFullYear() === year && payDate.getMonth() + 1 === month;
    });

    const totalRevenue = monthPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const subscriptions = monthPayments.filter(
      (p) => p.type === "subscription"
    );
    const oneTime = monthPayments.filter((p) => p.type === "one_time");

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalRevenue,
      subscriptionRevenue: subscriptions.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      ),
      oneTimeRevenue: oneTime.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  });
  return months;
}, [selectedYear, payments]);

// COMPOSED CHART (bar + line)
<ComposedChart data={revenueData}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="subscriptionRevenue" fill="#8b5cf6" name="Subskrypcje" />
  <Bar dataKey="oneTimeRevenue" fill="#3b82f6" name="Jednorazowe" />
  <Line
    type="monotone"
    dataKey="totalRevenue"
    stroke="#10b981"
    strokeWidth={2}
    name="Total"
  />
</ComposedChart>;
```

---

### **SEKCJA 6: MESSAGES & COMMUNICATION**

#### **Wykres #9: Wiadomości wysłane**

```tsx
const messagesStats = useMemo(() => {
  const year = parseInt(selectedYear);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthMessages = messages.filter((m) => {
      const msgDate = new Date(m.created_at);
      return msgDate.getFullYear() === year && msgDate.getMonth() + 1 === month;
    });

    return {
      monthName: new Date(year, i, 1).toLocaleDateString("pl-PL", {
        month: "long",
      }),
      totalMessages: monthMessages.length,
      read: monthMessages.filter((m) => m.read).length,
      unread: monthMessages.filter((m) => !m.read).length,
    };
  });
  return months;
}, [selectedYear, messages]);

// LINE CHART
<LineChart data={messagesStats}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="totalMessages" stroke="#8b5cf6" />
</LineChart>;
```

---

## 📥 EXPORT FUNCTIONALITY (PDF, CSV, Excel)

**Skopiuj z ReportsManager.tsx:**

```tsx
const handleExportPDF = async () => {
  // Generate PDF with all charts + data
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Raport Analityczny ZZP Werkplaats", 20, 20);

  // Year
  doc.setFontSize(12);
  doc.text(`Rok: ${selectedYear}`, 20, 30);

  // Summary stats
  doc.text(`Total Users: ${profiles.length}`, 20, 40);
  doc.text(`Total Jobs: ${jobs.length}`, 20, 50);
  doc.text(`Total Payments: €${totalRevenue}`, 20, 60);

  // Charts (as images - use html2canvas)
  // ...

  doc.save(`raport-${selectedYear}.pdf`);
};

const handleExportCSV = () => {
  // Generate CSV with monthly data
  const csv = [
    ["Miesiąc", "Rejestracje", "Odwiedziny", "Joby", "Aplikacje", "Przychody"],
    ...monthlyData.map((m) => [
      m.monthName,
      m.registrations,
      m.visits,
      m.jobs,
      m.applications,
      m.revenue,
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `raport-${selectedYear}.csv`;
  a.click();
};

const handleExportExcel = () => {
  // Use SheetJS (xlsx library)
  const ws = XLSX.utils.json_to_sheet(monthlyData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Raport");
  XLSX.writeFile(wb, `raport-${selectedYear}.xlsx`);
};
```

---

## 🎨 UI LAYOUT - FINAL PANEL

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <div className="max-w-[1800px] mx-auto p-6 space-y-6">

    {/* HEADER */}
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 rounded-3xl">
      <h1 className="text-4xl font-bold text-white">📊 Analityka & Raporty</h1>
      <p className="text-purple-100">Kompleksowa analiza platformy ZZP Werkplaats</p>

      <div className="flex gap-4 mt-4">
        {/* Year Selector */}
        <select value={selectedYear} onChange={...}>
          {availableYears.map(y => <option>{y}</option>)}
        </select>

        {/* Export Buttons */}
        <button onClick={handleExportPDF}>📄 Export PDF</button>
        <button onClick={handleExportCSV}>📊 Export CSV</button>
        <button onClick={handleExportExcel}>📗 Export Excel</button>
      </div>
    </div>

    {/* SUMMARY CARDS (4 big stats) */}
    <div className="grid grid-cols-4 gap-6">
      <StatCard title="Total Users" value={profiles.length} icon="👤" />
      <StatCard title="Total Jobs" value={jobs.length} icon="💼" />
      <StatCard title="Total Revenue" value={`€${totalRevenue}`} icon="💰" />
      <StatCard title="Active Today" value={activeToday} icon="⚡" />
    </div>

    {/* CHARTS GRID */}
    <div className="grid grid-cols-2 gap-6">

      {/* Chart 1: User Growth */}
      <ChartCard title="Wzrost Użytkowników">
        <BarChart data={userGrowth} />
      </ChartCard>

      {/* Chart 2: Cumulative Users */}
      <ChartCard title="Total Users (Cumulative)">
        <LineChart data={cumulativeUsers} />
      </ChartCard>

      {/* Chart 3: Monthly Visits */}
      <ChartCard title="Odwiedziny Platformy">
        <AreaChart data={monthlyVisits} />
      </ChartCard>

      {/* Chart 4: Activity Status */}
      <ChartCard title="Aktywność Kont">
        <PieChart data={activityStatus} />
      </ChartCard>

      {/* Chart 5: Jobs Published */}
      <ChartCard title="Oferty Pracy">
        <BarChart data={jobsPublished} />
      </ChartCard>

      {/* Chart 6: Job Applications */}
      <ChartCard title="Aplikacje na Joby">
        <StackedBarChart data={jobApplications} />
      </ChartCard>

      {/* Chart 7: Certificates */}
      <ChartCard title="Certyfikaty">
        <AreaChart data={certificatesUploaded} />
      </ChartCard>

      {/* Chart 8: Revenue */}
      <ChartCard title="Przychody Platformy">
        <ComposedChart data={revenueData} />
      </ChartCard>

      {/* Chart 9: Messages */}
      <ChartCard title="Wiadomości">
        <LineChart data={messagesStats} />
      </ChartCard>

    </div>

    {/* DETAILED TABLES (expandable) */}
    <Accordion>
      <AccordionItem title="Miesięczne Dane Szczegółowe">
        <Table data={monthlyData} />
      </AccordionItem>
      <AccordionItem title="Kwartalne Podsumowanie">
        <Table data={quarterlyData} />
      </AccordionItem>
    </Accordion>

  </div>
</div>
```

---

## 🚀 IMPLEMENTATION PLAN

### **OPCJA 1: Usuń stare + zrób nowy (REKOMENDOWANE)**

**Dlaczego:**

- AnalyticsManager.tsx (383 linie) - nieznana logika
- ReportsManager.tsx (711 linii) - za duży, skomplikowany
- Invoices/Reports.tsx (348 linii) - DZIAŁA, prosty, czysty

**Plan:**

```
1. DELETE:
   - pages/Admin/AnalyticsManager.tsx
   - pages/Admin/ReportsManager.tsx
   - src/hooks/useAnalytics.ts
   - src/hooks/useReports.ts

2. CREATE NEW:
   - pages/Admin/AnalyticsDashboard.tsx (500 linii)

3. SKOPIUJ LOGIKĘ:
   - Year selector z Invoices/Reports.tsx
   - useMemo patterns dla monthly/quarterly
   - Summary cards layout
   - Export PDF/CSV/Excel buttons

4. DODAJ WYKRESY:
   - Install: recharts library
   - 9 wykresów jak wyżej
   - Responsive grid layout
```

**Czas:** 6-8 godzin

---

### **OPCJA 2: Edytuj istniejące (NIE polecam)**

**Dlaczego NIE:**

- 383 + 711 = 1,094 linii do przeczytania/zrozumienia
- Nieznana logika (może bugs)
- Trudniej utrzymać
- Ryzyko crashów

**Ale jeśli chcesz:**

```
1. Przeczytaj całe AnalyticsManager.tsx
2. Przeczytaj całe ReportsManager.tsx
3. Merge logic do jednego pliku
4. Dodaj wykresy
5. Test wszystko
```

**Czas:** 10-15 godzin (więcej debugowania)

---

## ✅ MOJA REKOMENDACJA

**OPCJA 1 - Usuń stare, zrób nowy!**

**Powody:**

1. ✅ Masz GOTOWĄ logikę w Invoices/Reports (348 linii)
2. ✅ Year selector działa
3. ✅ Monthly/quarterly breakdowns działają
4. ✅ Export PDF/CSV działa
5. ✅ Czysty kod, łatwy do rozbudowy
6. ✅ Mniej bugów (fresh start)

**Co zrobić:**

```
1. Wieczorem: Usuń AnalyticsManager + ReportsManager
2. Stwórz AnalyticsDashboard.tsx (nowy, czysty)
3. Skopiuj logikę z Invoices/Reports
4. Dodaj 9 wykresów (recharts)
5. Test + polish UI
```

---

## ❓ PYTANIE DO CIEBIE

**Którą opcję wybierasz?**

- [ ] **OPCJA 1** - Usuń stare, zrób nowy (6-8h, clean)
- [ ] **OPCJA 2** - Edytuj stare (10-15h, risky)

**Jeśli OPCJA 1 - które wykresy chcesz?**

```
- [ ] Wykres 1: User Growth (rejestracje)
- [ ] Wykres 2: Cumulative Users (total)
- [ ] Wykres 3: Monthly Visits (odwiedziny)
- [ ] Wykres 4: Activity Status (aktywne/nieaktywne)
- [ ] Wykres 5: Jobs Published (oferty pracy)
- [ ] Wykres 6: Job Applications (aplikacje)
- [ ] Wykres 7: Certificates (certyfikaty)
- [ ] Wykres 8: Revenue (przychody)
- [ ] Wykres 9: Messages (wiadomości)
- [ ] WSZYSTKIE 9 wykresów
```

**Czekam na decyzję!** 🚀

---

**Koniec planu**  
**Autor:** GitHub Copilot  
**Data:** 13.11.2025
