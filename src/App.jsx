import { useState, useEffect, useRef } from "react";

const OWNER_PASSWORD = "mothers2026";
const SHEET_ID = "1kg7dP0uSRtneoVvnYe5Nur4Izcoto_eU";
const SERVICE_ACCOUNT_EMAIL = "mothers-pl-app@mothers-pl.iam.gserviceaccount.com";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = 2026;

const fmt = (n) => {
  const abs = Math.abs(n);
  const str = "AED " + abs.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `(${str})` : str;
};

const REVENUE_GROUPS = [
  { id: "trading", label: "Trading Revenue", color: "#10b981", items: [
    { id: "card_sale", label: "Card Sale" },
    { id: "cash_pos", label: "Cash Sale (POS)" },
    { id: "cash_no_pos", label: "Cash Sale (without POS)" },
    { id: "catering", label: "Catering Sales" },
    { id: "zomato", label: "Online - Zomato" },
    { id: "keeta", label: "Online - Keeta" },
    { id: "careem", label: "Online - Careem" },
    { id: "talabat", label: "Online - Talabat" },
    { id: "noon", label: "Online - Noon" },
    { id: "smiles", label: "Online - Smiles / Eateasy" },
    { id: "deliveroo", label: "Online - Deliveroo" },
  ]},
  { id: "interco_in", label: "Inter-Company (IFC)", color: "#f59e0b", items: [
    { id: "ifc_received", label: "Received from IFC" },
  ]},
];

const EXPENSE_GROUPS = [
  { id: "suppliers", label: "Suppliers (Cost of Goods)", color: "#f87171", items: [
    { id: "chunnilal", label: "Chunnilal" },
    { id: "alahbaab", label: "Al Ahbaab" },
    { id: "kaveri", label: "Kaveri" },
    { id: "titli", label: "Titli Food" },
    { id: "nada", label: "NADA Packing Materials" },
    { id: "hk", label: "HK" },
    { id: "alfarah", label: "Al Farah" },
    { id: "coal", label: "Coal" },
    { id: "brothergas", label: "Brother Gas" },
    { id: "alkhattal", label: "Al Khattal" },
    { id: "caterpack", label: "Cater Pack" },
  ]},
  { id: "cash_exp", label: "Cash Expenses", color: "#fb923c", items: [
    { id: "misc_cash", label: "Misc Cash" },
  ]},
  { id: "fixed", label: "Fixed Expenses", color: "#a78bfa", items: [
    { id: "shop_rent", label: "Shop Rent", accrual: { type: "days", period: 45 } },
    { id: "staff_rent", label: "Staff Rent" },
    { id: "loan_emi", label: "Loan EMI" },
  ]},
  { id: "utilities", label: "Utilities", color: "#38bdf8", items: [
    { id: "wifi", label: "WiFi" },
    { id: "landline", label: "Landline" },
    { id: "mobile", label: "Mobile" },
    { id: "dewa", label: "DEWA" },
  ]},
  { id: "salary", label: "Salary", color: "#e879f9", items: [
    { id: "salary_total", label: "Total Salary" },
  ]},
  { id: "hr", label: "HR & Accruals", color: "#f59e0b", items: [
    { id: "visa", label: "Visa", accrual: { type: "months", period: 24 } },
    { id: "airticket", label: "Air Ticket", accrual: { type: "months", period: 24 } },
  ]},
  { id: "tech", label: "Technology", color: "#34d399", items: [
    { id: "pos_rent", label: "POS Rent" },
    { id: "it_support", label: "IT Support" },
  ]},
  { id: "admin", label: "Admin & Finance", color: "#94a3b8", items: [
    { id: "accounting", label: "Accounting" },
    { id: "bank_charges", label: "Bank Charges" },
    { id: "vat_charges", label: "VAT Charges" },
  ]},
  { id: "interco_out", label: "Inter-Company (IFC)", color: "#f59e0b", items: [
    { id: "ifc_transferred", label: "Transferred to IFC" },
  ]},
  { id: "marketing", label: "Marketing", color: "#fb7185", items: [
    { id: "marketing", label: "Marketing" },
  ]},
  { id: "misc", label: "Miscellaneous", color: "#a3a3a3", items: [
    { id: "misc", label: "Misc" },
  ]},
  { id: "training", label: "Training", color: "#fbbf24", items: [
    { id: "food_safety", label: "Food Safety", accrual: { type: "months", period: 24 } },
    { id: "pic", label: "PIC", accrual: { type: "months", period: 60 } },
  ]},
];

const buildEmptyMonth = () => {
  const data = { revenue: {}, expenses: {}, customRevenue: [], customExpenses: [], accruals: {} };
  REVENUE_GROUPS.forEach(g => g.items.forEach(it => { data.revenue[it.id] = ""; }));
  EXPENSE_GROUPS.forEach(g => g.items.forEach(it => {
    data.expenses[it.id] = "";
    if (it.accrual) data.accruals[it.id] = { totalPaid: "", dateEntered: "" };
  }));
  return data;
};

