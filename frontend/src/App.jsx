import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import AuthPage from "./pages/AuthPage";
import MainLayout from "./pages/MainLayout";

export default function App() {
  const { accessToken } = useContext(AuthContext);

  return accessToken ? <MainLayout /> : <AuthPage />;
}