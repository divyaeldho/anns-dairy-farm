import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function Sidebar() {
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Customers", path: "/customers" },
    { name: "Billing", path: "/billing" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
    { name: "Delivery Log", path: "/delivery"}
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="w-64 min-h-screen bg-sky-600 text-white p-6 flex flex-col justify-between">
      
      {/* Top Section */}
      <div>
        <h1 className="text-2xl font-bold mb-10">
          Ann’s Dairy Farm 🐄
        </h1>

        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`p-3 rounded-lg transition ${
                router.pathname === item.path
                  ? "bg-white text-sky-700 font-semibold"
                  : "hover:bg-sky-500"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom Section - Logout */}
      <div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition"
        >
          Logout
        </button>
      </div>

    </div>
  );
}