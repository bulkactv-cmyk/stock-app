"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function SuccessPage() {
  const supabase = createClient();

  const [message, setMessage] = useState("Обработваме плащането...");

  useEffect(() => {
    const updatePlan = async () => {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan");

      if (plan !== "pro" && plan !== "unlimited") {
        setMessage("Плащането е успешно, но планът не беше разпознат.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setMessage("Няма логнат потребител. Моля, влез в акаунта си и пробвай пак.");
        return;
      }

      const { error } = await supabase
        .from("user_plans")
        .update({
          plan,
          access_active: true,
        })
        .eq("email", user.email);

      if (error) {
        setMessage(`Грешка при активиране на плана: ${error.message}`);
        return;
      }

      setMessage(`Планът ${plan.toUpperCase()} е активиран успешно.`);
    };

    updatePlan();
  }, [supabase]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#111827",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "16px" }}>Успешно плащане</h1>
        <p style={{ color: "#9ca3af", marginBottom: "24px" }}>{message}</p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Към платформата
          </button>

          <button
            onClick={() => {
              window.location.href = "/pricing";
            }}
            style={{
              background: "#374151",
              color: "white",
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Назад към плановете
          </button>
        </div>
      </div>
    </main>
  );
}