import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import Post from "./Post";
import styles from "../styles/feed.module.css";

const API = "http://localhost:4000";

export default function Feed() {
  const { user, authAxios } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await authAxios({ method: "POST", url: `${API}/posts/timeline` });
      setPosts(res.data.posts || []);
    } catch (e) {
      console.error("Failed to load timeline", e);
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const submitPost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const res = await authAxios({
        method: "POST",
        url: `${API}/posts`,
        data: { content },
      });
      setPosts((prev) => [res.data.post, ...prev]);
      setContent("");
    } catch (e) {
      console.error("Failed to post", e);
    } finally {
      setPosting(false);
    }
  };

  const remaining = 280 - content.length;
  const overLimit = remaining < 0;
  const nearLimit = remaining <= 20;

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <h2>Home</h2>
      </div>

      {/* Compose */}
      <div className={styles.compose}>
        <div className={styles.avatar}>
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className={styles.composeRight}>
          <textarea
            className={styles.textarea}
            placeholder="What is happening?!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className={styles.composeActions}>
            <div className={styles.charCounter}>
              {nearLimit && (
                <span className={overLimit ? styles.over : styles.near}>
                  {remaining}
                </span>
              )}
            </div>
            <button
              className={styles.postBtn}
              onClick={submitPost}
              disabled={!content.trim() || overLimit || posting}
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Timeline */}
      {loading ? (
        <div className={styles.loading}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonLines}>
                <div className={styles.skeletonLine} style={{ width: "40%" }} />
                <div className={styles.skeletonLine} style={{ width: "80%" }} />
                <div className={styles.skeletonLine} style={{ width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <h3>Welcome to your feed!</h3>
          <p>Post something to get started</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <Post key={post.id} post={post} onRefresh={fetchTimeline} />
          ))}
        </div>
      )}
    </div>
  );
}
