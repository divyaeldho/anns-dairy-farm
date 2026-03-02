import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Delivery() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  // 🔹 Load customers from Firestore
  useEffect(() => {
    const fetchCustomers = async () => {
      const snap = await getDocs(collection(db, "customers"));
      const list: any[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();

        list.push({
          id: docSnap.id,
          name: data.name,
          milkLitres: data.milkLitres || 0,
          isPaused: data.isPaused || false,
        });
      });

      setCustomers(list);
    };

    fetchCustomers();
  }, []);

  // 🔹 Generate rows when date or customers change
  useEffect(() => {
    if (customers.length === 0) return; 
    generateRows();
  }, [selectedDate, customers]);

  const generateRows = async () => {
    const temp: any[] = [];

    for (const customer of customers) {
      const docId = `${selectedDate}_${customer.id}`;
      const ref = doc(db, "deliveries", docId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        temp.push({ id: docId, ...snap.data() });
      } else {
        temp.push({
          id: docId,
          customerId: customer.id,
          customerName: customer.name,
          date: selectedDate,
          milk: customer.isPaused ? 0 : customer.milkLitres,
          extraMilk: 0,
          egg: 0,
          curd: 0,
          chanakapodi: 0,
        });
      }
    }

    setRows(temp);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index][field] = Number(value);
    setRows(updated);
  };

  const saveDelivery = async () => {
    for (const row of rows) {
      await setDoc(doc(db, "deliveries", row.id), row);
    }
    alert("Delivery Saved ✅");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ marginBottom: "20px" }}>Delivery Log</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Milk</th>
            <th style={thStyle}>Extra Milk</th>
            <th style={thStyle}>Egg</th>
            <th style={thStyle}>Curd</th>
            <th style={thStyle}>Chanakapodi</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.customerName}</td>

              <td style={tdStyle}>
                <input
                  type="number"
                  value={row.milk}
                  onChange={(e) =>
                    handleChange(index, "milk", e.target.value)
                  }
                  style={inputStyle}
                />
              </td>

              <td style={tdStyle}>
                <input
                  type="number"
                  value={row.extraMilk}
                  onChange={(e) =>
                    handleChange(index, "extraMilk", e.target.value)
                  }
                  style={inputStyle}
                />
              </td>

              <td style={tdStyle}>
                <input
                  type="number"
                  value={row.egg}
                  onChange={(e) =>
                    handleChange(index, "egg", e.target.value)
                  }
                  style={inputStyle}
                />
              </td>

              <td style={tdStyle}>
                <input
                  type="number"
                  value={row.curd}
                  onChange={(e) =>
                    handleChange(index, "curd", e.target.value)
                  }
                  style={inputStyle}
                />
              </td>

              <td style={tdStyle}>
                <input
                  type="number"
                  value={row.chanakapodi}
                  onChange={(e) =>
                    handleChange(index, "chanakapodi", e.target.value)
                  }
                  style={inputStyle}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={saveDelivery}
        style={{
          marginTop: "25px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Save Delivery
      </button>
    </div>
  );
}

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "8px",
  border: "1px solid #ddd",
};

const inputStyle = {
  width: "70px",
  padding: "4px",
};