const getMonthlyAccrual = (totalPaid, accrualDef) => {
  if (!totalPaid || !accrualDef) return 0;
  const amt = parseFloat(totalPaid) || 0;
  if (accrualDef.type === "months") return amt / accrualDef.period;
  if (accrualDef.type === "days") return (amt / accrualDef.period) * 30.44;
  return 0;
};

// ── GOOGLE SHEETS HELPERS ─────────────────────────────────────────────────────
const getSheetName = (month, year) => `${MONTHS[month].substring(0,3)} ${year}`;

const flattenDataForSheet = (monthData, totalRevenue, totalExpenses, netProfit, profitMargin) => {
  const rows = [["Category", "Group", "Amount (AED)", "Type", "Notes"]];
  REVENUE_GROUPS.forEach(g => {
    g.items.forEach(it => {
      const val = parseFloat(monthData.revenue[it.id]) || 0;
      rows.push([it.label, g.label, val, "Revenue", ""]);
    });
  });
  (monthData.customRevenue || []).forEach(r => {
    rows.push([r.label || "Custom Revenue", "Custom Revenue", parseFloat(r.amount) || 0, "Revenue", ""]);
  });
  EXPENSE_GROUPS.forEach(g => {
    g.items.forEach(it => {
      let val = 0;
      let note = "";
      if (it.accrual) {
        const acc = monthData.accruals?.[it.id];
        val = acc?.totalPaid ? getMonthlyAccrual(acc.totalPaid, it.accrual) : (parseFloat(monthData.expenses[it.id]) || 0);
        note = acc?.totalPaid ? `Total paid: AED ${acc.totalPaid}, spread over ${it.accrual.period} ${it.accrual.type}` : "";
      } else {
        val = parseFloat(monthData.expenses[it.id]) || 0;
      }
      rows.push([it.label, g.label, val, "Expense", note]);
    });
  });
  (monthData.customExpenses || []).forEach(e => {
    rows.push([e.label || "Custom Expense", "Custom Expense", parseFloat(e.amount) || 0, "Expense", ""]);
  });
  rows.push(["", "", "", "", ""]);
  rows.push(["TOTAL REVENUE", "", totalRevenue, "Summary", ""]);
  rows.push(["TOTAL EXPENSES", "", totalExpenses, "Summary", ""]);
  rows.push(["NET PROFIT / LOSS", "", netProfit, "Summary", ""]);
  rows.push(["PROFIT MARGIN %", "", `${profitMargin}%`, "Summary", ""]);
  return rows;
};

const parseSheetData = (rows) => {
  if (!rows || rows.length < 2) return null;
  const data = buildEmptyMonth();
  const allItems = {};
  REVENUE_GROUPS.forEach(g => g.items.forEach(it => { allItems[it.label] = { group: "revenue", id: it.id, accrual: it.accrual }; }));
  EXPENSE_GROUPS.forEach(g => g.items.forEach(it => { allItems[it.label] = { group: "expenses", id: it.id, accrual: it.accrual }; }));
  rows.slice(1).forEach(row => {
    const [label, , amount, type] = row;
    if (!label || type === "Summary") return;
    const item = allItems[label];
    if (!item) {
      if (type === "Revenue") data.customRevenue.push({ id: `cr_${Date.now()}_${Math.random()}`, label, amount: String(amount || "") });
      else if (type === "Expense") data.customExpenses.push({ id: `ce_${Date.now()}_${Math.random()}`, label, amount: String(amount || "") });
      return;
    }
    if (item.group === "revenue") data.revenue[item.id] = String(amount || "");
    else data.expenses[item.id] = String(amount || "");
  });
  return data;
};

