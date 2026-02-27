import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { auth } from "../firebase";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db,getUserRole } from "../firebase";

export default function Customers() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [search, setSearch] = useState("");

  // Add Customer
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [milkLitres, setMilkLitres] = useState("");

  // Pause
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");

  // Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
         const role = await
        getUserRole(user.uid);
        console.log("Role:",role);
          if (role !=="admin"){
            //router.push("/delivery");
            //return;     
          }
          await fetchData();
          setLoading(false);
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

  // ================= ADD CUSTOMER =================
  const handleAddCustomer = async () => {
    if (!name || !phone || !milkLitres) {
      alert("Fill all required fields");
      return;
    }

    await addDoc(collection(db, "customers"), {
      name,
      phone,
      address,
      milkLitres: parseFloat(milkLitres),
      isPaused: false,
      pauseStart: null,
      pauseEnd: null,
      payments: {},
    });

    setName("");
    setPhone("");
    setAddress("");
    setMilkLitres("");
    setShowAddModal(false);
    fetchData();
  };

  // ================= DELETE =================
  const handleDelete = async (id: string) => {
    if (!confirm("Delete customer?")) return;
    await deleteDoc(doc(db, "customers", id));
    fetchData();
  };

  // ================= PAUSE =================
  const handlePause = async () => {
    if (!pauseStart || !pauseEnd || !selectedCustomer?.id) {
      alert("Select both dates");
      return;
    }

    await updateDoc(doc(db, "customers", selectedCustomer.id), {
      isPaused: true,
      pauseStart,
      pauseEnd,
    });

    setShowPauseModal(false);
    setPauseStart("");
    setPauseEnd("");
    setSelectedCustomer(null);
    fetchData();
  };

  const handleResume = async (id: string) => {
    await updateDoc(doc(db, "customers", id), {
      isPaused: false,
      pauseStart: null,
      pauseEnd: null,
    });
    fetchData();
  };

  // ================= ADD PRODUCT (INCLUDING EXTRA MILK) =================
  const handleAddProduct = async () => {
    if (!productType || !quantity || !selectedCustomer?.id) {
      alert("Select product and quantity");
      return;
    }

    let rate = 0;

    if (productType === "ExtraMilk") {
      rate = getCurrentRate(settings?.milkRates);
    }

    if (productType === "Egg") {
      rate = getCurrentRate(settings?.eggRates);
    }

    if (productType === "Curd") {
      rate = getCurrentRate(settings?.curdRates);
    }

    if (productType === "Chanakapodi") {
      rate = getCurrentRate(settings?.dungRates);
    }

    await addDoc(collection(db, "transactions"), {
      customerId: selectedCustomer.id,
      product: productType,
      quantity: Number(quantity),
      rate,
      date: new Date().toISOString().split("T")[0],
    });

    setShowProductModal(false);
    setProductType("");
    setQuantity("");
    setSelectedCustomer(null);

    alert("Product added successfully");
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-10">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Customer Management 🥛
      </h1>

      <input
        type="text"
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={() => setShowAddModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        + Add Customer
      </button>

      <div className="bg-white p-6 rounded shadow">
        {customers
          .filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.includes(search)
          )
          .map((customer) => (
            <div
              key={customer.id}
              className="border-b py-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
                <p className="text-sm text-gray-500">{customer.address}</p>
                <p className="text-sm">
                  Milk: {customer.milkLitres} L/day
                </p>

                {customer.isPaused ? (
                  <span className="text-red-600 text-sm">Paused</span>
                ) : (
                  <span className="text-green-600 text-sm">Active</span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!customer.isPaused ? (
                  <button
                    onClick={() => {
                      setSelectedCustomer({ ...customer });
                      setShowPauseModal(true);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleResume(customer.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Resume
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedCustomer({ ...customer });
                    setShowProductModal(true);
                  }}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Product
                </button>

                <button
                  onClick={() => handleDelete(customer.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-4">Add Customer</h2>

            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />

            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />

            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />

            <input
              type="number"
              placeholder="Milk Litres"
              value={milkLitres}
              onChange={(e) => setMilkLitres(e.target.value)}
              className="w-full p-2 border mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-4">Pause Customer</h2>

            <input
              type="date"
              value={pauseStart}
              onChange={(e) => setPauseStart(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />

            <input
              type="date"
              value={pauseEnd}
              onChange={(e) => setPauseEnd(e.target.value)}
              className="w-full p-2 border mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPauseModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePause}
                className="bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-4">Add Product</h2>

            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            >
              <option value="">Select Product</option>
              <option value="ExtraMilk">Extra Milk</option>
              <option value="Egg">Egg</option>
              <option value="Curd">Curd</option>
              <option value="Chanakapodi">Chanakapodi</option>
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 border mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowProductModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}