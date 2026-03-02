import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { auth, db } from "../firebase";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

export default function Delivery() {
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AUTH CHECK (Admin + Staff allowed)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchCustomers();
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Customers
  const fetchCustomers = async () => {
    const snap = await getDocs(collection(db, "customers"));
    const data: any[] = [];

    snap.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    setCustomers(data);
    setLoading(false);
  };

  // Load delivery for selected date
  useEffect(() => {
    if (customers.length > 0) {
      generateDeliveryData();
    }
  }, [selectedDate, customers]);

  const generateDeliveryData = async () => {
    const rows = [];

    for (const customer of customers) {
      const docId = `${selectedDate}_${customer.id}`;
      const docRef = doc(db, "deliveries", docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        rows.push({ id: docId, ...snap.data() });
      } else {
        rows.push({
          id: docId,
          customerId: customer.id,
          customerName: customer.name,
          date: selectedDate,
          milk: customer.paused ? 0 : customer.milk || 0,
          extraMilk: 0,
          egg: 0,
          curd: 0,
          chanakapodi: 0,
        });
      }
    }

    setDeliveryData(rows);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...deliveryData];
    updated[index][field] = Number(value);
    setDeliveryData(updated);
  };

  const saveDeliveries = async () => {
    for (const row of deliveryData) {
      const docRef = doc(db, "deliveries", row.id);
      await setDoc(docRef, row);
    }

    alert("Delivery saved successfully!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
      <h2>Delivery Log</h2>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <table border={1} cellPadding={5} style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Milk</th>
            <th>Extra Milk</th>
            <th>Egg</th>
            <th>Curd</th>
            <th>Chanakapodi</th>
          </tr>
        </thead>
        <tbody>
          {deliveryData.map((row, index) => (
            <tr key={row.id}>
              <td>{row.customerName}</td>

              <td>
                <input
                  type="number"
                  value={row.milk}
                  onChange={(e) =>
                    handleChange(index, "milk", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.extraMilk}
                  onChange={(e) =>
                    handleChange(index, "extraMilk", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.egg}
                  onChange={(e) =>
                    handleChange(index, "egg", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.curd}
                  onChange={(e) =>
                    handleChange(index, "curd", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.chanakapodi}
                  onChange={(e) =>
                    handleChange(index, "chanakapodi", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={saveDeliveries} style={{ marginTop: "20px" }}>
        Save Delivery
      </button>
    </Layout>
  );
}