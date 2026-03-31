import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Feed from "../components/Feed";
import { AuthContext } from "../../context/AuthContext";

const mockAuthAxios = vi.fn();

const mockUser = { id: 1, username: "testuser" };

function renderFeed() {
  return render(
    <AuthContext.Provider value={{ user: mockUser, authAxios: mockAuthAxios }}>
      <Feed />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Feed", () => {
  describe("Timeline loading", () => {
    it("shows skeleton loaders while fetching", () => {
      mockAuthAxios.mockImplementation(() => new Promise(() => {})); // never resolves
      renderFeed();
      // Skeletons are rendered as divs — there should be 3
      const skeletons = document.querySelectorAll("[class*='skeleton']:not([class*='Avatar']):not([class*='Lines']):not([class*='Line'])");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when timeline returns no posts", async () => {
      mockAuthAxios.mockResolvedValueOnce({ data: { posts: [] } });
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Welcome to your feed!")).toBeInTheDocument();
      });
    });

    it("renders posts returned from the timeline", async () => {
      mockAuthAxios.mockResolvedValueOnce({
        data: {
          posts: [
            { id: 1, text: "Hello world", authorId: 1, author: { username: "testuser" }, createdAt: new Date().toISOString() },
            { id: 2, text: "Second post", authorId: 1, author: { username: "testuser" }, createdAt: new Date().toISOString() },
          ],
        },
      });
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Hello world")).toBeInTheDocument();
        expect(screen.getByText("Second post")).toBeInTheDocument();
      });
    });
  });

  describe("Compose box", () => {
    beforeEach(() => {
      mockAuthAxios.mockResolvedValueOnce({ data: { posts: [] } });
    });

    it("renders the compose textarea", async () => {
      renderFeed();
      await waitFor(() => {
        expect(screen.getByPlaceholderText("What is happening?!")).toBeInTheDocument();
      });
    });

    it("disables the Post button when textarea is empty", async () => {
      renderFeed();
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
      });
    });

    it("enables the Post button when textarea has content", async () => {
      renderFeed();
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("What is happening?!"), {
          target: { value: "My first tweet" },
        });
        expect(screen.getByRole("button", { name: "Post" })).not.toBeDisabled();
      });
    });

    it("disables the Post button when content exceeds 280 characters", async () => {
      renderFeed();
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("What is happening?!"), {
          target: { value: "a".repeat(281) },
        });
        expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
      });
    });

    it("shows character counter when near the limit", async () => {
      renderFeed();
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("What is happening?!"), {
          target: { value: "a".repeat(265) },
        });
        expect(screen.getByText("15")).toBeInTheDocument();
      });
    });

    it("prepends new post to the feed after successful submit", async () => {
      const newPost = {
        id: 99,
        text: "Brand new post",
        authorId: 1,
        author: { username: "testuser" },
        createdAt: new Date().toISOString(),
      };
      mockAuthAxios.mockResolvedValueOnce({ data: { post: newPost } });

      renderFeed();

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("What is happening?!"), {
          target: { value: "Brand new post" },
        });
      });

      fireEvent.click(screen.getByRole("button", { name: "Post" }));

      await waitFor(() => {
        expect(screen.getByText("Brand new post")).toBeInTheDocument();
      });
    });

    it("clears the textarea after a successful post", async () => {
      const newPost = {
        id: 99,
        text: "Some content",
        authorId: 1,
        author: { username: "testuser" },
        createdAt: new Date().toISOString(),
      };
      mockAuthAxios.mockResolvedValueOnce({ data: { post: newPost } });

      renderFeed();

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("What is happening?!"), {
          target: { value: "Some content" },
        });
      });

      fireEvent.click(screen.getByRole("button", { name: "Post" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("What is happening?!")).toHaveValue("");
      });
    });
  });
});
