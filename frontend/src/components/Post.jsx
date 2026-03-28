import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import styles from "../styles/post.module.css";

const API = "http://localhost:4000";

export default function Post({ post, onRefresh }) {
  const { authAxios } = useContext(AuthContext);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count?.comments ?? 0);

  const authorName = post.author?.username || post.authorId || "unknown";
  const timeAgo = formatTime(post.createdAt);

  const toggleLike = async () => {
    try {
      if (liked) {
        await authAxios({ method: "DELETE", url: `${API}/posts/${post.id}/like` });
        setLikeCount((n) => n - 1);
      } else {
        await authAxios({ method: "POST", url: `${API}/posts/${post.id}/like` });
        setLikeCount((n) => n + 1);
      }
      setLiked(!liked);
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const res = await authAxios({ method: "GET", url: `${API}/comments/${post.id}/` });
      setComments(res.data.comments || res.data || []);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await authAxios({
        method: "POST",
        url: `${API}/comments/${post.id}/`,
        data: { content: commentText },
      });
      setComments((prev) => [...prev, res.data.comment || res.data]);
      setCommentText("");
      setCommentCount((n) => n + 1);
    } catch (e) {
      console.error("Comment failed", e);
    }
  };

  return (
    <article className={styles.post}>
      <div className={styles.avatarCol}>
        <div className={styles.avatar}>
          {authorName[0]?.toUpperCase()}
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.name}>@{authorName}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.time}>{timeAgo}</span>
        </div>
        <p className={styles.text}>{post.text}</p>

        <div className={styles.actions}>
          <button className={styles.action} onClick={loadComments}>
            <CommentIcon />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
          <button
            className={`${styles.action} ${liked ? styles.liked : ""}`}
            onClick={toggleLike}
          >
            <HeartIcon filled={liked} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>

        {showComments && (
          <div className={styles.comments}>
            {loadingComments ? (
              <p className={styles.loadingText}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className={styles.noComments}>No comments yet. Be the first!</p>
            ) : (
              comments.map((c, i) => (
                <div key={c.id || i} className={styles.comment}>
                  <span className={styles.commentAuthor}>@{c.author?.username || c.authorId || "user"}</span>
                  <span className={styles.commentText}>{c.content || c.text}</span>
                </div>
              ))
            )}
            <div className={styles.commentForm}>
              <input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
              />
              <button onClick={submitComment} disabled={!commentText.trim()}>Reply</button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function HeartIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="#f91880" width="18" height="18">
      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" strokeLinejoin="round"/>
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round"/>
    </svg>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
