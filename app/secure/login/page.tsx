"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SecureLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main login page
    router.push("/login");
  }, [router]);

  return null;
}
