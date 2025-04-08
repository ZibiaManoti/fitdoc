"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function BottomBar({ activePage = "dashboard", onNavigate = () => {} }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-home" },
    { id: "workouts", label: "Workouts", icon: "fas fa-dumbbell" },
    { id: "nutrition", label: "Nutrition", icon: "fas fa-apple-alt" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-1/4 py-2 px-3 transition-colors ${
                activePage === item.id
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              aria-label={item.label}
            >
              <i className={`fas ${item.icon} text-xl mb-1`}></i>
              <span className="text-xs font-roboto">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function BottomBarContainer() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    setCurrentPage(pathname.replace("/", "") || "dashboard");
  }, [pathname]);

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    router.push(`/${pageId}`);
  };

  return <BottomBar activePage={currentPage} onNavigate={handleNavigate} />;
}
