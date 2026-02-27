import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { collection, getDocs } from "firebase/firestore";
import { db,getUserRole,auth } from "../firebase";
import {useRouter} from "next/router";
import jsPDF from "jspdf";

export default function Billing() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [rates, setRates] = useState<any>({
    milk: 70,
    extraMilk: 70,
    egg: 6,
    curd: 40,
    chanakapodi: 300,
  });
  const router = useRouter();

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      router.push("/login");
    } else {
      const role = await getUserRole(user.uid);

      if (role !== "admin") {
        router.push("/");
      }
    }
  });

  return () => unsubscribe();
}, []);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Auto recompute when month/year changes
  useEffect(() => {
    fetchDeliveries();
  }, [month, year]);

  const fetchCustomers = async () => {
    const snap = await getDocs(collection(db, "customers"));
    const list: any[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    setCustomers(list);
  };

  const fetchDeliveries = async () => {
    const snap = await getDocs(collection(db, "deliveries"));
    const filtered: any[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.date) return;

      const d = new Date(data.date);
      const dMonth = d.getMonth() + 1;
      const dYear = d.getFullYear();

      if (dMonth === month && dYear === year) {
        filtered.push(data);
      }
    });

    setDeliveries(filtered);
  };

  // Group totals per customer
  const getCustomerTotals = (customerId: string) => {
    const custDeliveries = deliveries.filter(
      (d) => d.customerId === customerId
    );

    const totals = {
      milk: 0,
      extraMilk: 0,
      egg: 0,
      curd: 0,
      chanakapodi: 0,
    };

    custDeliveries.forEach((d) => {
      totals.milk += Number(d.milk) || 0;
      totals.extraMilk += Number(d.extraMilk) || 0;
      totals.egg += Number(d.egg) || 0;
      totals.curd += Number(d.curd) || 0;
      totals.chanakapodi += Number(d.chanakapodi) || 0;
    });

    return totals;
  };

  const calculateTotal = (customerId: string) => {
    const t = getCustomerTotals(customerId);

    return (
      t.milk * rates.milk +
      t.extraMilk * rates.extraMilk +
      t.egg * rates.egg +
      t.curd * rates.curd +
      t.chanakapodi * rates.chanakapodi
    );
  };

  // Individual WhatsApp
  const sendWhatsApp = (cust: any) => {
    const totals = getCustomerTotals(cust.id);
    const total = calculateTotal(cust.id);

    const message = `
Ann’s Dairy Farm 🐄
Month: ${month}/${year}

Customer: ${cust.name}

Milk: ${totals.milk}
Extra Milk: ${totals.extraMilk}
Egg: ${totals.egg}
Curd: ${totals.curd}
Chanakapodi: ${totals.chanakapodi}

Total: ₹${total}

Thank you 🙏
`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Bulk WhatsApp
  const sendBulkWhatsApp = () => {
    customers.forEach((cust) => {
      const total = calculateTotal(cust.id);
      if (total > 0) {
        sendWhatsApp(cust);
      }
    });
  };

  // PDF Download
  const downloadPDF = (cust: any) => {
    const totals = getCustomerTotals(cust.id);
    const total = calculateTotal(cust.id);

    const doc = new jsPDF();

    doc.text("Ann’s Dairy Farm 🐄", 10, 10);
    doc.text(`Month: ${month}/${year}`, 10, 20);
    doc.text(`Customer: ${cust.name}`, 10, 30);

    doc.text(`Milk: ${totals.milk}`, 10, 45);
    doc.text(`Extra Milk: ${totals.extraMilk}`, 10, 55);
    doc.text(`Egg: ${totals.egg}`, 10, 65);
    doc.text(`Curd: ${totals.curd}`, 10, 75);
    doc.text(`Chanakapodi: ${totals.chanakapodi}`, 10, 85);

    doc.text(`Total: ₹${total}`, 10, 100);

    doc.save(`${cust.name}-bill-${month}-${year}.pdf`);
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Monthly Billing</h1>

      {/* Month & Year Selector */}
      <div className="flex gap-4 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={sendBulkWhatsApp}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Send All Bills via WhatsApp
      </button>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Customer</th>
            <th>Total ₹</th>
            <th>WhatsApp</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => {
            const total = calculateTotal(cust.id);

            return (
              <tr key={cust.id} className="text-center border-t">
                <td className="p-2">{cust.name}</td>
                <td>₹{total}</td>
                <td>
                  <button
                    onClick={() => sendWhatsApp(cust)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Send
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => downloadPDF(cust)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Download
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Layout>
  );
}