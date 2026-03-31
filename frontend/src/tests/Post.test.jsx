import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Post from "../components/Post";
import { AuthContext } from "../../context/AuthContext";

const mockAuthAxios = vi.fn();

const mockPost = {
  id: 1,
  text: "This is a test post",
  authorId: 1,
  author: { username: "testuser" },
  createdAt: new Date().toISOString(),
  _count: { likes: 0, comments: 0 },
};

function renderPost(post = mockPost) {
  return render(
    <AuthContext.Provider value={{ authAxios: mockAuthAxios }}>
      <Post post={post} onRefresh={vi.fn()} />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Post", () => {
  describe("Rendering", () => {
    it("renders the post text", () => {
      renderPost();
      expect(screen.getByText("This is a test post")).toBeInTheDocument();
    });

    it("renders the author username", () => {
      renderPost();
      expect(screen.getByText("@testuser")).toBeInTheDocument();
    });

    it("renders like and comment buttons", () => {
      renderPost();
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("shows like count when post has likes", () => {
      renderPost({ ...mockPost, _count: { likes: 5, comments: 0 } });
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows comment count when post has comments", () => {
      renderPost({ ...mockPost, _count: { likes: 0, comments: 3 } });
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("falls back to authorId when author object is missing", () => {
      renderPost({ ...mockPost, author: null, authorId: 42 });
      expect(screen.getByText("@42")).toBeInTheDocument();
    });
  });

  describe("Like button", () => {
    it("increments like count when liked", async () => {
      mockAuthAxios.mockResolvedValueOnce({});
      renderPost({ ...mockPost, _count: { likes: 2, comments: 0 } });

      const buttons = screen.getAllByRole("button");
      const likeButton = buttons[1]; // second button is like
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("decrements like count when unliked", async () => {
      mockAuthAxios.mockResolvedValueOnce({}) // like
                   .mockResolvedValueOnce({}); // unlike

      renderPost({ ...mockPost, _count: { likes: 2, comments: 0 } });

      const buttons = screen.getAllByRole("button");
      const likeButton = buttons[1];

      fireEvent.click(likeButton); // like
      await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());

      fireEvent.click(likeButton); // unlike
      await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    });

    it("calls the like API endpoint", async () => {
      mockAuthAxios.mockResolvedValueOnce({});
      renderPost();

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[1]);

      await waitFor(() => {
        expect(mockAuthAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            url: expect.stringContaining("/posts/1/like"),
          })
        );
      });
    });

    it("calls the unlike API endpoint when already liked", async () => {
      mockAuthAxios.mockResolvedValueOnce({}) // like
                   .mockResolvedValueOnce({}); // unlike

      renderPost();
      const buttons = screen.getAllByRole("button");
      const likeButton = buttons[1];

      fireEvent.click(likeButton);
      await waitFor(() => expect(mockAuthAxios).toHaveBeenCalledTimes(1));

      fireEvent.click(likeButton);
      await waitFor(() => {
        expect(mockAuthAxios).toHaveBeenLastCalledWith(
          expect.objectContaining({ method: "DELETE" })
        );
      });
    });
  });

  describe("Comments", () => {
    it("does not show comments section by default", () => {
      renderPost();
      expect(screen.queryByPlaceholderText("Add a comment...")).not.toBeInTheDocument();
    });

    it("shows comments section when comment button is clicked", async () => {
      mockAuthAxios.mockResolvedValueOnce({ data: { comments: [] } });
      renderPost();

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]); // first button is comment

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
      });
    });

    it("shows empty state when there are no comments", async () => {
      mockAuthAxios.mockResolvedValueOnce({ data: { comments: [] } });
      renderPost();

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.getByText("No comments yet. Be the first!")).toBeInTheDocument();
      });
    });

    it("renders fetched comments", async () => {
      mockAuthAxios.mockResolvedValueOnce({
        data: {
          comments: [
            { id: 1, content: "Great post!", author: { username: "alice" } },
            { id: 2, content: "I agree!", author: { username: "bob" } },
          ],
        },
      });
      renderPost();

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.getByText("Great post!")).toBeInTheDocument();
        expect(screen.getByText("I agree!")).toBeInTheDocument();
      });
    });

    it("disables Reply button when comment input is empty", async () => {
      mockAuthAxios.mockResolvedValueOnce({ data: { comments: [] } });
      renderPost();

      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Reply" })).toBeDisabled();
      });
    });

    it("submits a comment and appends it to the list", async () => {
      mockAuthAxios
        .mockResolvedValueOnce({ data: { comments: [] } }) // load comments
        .mockResolvedValueOnce({                            // submit comment
          data: { comment: { id: 99, content: "Nice one!", author: { username: "testuser" } } },
        });

      renderPost();
      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
        target: { value: "Nice one!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Reply" }));

      await waitFor(() => {
        expect(screen.getByText("Nice one!")).toBeInTheDocument();
      });
    });

    it("clears the comment input after submitting", async () => {
      mockAuthAxios
        .mockResolvedValueOnce({ data: { comments: [] } })
        .mockResolvedValueOnce({
          data: { comment: { id: 99, content: "Test comment", author: { username: "testuser" } } },
        });

      renderPost();
      fireEvent.click(screen.getAllByRole("button")[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("Add a comment..."), {
        target: { value: "Test comment" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Reply" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Add a comment...")).toHaveValue("");
      });
    });

    it("hides comments section when comment button is clicked again", async () => {
      mockAuthAxios.mockResolvedValueOnce({ data: { comments: [] } });
      renderPost();

      const commentButton = screen.getAllByRole("button")[0];
      fireEvent.click(commentButton); // open

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Add a comment...")).toBeInTheDocument();
      });

      fireEvent.click(commentButton); // close
      expect(screen.queryByPlaceholderText("Add a comment...")).not.toBeInTheDocument();
    });
  });
});
