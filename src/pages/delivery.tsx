import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Delivery() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      const snap = await getDocs(collection(db, "customers"));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(list);
    };

    loadCustomers();
  }, []);

  // Generate delivery rows
  useEffect(() => {
    if (customers.length > 0) generateDelivery();
  }, [selectedDate, customers]);

  const generateDelivery = async () => {
    const tempRows: any[] = [];

    for (const customer of customers) {
      const docId = `${selectedDate}_${customer.id}`;
      const ref = doc(db, "deliveries", docId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        tempRows.push({ id: docId, ...snap.data() });
      } else {
        tempRows.push({
          id: docId,
          customerId: customer.id,
          customerName: customer.name,
          milk: customer.isPaused ? 0 : customer.milkLitres || 0,
          extraMilk: 0,
          egg: 0,
          curd: 0,
          chanakapodi: 0,
          date: selectedDate,
        });
      }
    }

    setRows(tempRows);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index][field] = Number(value);
    setRows(updated);
  };

  const saveDelivery = async () => {
    for (const row of rows) {
      const ref = doc(db, "deliveries", row.id);
      await setDoc(ref, row);
    }
    alert("Delivery Saved Successfully ✅");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Delivery Log</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Select Date: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "6px", fontSize: "14px" }}
        />
      </div>

      <table border={1} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
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
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{row.customerName}</td>

              <td>
                <input
                  type="number"
                  value={row.milk}
                  onChange={(e) => handleChange(index, "milk", e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.extraMilk}
                  onChange={(e) => handleChange(index, "extraMilk", e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.egg}
                  onChange={(e) => handleChange(index, "egg", e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.curd}
                  onChange={(e) => handleChange(index, "curd", e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.chanakapodi}
                  onChange={(e) => handleChange(index, "chanakapodi", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={saveDelivery}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Save Delivery
      </button>
    </div>
  );
}