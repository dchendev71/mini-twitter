import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthPage from "../pages/AuthPage";
import { AuthContext } from "../../context/AuthContext";

const mockLogin = vi.fn();
const mockRegister = vi.fn();

function renderAuthPage() {
  return render(
    <AuthContext.Provider value={{ login: mockLogin, register: mockRegister }}>
      <AuthPage />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthPage", () => {
  describe("Login mode (default)", () => {
    it("renders the login form by default", () => {
      renderAuthPage();
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("does not show the email field in login mode", () => {
      renderAuthPage();
      expect(screen.queryByPlaceholderText("Email")).not.toBeInTheDocument();
    });

    it("calls login with username and password on submit", async () => {
      mockLogin.mockResolvedValueOnce();
      renderAuthPage();

      fireEvent.change(screen.getByPlaceholderText("Username"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
      });
    });

    it("shows an error message when login fails", async () => {
      mockLogin.mockRejectedValueOnce({
        response: { data: { message: "Invalid credentials" } },
      });
      renderAuthPage();

      fireEvent.change(screen.getByPlaceholderText("Username"), {
        target: { value: "wronguser" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "wrongpass" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("shows a fallback error message when error has no response body", async () => {
      mockLogin.mockRejectedValueOnce(new Error("Network error"));
      renderAuthPage();

      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });
    });

    it("disables the submit button while loading", async () => {
      mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
      renderAuthPage();

      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
      });
    });
  });

  describe("Switching to register mode", () => {
    it("switches to register mode when Sign up is clicked", () => {
      renderAuthPage();
      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      expect(screen.getByText("Join today")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    });

    it("clears error message when switching modes", async () => {
      mockLogin.mockRejectedValueOnce({
        response: { data: { message: "Invalid credentials" } },
      });
      renderAuthPage();

      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });

    it("calls register then login on successful registration", async () => {
      mockRegister.mockResolvedValueOnce();
      mockLogin.mockResolvedValueOnce();
      renderAuthPage();

      fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

      fireEvent.change(screen.getByPlaceholderText("Username"), {
        target: { value: "newuser" },
      });
      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "new@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "securepass" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith("newuser", "new@example.com", "securepass");
        expect(mockLogin).toHaveBeenCalledWith("newuser", "securepass");
      });
    });
  });
});
