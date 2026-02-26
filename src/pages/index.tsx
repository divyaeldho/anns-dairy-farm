import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { auth,getUserRole } from "../firebase";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const role = await
  getUserRole(user.uid);

      if (!role) {
        alert("No role assigned for this user");
        await auth.signOut();
        router.push("/login");
        return;
      }
      

      if (role==="admin"){
        await fetchData();
        setLoading(false);

      } else if (role==="staff"){
        router.push("/delivery");
      } else {
        alert("Invalid role");
        await auth.signOut();
        router.push("/login")
      }
    });
  

  return () => unsubscribe();
}, []);

  const fetchData = async () => {
    const custSnap = await getDocs(collection(db, "customers"));
    const custData: any[] = [];
    custSnap.forEach((d) =>
      custData.push({ id: d.id, ...d.data() })
    );
    setCustomers(custData);

    const transSnap = await getDocs(collection(db, "transactions"));
    const transData: any[] = [];
    transSnap.forEach((d) =>
      transData.push({ id: d.id, ...d.data() })
    );
    setTransactions(transData);

    const settingsSnap = await getDoc(doc(db, "settings", "business"));
    if (settingsSnap.exists()) {
      setSettings(settingsSnap.data());
    }
  };

  const getCurrentRate = (history: any[]) => {
    if (!history || history.length === 0) return 0;
    const sorted = [...history].sort((a, b) =>
      a.from.localeCompare(b.from)
    );
    return sorted[sorted.length - 1].rate;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-10">Loading...</div>
      </Layout>
    );
  }

  const DAYS_IN_MONTH = new Date(
    selectedYear,
    selectedMonth + 1,
    0
  ).getDate();

  const calculatePausedDays = (customer: any) => {
    if (!customer.pauseStart || !customer.pauseEnd) return 0;

    const monthStart = new Date(selectedYear, selectedMonth, 1);
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);

    const pauseStart = new Date(customer.pauseStart);
    const pauseEnd = new Date(customer.pauseEnd);

    if (pauseEnd < monthStart || pauseStart > monthEnd)
      return 0;

    const effectiveStart =
      pauseStart < monthStart ? monthStart : pauseStart;
    const effectiveEnd =
      pauseEnd > monthEnd ? monthEnd : pauseEnd;

    const diff =
      (effectiveEnd.getTime() -
        effectiveStart.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff + 1;
  };

  let milkRevenue = 0;
  let extraMilkRevenue = 0;
  let eggRevenue = 0;
  let curdRevenue = 0;
  let dungRevenue = 0;

  const milkRate = getCurrentRate(settings?.milkRates);

  customers.forEach((customer) => {
    const pausedDays = calculatePausedDays(customer);
    const activeDays = DAYS_IN_MONTH - pausedDays;

    const baseMilk =
      activeDays *
      (customer.milkLitres || 0) *
      milkRate;

    milkRevenue += baseMilk;
  });

  transactions.forEach((t) => {
    const tDate = new Date(t.date);

    if (
      tDate.getMonth() === selectedMonth &&
      tDate.getFullYear() === selectedYear
    ) {
      const amount = t.quantity * t.rate;

      if (t.product === "ExtraMilk")
        extraMilkRevenue += amount;

      if (t.product === "Egg") eggRevenue += amount;

      if (t.product === "Curd") curdRevenue += amount;

      if (t.product === "Chanakapodi")
        dungRevenue += amount;
    }
  });

  const totalRevenue =
    milkRevenue +
    extraMilkRevenue +
    eggRevenue +
    curdRevenue +
    dungRevenue;

  const activeCustomers = customers.filter(
    (c) => !c.isPaused
  ).length;

  const pausedCustomers = customers.filter(
    (c) => c.isPaused
  ).length;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Dashboard 📊
      </h1>

      <div className="flex gap-3 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(Number(e.target.value))
          }
          className="border p-2 rounded"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(Number(e.target.value))
          }
          className="border p-2 rounded w-24"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <Card title="Total Revenue" value={totalRevenue} color="purple" />
        <Card title="Milk Revenue" value={milkRevenue} color="green" />
        <Card title="Extra Milk Revenue" value={extraMilkRevenue} color="blue" />
        <Card title="Egg Revenue" value={eggRevenue} color="yellow" />
        <Card title="Curd Revenue" value={curdRevenue} color="orange" />
        <Card title="Chanakapodi Revenue" value={dungRevenue} color="gray" />
        <Card title="Active Customers" value={activeCustomers} color="green" />
        <Card title="Paused Customers" value={pausedCustomers} color="red" />

      </div>
    </Layout>
  );
}

function Card({ title, value, color }: any) {
  const colorMap: any = {
    purple: "text-purple-600",
    green: "text-green-600",
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    gray: "text-gray-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-gray-600 mb-2">{title}</h2>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>
        {typeof value === "number" ? `₹${value.toFixed(2)}` : value}
      </p>
    </div>
  );
}