import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { auth, db } from "../firebase";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
} from "firebase/firestore";

interface Delivery {
  id: string;
  customerName: string;
  milk: number;
  extraMilk?: number;
  egg?: number;
  curd?: number;
  chanakapodi?: number;
  date: string;
}

export default function Delivery() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        await fetchDeliveries();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const snapshot = await getDocs(collection(db, "deliveries"));
      const data: Delivery[] = [];

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as Omit<Delivery, "id">),
        });
      });

      setDeliveries(data);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <h1 style={{ marginBottom: "20px" }}>Delivery Log</h1>

      {deliveries.length === 0 ? (
        <p>No deliveries found</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Milk</th>
              <th>Extra Milk</th>
              <th>Egg</th>
              <th>Curd</th>
              <th>Chanakapodi</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{item.customerName}</td>
                <td>{item.milk}</td>
                <td>{item.extraMilk || 0}</td>
                <td>{item.egg || 0}</td>
                <td>{item.curd || 0}</td>
                <td>{item.chanakapodi || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}