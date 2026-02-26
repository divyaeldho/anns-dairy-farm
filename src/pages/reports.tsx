import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { auth } from "../firebase";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Reports() {
  const router = useRouter();

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const monthKey = `${selectedYear}-${String(
    selectedMonth + 1
  ).padStart(2, "0")}`;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        await fetchData();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    const custSnap = await getDocs(collection(db, "customers"));
    const custData: any[] = [];
    custSnap.forEach((doc) =>
      custData.push({ id: doc.id, ...doc.data() })
    );
    setCustomers(custData);

    const transSnap = await getDocs(collection(db, "transactions"));
    const transData: any[] = [];
    transSnap.forEach((doc) =>
      transData.push({ id: doc.id, ...doc.data() })
    );
    setTransactions(transData);

    const settingsSnap = await getDoc(doc(db, "settings", "business"));
    if (settingsSnap.exists()) {
      setSettings(settingsSnap.data());
    }
  };

  const getCurrentRate = (rateHistory: any[]) => {
    if (!rateHistory || rateHistory.length === 0) return 0;
    const sorted = [...rateHistory].sort((a, b) =>
      a.from.localeCompare(b.from)
    );
    return sorted[sorted.length - 1].rate;
  };

  if (loading || !settings) return <div>Loading...</div>;

  const daysInMonth = new Date(
    selectedYear,
    selectedMonth + 1,
    0
  ).getDate();

  const milkRate = getCurrentRate(settings.milkRates);

  // ✅ Milk revenue (monthly subscription)
  let milkRevenue = 0;

  customers.forEach((customer) => {
    let pausedDays = 0;

    if (customer.pauseStart && customer.pauseEnd) {
      const start = new Date(customer.pauseStart);
      const end = new Date(customer.pauseEnd);
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(
        selectedYear,
        selectedMonth + 1,
        0
      );

      if (!(end < monthStart || start > monthEnd)) {
        const effectiveStart =
          start < monthStart ? monthStart : start;
        const effectiveEnd =
          end > monthEnd ? monthEnd : end;

        pausedDays =
          (effectiveEnd.getTime() -
            effectiveStart.getTime()) /
            (1000 * 60 * 60 * 24) +
          1;
      }
    }

    const activeDays = daysInMonth - pausedDays;
    milkRevenue +=
      activeDays * customer.milkLitres * milkRate;
  });

  // ✅ Filter transactions for selected month
  const filteredTransactions = transactions.filter((t) =>
    t.date.startsWith(monthKey)
  );

  let extraMilkRevenue = 0;
  let eggRevenue = 0;
  let curdRevenue = 0;
  let dungRevenue = 0;

  filteredTransactions.forEach((t) => {
    if (t.product === "Extra Milk")
      extraMilkRevenue += t.quantity * t.rate;

    if (t.product === "Egg")
      eggRevenue += t.quantity * t.rate;

    if (t.product === "Curd")
      curdRevenue += t.quantity * t.rate;

    if (t.product === "Chanakapodi")
      dungRevenue += t.quantity * t.rate;
  });

  const totalRevenue =
    milkRevenue +
    extraMilkRevenue +
    eggRevenue +
    curdRevenue +
    dungRevenue;

  const barData = [
    { name: "Milk", value: milkRevenue },
    { name: "Extra Milk", value: extraMilkRevenue },
    { name: "Egg", value: eggRevenue },
    { name: "Curd", value: curdRevenue },
    { name: "Chanakapodi", value: dungRevenue },
  ];

  const COLORS = [
    "#16a34a",
    "#2563eb",
    "#facc15",
    "#f97316",
    "#6b7280",
  ];

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Reports 📊
      </h1>

      {/* Month Selector */}
      <div className="flex gap-4 items-center mb-6">
        <select
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(Number(e.target.value))
          }
          className="border p-2 rounded"
        >
          {[
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
          ].map((m, index) => (
            <option key={index} value={index}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(Number(e.target.value))
          }
          className="border p-2 rounded"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-gray-600">Total Revenue</h2>
        <p className="text-3xl font-bold text-purple-600">
          ₹{totalRevenue.toFixed(2)}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="mb-4 font-semibold">
            Product-wise Revenue (Bar Chart)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {barData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="mb-4 font-semibold">
            Revenue Distribution (Pie Chart)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={barData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {barData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}