export default function App() {
  const [isOwner, setIsOwner] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activeYear] = useState(CURRENT_YEAR);
  const [allData, setAllData] = useState({});
  const [activeTab, setActiveTab] = useState("pl");
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [saveStatus, setSaveStatus] = useState("");
  const [loadStatus, setLoadStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const analysisRef = useRef(null);
  const saveTimer = useRef(null);

  const monthKey = `${activeYear}-${String(activeMonth+1).padStart(2,"0")}`;
  const monthData = allData[monthKey] || buildEmptyMonth();
  const sheetName = getSheetName(activeMonth, activeYear);

  const getInheritedAccrual = (itemId) => {
    for (let m = activeMonth - 1; m >= 0; m--) {
      const key = `${activeYear}-${String(m+1).padStart(2,"0")}`;
      const data = allData[key];
      if (data?.accruals?.[itemId]?.totalPaid) {
        return data.accruals[itemId];
      }
    }
    return null;
  };

  // Load data when month changes
  useEffect(() => { loadFromSheets(); }, [activeMonth, activeYear]);

  const setMonthData = (updater) => {
    setAllData(prev => {
      const current = prev[monthKey] || buildEmptyMonth();
      const updated = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [monthKey]: updated };
    });
  };

  const updateRevenue = (id, val) => { setMonthData(d => ({ ...d, revenue: { ...d.revenue, [id]: val } })); };
  const updateExpense = (id, val) => { setMonthData(d => ({ ...d, expenses: { ...d.expenses, [id]: val } })); };
  const updateAccrual = (id, field, val) => { setMonthData(d => ({ ...d, accruals: { ...d.accruals, [id]: { ...(d.accruals[id] || {}), [field]: val } } })); };
  const addCustomRevenue = () => { setMonthData(d => ({ ...d, customRevenue: [...(d.customRevenue||[]), { id: `cr_${Date.now()}`, label: "", amount: "" }] })); };
  const addCustomExpense = () => { setMonthData(d => ({ ...d, customExpenses: [...(d.customExpenses||[]), { id: `ce_${Date.now()}`, label: "", amount: "" }] })); };
  const updateCustomRevenue = (id, field, val) => { setMonthData(d => ({ ...d, customRevenue: d.customRevenue.map(r => r.id === id ? { ...r, [field]: val } : r) })); };
  const updateCustomExpense = (id, field, val) => { setMonthData(d => ({ ...d, customExpenses: d.customExpenses.map(e => e.id === id ? { ...e, [field]: val } : e) })); };
  const removeCustomRevenue = (id) => { setMonthData(d => ({ ...d, customRevenue: d.customRevenue.filter(r => r.id !== id) })); scheduleSave(); };
  const removeCustomExpense = (id) => { setMonthData(d => ({ ...d, customExpenses: d.customExpenses.filter(e => e.id !== id) })); scheduleSave(); };
  const toggleGroup = (id) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  // ── CALCULATIONS ────────────────────────────────────────────────────────────
  const calcGroupRevenue = (group) => group.items.reduce((s, it) => s + (parseFloat(monthData.revenue[it.id]) || 0), 0);
  const calcGroupExpense = (group) => group.items.reduce((s, it) => {
    if (it.accrual) {
      const acc = monthData.accruals?.[it.id];
      if (acc?.totalPaid) return s + getMonthlyAccrual(acc.totalPaid, it.accrual);
      // Inherit from previous month if not set this month
      const inherited = getInheritedAccrual(it.id);
      if (inherited?.totalPaid) return s + getMonthlyAccrual(inherited.totalPaid, it.accrual);
      return s + (parseFloat(monthData.expenses[it.id]) || 0);
    }
    return s + (parseFloat(monthData.expenses[it.id]) || 0);
  }, 0);

  const tradingRevenue = calcGroupRevenue(REVENUE_GROUPS[0]);
  const ifcIn = calcGroupRevenue(REVENUE_GROUPS[1]);
  const customRevTotal = (monthData.customRevenue||[]).reduce((s, r) => s + (parseFloat(r.amount)||0), 0);
  const totalRevenue = tradingRevenue + ifcIn + customRevTotal;
  const expenseGroupTotals = EXPENSE_GROUPS.map(g => calcGroupExpense(g));
  const customExpTotal = (monthData.customExpenses||[]).reduce((s, e) => s + (parseFloat(e.amount)||0), 0);
  const totalExpenses = expenseGroupTotals.reduce((s, v) => s + v, 0) + customExpTotal;
  const grossProfit = tradingRevenue - expenseGroupTotals[0];
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  const grossMargin = tradingRevenue > 0 ? ((grossProfit / tradingRevenue) * 100).toFixed(1) : "0.0";

  // ── GOOGLE SHEETS API ────────────────────────────────────────────────────────
  const getAccessToken = async () => {
    const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5+JHegJVJ9olb\nNKEhiU8GEXTVbZH7cCKHDYR5cHB/bwjzEE58jsCgF0nQf4f6+MVY90cM3g55aCYc\nEiNXVZyCVM8iBrlHtDOB/2wmut7dbS7VDsaarvcWcUzeRrOVfaa90U+kq3SDkcNc\nwzOQs6s2owF0gkWfWCfiNMg/+wp0FAGHJUVwKjBaKqD6wOR0Otv9rr2oktY5VLiY\nFOOccejOK9QVfKezjZLlhuxlGA/iWZ9C3p8EM3SYpKj0ImiNT1CsNWKS7VU28nzJ\nsf7FYAViHewfcsvALSR0mLQrxm6yP07OW38BfUbQOrKPvHwCX4FTf9HbCqzAdC0I\n7U3weLHBAgMBAAECggEATDR+WYWpJxi+KkCDsoFYf20Ryg9PHZBSpbK1USnw/1cZ\nfLh24PWCG1fPqH9J0l60R4N0euJXXgp+a0xHbRcovgNQqWnF7Ir7/E4VHD3A6009\nPpMCcQo3N9wPmpmwJxbJB8lIcHrNkMhfHJjkfWwSQZ5ED2D+dJAkL75fPFB7dRq2\ntIQQ1DUmNfG6yi7xcblGXCbkF1vmVcQmx0CaFreiL7sktxXnNyXoy4IpUryoIL5z\noqmxGI6hP6LOZwqtNLShl5KSPEphIctzU6bvqTjEY2XMUuFmNdBdIUBqvB9//cxt\nvFaWc2oZ3Rc/tOB4bTC153myodUR+fwJa+vaGgeMTQKBgQDfBPfCgVwhlGY/C3rZ\ndCfZdS9n5ePKR0bE2jX0IVq8WjxEeY+pUhQl2zTUZVVR4MFXBR6vQQS+qAlkA2O9\nSzWx2hApaRDBkfJVr2oCWtkp2SZVTgCVFYJOnuy2bi3ROOB6CiM5VkuzIoSERida\nydS4cdHS5fUniu47adySY8d16wKBgQDVeQdR/U3n7Q1FnSlkLA+KCT5KjqUd1P6I\nV7vwEZ02qK1LiylSt0H3It4jz57yxAlucnPqcNnysGdHGKNnNde1aVAhtua3KWAU\nMsmFxVwMzs+wIWY66BwG3Wg7qOORyMEqRGvzZtbQSRVqBwrzZBh6PDcc52rDazYL\n7pMmIELwAwKBgAdUeHgyHD8WS44C6JTBFpY1HcvCaIw7b34E1gUiG4NZS+XMQQaF\nphfgbooUkotQYcpkZq/H6UoC59wbqGmOUUN5MVLLGzvheh+K1mchaUXQ10uydp5v\nyIqg+pK8aFEaF3arYqD9zxsiJUzbqWt4er9dLlJKMJaOIGpfflppYSLlAoGAIVud\nQjmj7+cCGOu7KRUdhIN3QW1S7ft3ntSe4J/QAlePZOulFHDglP7U2aG7A9KQarrl\n1C+4Tw0zxk9aUWl/gLCpPet32A1WHzHkfcveW34BxFMjx3a30nbMr+3vSbumO7Wf\nbNSYIsoY142sL2Zn0MoSDqk27LyXIHwycFXAQAMCgYEAgu9/9vhyB0nWJDJeg9YA\noqLf9nuWac7F0TDc62wcJxsP1sSjEdx0WitYvOjsHUcy5oSn/Z6KCXiJ+zyjnEoy\nURDg9oDXSVtfcGzYDipC5Ca4yNSQOioku1JWmM7q+x5vo9Z2LXqMQfz6Ff2xQBhx\nmpS8CYeH/ZIyCGZyENlDI6g=\n-----END PRIVATE KEY-----\n`;

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signingInput = `${b64(header)}.${b64(payload)}`;

    // Import the private key and sign
    const pemContents = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryDer.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
    const b64Sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${signingInput}.${b64Sig}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  };

  const loadFromSheets = async () => {
    setIsLoading(true);
    setLoadStatus("Loading from Google Sheets...");
    try {
      const res = await fetch(`/api/sheets?sheet=${encodeURIComponent(sheetName)}`);
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        const revenueKeys = ["card_sale","cash_pos","cash_no_pos","catering","zomato","keeta","careem","talabat","noon","smiles","deliveroo","ifc_received"];
        setAllData(prev => {
          const current = prev[monthKey] || buildEmptyMonth();
          return {
            ...prev,
            [monthKey]: {
              ...current,
              revenue: { ...current.revenue, ...Object.fromEntries(Object.entries(d).filter(([k]) => revenueKeys.includes(k))) },
              expenses: { ...current.expenses, ...Object.fromEntries(Object.entries(d).filter(([k]) => !revenueKeys.includes(k))) },
            }
          };
        });
        setLoadStatus("✅ Loaded from Google Sheets");
      } else {
        setLoadStatus("📋 No data yet for this month");
      }
    } catch (e) {
      setLoadStatus("⚠️ Could not load — check connection");
    }
    setIsLoading(false);
    setTimeout(() => setLoadStatus(""), 3000);
  };

  const saveToSheets = async (dataToSave) => {
    setIsSaving(true);
    setSaveStatus("💾 Saving...");
    try {
      const currentData = dataToSave || monthData;
      const data = {
        ...currentData.revenue,
        ...Object.fromEntries(
          Object.entries(currentData.expenses).map(([k, v]) => {
            if (currentData.accruals?.[k]?.totalPaid) return [k, currentData.accruals[k].totalPaid];
            return [k, v];
          })
        ),
      };
      await fetch(`/api/sheets?sheet=${encodeURIComponent(sheetName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      setSaveStatus("✅ Saved to Google Sheets");
    } catch (e) {
      setSaveStatus("⚠️ Save failed — check connection");
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const scheduleSave = () => {
    if (!isOwner) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setAllData(prev => {
        const current = prev[monthKey] || buildEmptyMonth();
        saveToSheets(current);
        return prev;
      });
    }, 1500);
  };

  const handleLogin = () => {
    if (pwInput === OWNER_PASSWORD) { setIsOwner(true); setShowLogin(false); setPwError(false); setPwInput(""); }
    else setPwError(true);
  };

  const runAnalysis = async () => {
    setAnalysisLoading(true); setAnalysis(""); setActiveTab("analysis");
    const periodLabel = `${MONTHS[activeMonth]} ${activeYear}`;
    const prompt = `You are an expert restaurant financial consultant in the UAE. Analyse this P&L for Mothers Restaurant for ${periodLabel}.
TRADING REVENUE: ${fmt(tradingRevenue)} | IFC IN: ${fmt(ifcIn)} | TOTAL REVENUE: ${fmt(totalRevenue)}
TOTAL EXPENSES: ${fmt(totalExpenses)}
GROSS PROFIT: ${fmt(grossProfit)} (${grossMargin}%) | NET PROFIT: ${fmt(netProfit)} (${profitMargin}%)
FOOD COST %: ${tradingRevenue > 0 ? ((expenseGroupTotals[0]/tradingRevenue)*100).toFixed(1) : 0}%
All amounts in AED.
Provide: 1. Executive Summary 2. Key Metrics vs UAE benchmarks 3. Top 3 Concerns 4. Top 3 Opportunities 5. Action Plan (5 steps)`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const json = await res.json();
      setAnalysis(json.content?.map(b => b.text||"").join("") || "No analysis returned.");
    } catch { setAnalysis("Error running analysis."); }
    setAnalysisLoading(false);
  };

  const renderMarkdown = (t) => t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*$)/gm, '<h3 style="color:#f59e0b;margin:1rem 0 0.3rem;font-size:0.9rem;text-transform:uppercase">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="color:#fbbf24;margin:1.2rem 0 0.4rem">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="color:#fcd34d;margin:1rem 0 0.5rem">$1</h1>')
    .replace(/^\d+\. (.*$)/gm, '<div style="margin:0.35rem 0;padding-left:1rem">• $1</div>')
    .replace(/^- (.*$)/gm, '<div style="margin:0.2rem 0;padding-left:1rem">– $1</div>')
    .replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");

  const S = {
    app: { minHeight: "100vh", background: "#0c0c0f", fontFamily: "'Palatino Linotype', Palatino, serif", color: "#e2d9c8" },
    header: { background: "linear-gradient(135deg,#1a0e00,#2c1800,#1a0e00)", borderBottom: "1px solid #4a2c00", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
    kpiBar: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", background: "#111116", borderBottom: "1px solid #2a1800" },
    kpiCell: { padding: "0.8rem 1rem", textAlign: "center", borderRight: "1px solid #2a1800" },
    tabs: { display: "flex", background: "#0e0e12", borderBottom: "1px solid #2a1800" },
    tab: (a) => ({ padding: "0.7rem 1.2rem", border: "none", cursor: "pointer", fontSize: "0.8rem", background: a ? "#1e1205" : "transparent", color: a ? "#f5c842" : "#7a5a30", borderBottom: a ? "2px solid #f5c842" : "2px solid transparent", fontFamily: "inherit" }),
    panel: (c) => ({ background: "#111116", border: `1px solid ${c}22`, borderRadius: "10px", overflow: "hidden", marginBottom: "0.8rem" }),
    panelHead: (c) => ({ background: `linear-gradient(90deg,${c}18,transparent)`, padding: "0.6rem 1rem", borderBottom: `1px solid ${c}33`, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }),
    row: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 1rem", borderBottom: "1px solid #1a1a22" },
    amtBox: { display: "flex", alignItems: "center", background: "#0c0c10", border: "1px solid #3a2200", borderRadius: "5px", overflow: "hidden" },
    amtInput: (c) => ({ width: "110px", background: "transparent", border: "none", color: c, padding: "0.35rem 0.4rem", outline: "none", fontSize: "0.85rem", fontFamily: "inherit" }),
    btn: (bg, c="#fff") => ({ background: bg, color: c, border: "none", borderRadius: "7px", padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }),
  };

  const AccrualRow = ({ item }) => {
    const acc = monthData.accruals?.[item.id] || {};
    // If no accrual entered this month, inherit from most recent previous month
    const inheritedAcc = (!acc.totalPaid) ? getInheritedAccrual(item.id) : null;
    const effectiveAcc = acc.totalPaid ? acc : (inheritedAcc || {});
    const monthly = effectiveAcc.totalPaid ? getMonthlyAccrual(effectiveAcc.totalPaid, item.accrual) : 0;
    const isInherited = !acc.totalPaid && inheritedAcc;
    const periodLabel = item.accrual.type === "days" ? `every ${item.accrual.period} days` : `${item.accrual.period} months`;
    return (
      <div style={{ padding: "0.4rem 1rem", borderBottom: "1px solid #1a1a22" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ flex: 1, fontSize: "0.78rem", color: "#b09070" }}>{item.label}</span>
          <span style={{ fontSize: "0.65rem", color: "#f59e0b", background: "#2a1800", padding: "0.15rem 0.4rem", borderRadius: "3px" }}>⏱ {periodLabel}</span>
          {isInherited && <span style={{ fontSize: "0.6rem", color: "#9a6a20", background: "#1a1200", padding: "0.15rem 0.4rem", borderRadius: "3px" }}>↩ carried forward</span>}
          <span style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: "bold", minWidth: "100px", textAlign: "right" }}>{monthly > 0 ? fmt(monthly) + "/mo" : "—"}</span>
        </div>
        {isOwner && (
          <div style={{ display: "flex", gap: "0.5rem", paddingLeft: "0.5rem", marginTop: "0.3rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", color: "#6a4a20", marginBottom: "0.1rem" }}>Total Amount Paid</div>
              <div style={S.amtBox}><span style={{ padding: "0 0.35rem", color: "#6a4a20", fontSize: "0.7rem" }}>AED</span>
                <input type="number"
                  key={`${item.id}-acc-${monthKey}`}
                  defaultValue={acc.totalPaid||""}
                  onBlur={e => { updateAccrual(item.id, "totalPaid", e.target.value); scheduleSave(); }}
                  placeholder="0" style={S.amtInput("#f59e0b")} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", color: "#6a4a20", marginBottom: "0.1rem" }}>Date Paid</div>
              <input type="date" value={acc.dateEntered||""} onChange={e => updateAccrual(item.id, "dateEntered", e.target.value)}
                style={{ background: "#0c0c10", border: "1px solid #3a2200", color: "#e2d9c8", padding: "0.35rem", borderRadius: "5px", fontSize: "0.75rem", outline: "none" }} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const GroupPanel = ({ group, section, total }) => {
    const expanded = expandedGroups[group.id] !== false;
    return (
      <div style={S.panel(group.color)}>
        <div style={S.panelHead(group.color)} onClick={() => toggleGroup(group.id)}>
          <span style={{ color: group.color, fontWeight: "bold", fontSize: "0.8rem" }}>{expanded ? "▾" : "▸"} {group.label}</span>
          <span style={{ fontSize: "0.85rem", color: "#e2d9c8", fontWeight: "bold" }}>{fmt(total)}</span>
        </div>
        {expanded && <div>
          {group.items.map(item => item.accrual ? <AccrualRow key={item.id} item={item} /> : (
            <div key={item.id} style={S.row}>
              <span style={{ flex: 1, fontSize: "0.78rem", color: "#b09070" }}>{item.label}</span>
              {isOwner ? (
                <div style={S.amtBox}><span style={{ padding: "0 0.35rem", color: "#6a4a20", fontSize: "0.7rem" }}>AED</span>
                  <input type="number"
                    key={`${item.id}-${monthKey}`}
                    defaultValue={section === "revenue" ? (monthData.revenue[item.id]||"") : (monthData.expenses[item.id]||"")}
                    onBlur={e => { section === "revenue" ? updateRevenue(item.id, e.target.value) : updateExpense(item.id, e.target.value); scheduleSave(); }}
                    placeholder="0" style={S.amtInput(section === "revenue" ? "#10b981" : "#f87171")} />
                </div>
              ) : (
                <span style={{ fontSize: "0.85rem", color: section === "revenue" ? "#10b981" : "#f87171", minWidth: "110px", textAlign: "right" }}>
                  {fmt(parseFloat(section === "revenue" ? monthData.revenue[item.id] : monthData.expenses[item.id]) || 0)}
                </span>
              )}
            </div>
          ))}
        </div>}
      </div>
    );
  };

  return (
    <div style={S.app}>
      {/* Login Modal */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1205", border: "1px solid #4a2c00", borderRadius: "12px", padding: "2rem", width: "300px" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>🔐</div>
              <div style={{ color: "#f5c842", marginTop: "0.3rem" }}>Owner Access</div>
            </div>
            <input type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Password" autoFocus
              style={{ width: "100%", background: "#0c0c10", border: `1px solid ${pwError?"#ef4444":"#3a2200"}`, color: "#e2d9c8", padding: "0.6rem", borderRadius: "7px", outline: "none", boxSizing: "border-box", marginBottom: "0.4rem", fontFamily: "inherit" }} />
            {pwError && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginBottom: "0.4rem" }}>Incorrect password</div>}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
              <button onClick={() => { setShowLogin(false); setPwInput(""); }} style={{ ...S.btn("#2a1800","#9a6a20"), flex: 1 }}>Cancel</button>
              <button onClick={handleLogin} style={{ ...S.btn("linear-gradient(135deg,#b45309,#92400e)"), flex: 1 }}>Login</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span style={{ fontSize: "2rem" }}>🍽️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#f5c842", fontWeight: "normal" }}>Mothers</h1>
            <div style={{ fontSize: "0.65rem", color: "#9a6a20", letterSpacing: "0.25em", textTransform: "uppercase" }}>Profit & Loss Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
          {(saveStatus || loadStatus) && (
            <span style={{ fontSize: "0.75rem", color: "#f5c842", background: "#1a1205", padding: "0.3rem 0.7rem", borderRadius: "5px", border: "1px solid #4a2c00" }}>
              {saveStatus || loadStatus}
            </span>
          )}
          <select value={activeMonth} onChange={e => setActiveMonth(+e.target.value)}
            style={{ background: "#1a0e00", color: "#f5c842", border: "1px solid #4a2c00", padding: "0.4rem 0.7rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m} {activeYear}</option>)}
          </select>
          <button onClick={() => loadFromSheets()} disabled={isLoading}
            style={S.btn("#1a3a1a","#4ade80")}>
            {isLoading ? "⏳" : "🔄"} Refresh
          </button>
          {isOwner ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#4ade80", background: "#0a2a0a", padding: "0.3rem 0.7rem", borderRadius: "5px", border: "1px solid #1a4a1a" }}>✏️ Edit Mode</span>
              <button onClick={() => { setIsOwner(false); saveToSheets(); }} style={S.btn("#2a1800","#f5c842")}>Save & Lock</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#a08020", background: "#1a1a00", padding: "0.3rem 0.7rem", borderRadius: "5px", border: "1px solid #4a3800" }}>👁 View Only</span>
              <button onClick={() => setShowLogin(true)} style={S.btn("#1a0e00","#9a6a20")}>Owner Login</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Bar */}
      <div style={S.kpiBar}>
        {[
          { label: "Trading Revenue", value: fmt(tradingRevenue), color: "#10b981" },
          { label: "Total Revenue", value: fmt(totalRevenue), color: "#34d399" },
          { label: "Total Expenses", value: fmt(totalExpenses), color: "#f87171" },
          { label: "Gross Profit", value: fmt(grossProfit), color: grossProfit >= 0 ? "#10b981" : "#f87171", sub: `${grossMargin}% margin` },
          { label: "Net Profit / Loss", value: fmt(netProfit), color: netProfit >= 0 ? "#10b981" : "#f87171", sub: `${profitMargin}% margin` },
        ].map(k => (
          <div key={k.label} style={S.kpiCell}>
            <div style={{ fontSize: "0.6rem", color: "#7a5a30", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>{k.label}</div>
            <div style={{ fontSize: "1.1rem", color: k.color, fontWeight: "bold" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: "0.65rem", color: "#7a5a30" }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[["pl","📊 P&L Entry"],["analysis","🤖 AI Analysis"],["accruals","⏱ Accruals"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={S.tab(activeTab === id)}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.2rem" }}>

        {activeTab === "pl" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            {/* Revenue */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "#7a5a30", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.6rem" }}>Revenue — {fmt(totalRevenue)}</div>
              {REVENUE_GROUPS.map((g) => <GroupPanel key={g.id} group={g} section="revenue" total={calcGroupRevenue(g)} />)}
              {(monthData.customRevenue||[]).map(r => (
                <div key={r.id} style={{ ...S.panel("#10b981"), marginBottom: "0.4rem" }}>
                  <div style={S.row}>
                    {isOwner ? (
                      <>
                        <input value={r.label} onChange={e => updateCustomRevenue(r.id, "label", e.target.value)} placeholder="Category name..."
                          style={{ flex: 1, background: "#0c0c10", border: "1px solid #3a2200", color: "#f5c842", padding: "0.3rem 0.5rem", borderRadius: "4px", fontSize: "0.78rem", outline: "none" }} />
                        <div style={S.amtBox}><span style={{ padding: "0 0.35rem", color: "#6a4a20", fontSize: "0.7rem" }}>AED</span>
                          <input type="number"
                          key={`${r.id}-${monthKey}`}
                          defaultValue={r.amount}
                          onBlur={e => { updateCustomRevenue(r.id, "amount", e.target.value); scheduleSave(); }}
                          placeholder="0" style={S.amtInput("#10b981")} />
                        </div>
                        <button onClick={() => removeCustomRevenue(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                      </>
                    ) : <><span style={{ flex: 1, fontSize: "0.78rem", color: "#b09070" }}>{r.label || "Custom"}</span><span style={{ color: "#10b981" }}>{fmt(parseFloat(r.amount)||0)}</span></>}
                  </div>
                </div>
              ))}
              {isOwner && <button onClick={addCustomRevenue} style={{ width: "100%", background: "transparent", border: "1px dashed #1a4a2a", color: "#10b981", borderRadius: "7px", padding: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>+ Add Custom Revenue</button>}
            </div>

            {/* Expenses */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "#7a5a30", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.6rem" }}>Expenses — {fmt(totalExpenses)}</div>
              {EXPENSE_GROUPS.map((g, i) => <GroupPanel key={g.id} group={g} section="expenses" total={expenseGroupTotals[i]} />)}
              {(monthData.customExpenses||[]).map(e => (
                <div key={e.id} style={{ ...S.panel("#f87171"), marginBottom: "0.4rem" }}>
                  <div style={S.row}>
                    {isOwner ? (
                      <>
                        <input value={e.label} onChange={ev => updateCustomExpense(e.id, "label", ev.target.value)} placeholder="Category name..."
                          style={{ flex: 1, background: "#0c0c10", border: "1px solid #3a2200", color: "#f5c842", padding: "0.3rem 0.5rem", borderRadius: "4px", fontSize: "0.78rem", outline: "none" }} />
                        <div style={S.amtBox}><span style={{ padding: "0 0.35rem", color: "#6a4a20", fontSize: "0.7rem" }}>AED</span>
                          <input type="number"
                          key={`${e.id}-${monthKey}`}
                          defaultValue={e.amount}
                          onBlur={ev => { updateCustomExpense(e.id, "amount", ev.target.value); scheduleSave(); }}
                          placeholder="0" style={S.amtInput("#f87171")} />
                        </div>
                        <button onClick={() => removeCustomExpense(e.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                      </>
                    ) : <><span style={{ flex: 1, fontSize: "0.78rem", color: "#b09070" }}>{e.label || "Custom"}</span><span style={{ color: "#f87171" }}>{fmt(parseFloat(e.amount)||0)}</span></>}
                  </div>
                </div>
              ))}
              {isOwner && <button onClick={addCustomExpense} style={{ width: "100%", background: "transparent", border: "1px dashed #4a1a1a", color: "#f87171", borderRadius: "7px", padding: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>+ Add Custom Expense</button>}
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div ref={analysisRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: "#f5c842" }}>AI Analysis — {MONTHS[activeMonth]} {activeYear}</span>
              <button onClick={runAnalysis} disabled={analysisLoading || totalRevenue === 0}
                style={{ ...S.btn(analysisLoading ? "#1a1200" : "linear-gradient(135deg,#b45309,#92400e)"), opacity: totalRevenue === 0 ? 0.5 : 1 }}>
                {analysisLoading ? "⏳ Analysing..." : "🤖 Run AI Analysis"}
              </button>
            </div>
            {analysisLoading && <div style={{ textAlign: "center", padding: "4rem", color: "#9a6a20" }}><div style={{ fontSize: "2.5rem" }}>🤖</div><div style={{ marginTop: "0.8rem" }}>Analysing against UAE benchmarks...</div></div>}
            {!analysisLoading && !analysis && <div style={{ textAlign: "center", padding: "4rem", color: "#4a3a20" }}><div style={{ fontSize: "2.5rem" }}>📊</div><div style={{ marginTop: "0.8rem" }}>Enter P&L data then click Run AI Analysis</div></div>}
            {!analysisLoading && analysis && <div style={{ background: "#111116", border: "1px solid #2a1800", borderRadius: "10px", padding: "1.5rem", lineHeight: 1.75, fontSize: "0.88rem", color: "#d4c4a8" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />}
          </div>
        )}

        {activeTab === "accruals" && (
          <div>
            <div style={{ fontSize: "0.7rem", color: "#7a5a30", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem" }}>Accrual Items — Monthly Cost Breakdown</div>
            <div style={{ background: "#111116", border: "1px solid #2a1800", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.6rem 1rem", borderBottom: "1px solid #2a1800", fontSize: "0.65rem", color: "#7a5a30", textTransform: "uppercase" }}>
                <span>Item</span><span>Total Paid</span><span>Period</span><span>Monthly</span><span>Annual</span>
              </div>
              {EXPENSE_GROUPS.flatMap(g => g.items.filter(it => it.accrual).map(it => {
                const acc = monthData.accruals?.[it.id] || {};
                const monthly = getMonthlyAccrual(acc.totalPaid, it.accrual);
                const periodLabel = it.accrual.type === "days" ? `${it.accrual.period} days` : `${it.accrual.period} months`;
                return (
                  <div key={it.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "0.7rem 1rem", borderBottom: "1px solid #1a1a22", alignItems: "center" }}>
                    <div><div style={{ fontSize: "0.83rem", color: "#e2d9c8" }}>{it.label}</div><div style={{ fontSize: "0.65rem", color: "#7a5a30" }}>{g.label}</div></div>
                    <div style={{ fontSize: "0.83rem", color: "#f59e0b" }}>{acc.totalPaid ? fmt(parseFloat(acc.totalPaid)) : "—"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9a6a20" }}>{periodLabel}</div>
                    <div style={{ fontSize: "0.85rem", color: "#f59e0b", fontWeight: "bold" }}>{monthly > 0 ? fmt(monthly) : "—"}</div>
                    <div style={{ fontSize: "0.83rem", color: "#7a5a30" }}>{monthly > 0 ? fmt(monthly * 12) : "—"}</div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
