import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Delivery() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryData, setDeliveryData] = useState<any>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const snap = await getDocs(collection(db, "customers"));
    const data: any[] = [];
    snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
    setCustomers(data);
  };

  const handleChange = (custId: string, field: string, value: string) => {
    setDeliveryData((prev: any) => ({
      ...prev,
      [custId]: {
        ...prev[custId],
        [field]: value,
      },
    }));
  };

  const saveDelivery = async () => {
    for (const cust of customers) {
      const values = deliveryData[cust.id] || {};

      await addDoc(collection(db, "deliveries"), {
        customerId: cust.id,
        customerName: cust.name,
        date: selectedDate,
        milk: Number(values.milk || 0),
        extraMilk: Number(values.extraMilk || 0),
        egg: Number(values.egg || 0),
        curd: Number(values.curd || 0),
        chanakapodi: Number(values.chanakapodi || 0),
      });
    }

    alert("Delivery Saved ✅");
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Daily Delivery Log</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Customer</th>
            <th>Milk</th>
            <th>Extra Milk</th>
            <th>Egg</th>
            <th>Curd</th>
            <th>Chanakapodi</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => (
            <tr key={cust.id} className="text-center border">
              <td>{cust.name}</td>

              {["milk", "extraMilk", "egg", "curd", "chanakapodi"].map(
                (field) => (
                  <td key={field}>
                    <input
                      type="number"
                      className="border p-1 w-20"
                      onChange={(e) =>
                        handleChange(cust.id, field, e.target.value)
                      }
                    />
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={saveDelivery}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save Delivery
      </button>
    </Layout>
  );
}