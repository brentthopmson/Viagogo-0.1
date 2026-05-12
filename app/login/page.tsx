"use client";

import AdminLogin from "../components/AdminLogin";
import { useUser } from "../UserContext";

export default function LoginPage() {
  const { setLoggedInAdmin, setUsers } = useUser();
  return <AdminLogin setLoggedInAdmin={setLoggedInAdmin} setUsers={setUsers} />;
}
