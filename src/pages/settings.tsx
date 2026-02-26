import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Settings() {
  const [settings, setSettings] = useState<any>({
    farmName: "Ann's Dairy Farm",
    ownerName: "Eldho Jacob",
    phone1: "",
    phone2: "",
    milkRates: [],
    eggRates: [],
    curdRates: [],
    dungRates: [],
  });

  const [newMilkRate, setNewMilkRate] = useState("");
  const [newEggRate, setNewEggRate] = useState("");
  const [newCurdRate, setNewCurdRate] = useState("");
  const [newDungRate, setNewDungRate] = useState("");

  // 🔹 Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "business"));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // 🔹 Add rate to state properly
  const addRate = (type: string, rate: number) => {
    if (!rate) return;

    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    const updatedRates = [
      ...(settings[type] || []),
      { rate, from: monthKey },
    ];

    setSettings((prev: any) => ({
      ...prev,
      [type]: updatedRates,
    }));
  };

  // 🔹 Save to Firestore
  const handleSave = async () => {
    try {
      await setDoc(
        doc(db, "settings", "business"),
        settings,
        { merge: true }   // 🔥 important
      );

      alert("Settings Saved Successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Settings ⚙
      </h1>

      <div className="bg-white p-6 rounded shadow space-y-6">

        {/* Milk Rate */}
        <div>
          <h2 className="font-bold mb-2">Milk Rate</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="New Milk Rate"
              value={newMilkRate}
              onChange={(e) => setNewMilkRate(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={() => {
                addRate("milkRates", Number(newMilkRate));
                setNewMilkRate("");
              }}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* Egg Rate */}
        <div>
          <h2 className="font-bold mb-2">Egg Rate</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="New Egg Rate"
              value={newEggRate}
              onChange={(e) => setNewEggRate(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={() => {
                addRate("eggRates", Number(newEggRate));
                setNewEggRate("");
              }}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* Curd Rate */}
        <div>
          <h2 className="font-bold mb-2">Curd Rate</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="New Curd Rate"
              value={newCurdRate}
              onChange={(e) => setNewCurdRate(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={() => {
                addRate("curdRates", Number(newCurdRate));
                setNewCurdRate("");
              }}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* Chanakapodi Rate */}
        <div>
          <h2 className="font-bold mb-2">Chanakapodi Rate</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="New Chanakapodi Rate"
              value={newDungRate}
              onChange={(e) => setNewDungRate(e.target.value)}
              className="p-2 border rounded"
            />
            <button
              onClick={() => {
                addRate("dungRates", Number(newDungRate));
                setNewDungRate("");
              }}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Save All Settings
        </button>
      </div>
    </Layout>
  );
}