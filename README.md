# Mini-Twitter / Microblogging Platform

This document has been generated with ChatGPT. It will be used as guidelines.

**Domain:** Social Networks, Real-Time Systems, Distributed Systems

**Goal:** Understand feed generation, data modeling, and scalability by implementing a small but production-minded microblogging service.

---

## 1. Overview & Goals

Build a minimal Twitter-like system where users can register, post short messages ("tweets"), follow other users, like and retweet posts, and receive a newsfeed. The project focuses on architecture decisions that illustrate trade-offs between correctness, complexity and scalability.

**Primary learning goals:**

* Database modeling for social graphs and timeline data
* Feed generation strategies (fan-out on write vs. fan-out on read)
* Caching and timeline storage (Redis) and cache invalidation
* Event-driven components and async processing
* Security, rate-limiting, and anti-abuse

---

## 2. Key Features to Implement

1. **User Authentication** — JWT-based (optionally OAuth 2.0 for third-party login)
2. **Posts (Tweets)** — create/read/delete; text-first, optional image attachment (object storage)
3. **Follow / Unfollow** — maintain follow relationships and follower counts
4. **Newsfeed** — reverse-chronological primary option; discussion of ranked feed alternatives
5. **Like / Retweet** — support basic interactions and counters
6. **Notifications** — new follower, liked tweet, retweet (simple push / in-app queue)
7. **Admin tools** — moderate content, ban users, view rate-limit abuse

---

## 3. Minimal Tech Stack (suggested)

* API: Node.js + Express / Python + FastAPI / Go (any modern web framework)
* Auth: JWT (RS256) and refresh tokens; OAuth 2.0 (optional)
* Primary DB: PostgreSQL (relational modelling + indexes)
* Cache / Timelines: Redis (sorted sets / lists / streams)
* Object storage: S3-compatible (images)
* Message queue / Stream: Kafka / RabbitMQ / Redis Streams for async work
* Search (optional): Elasticsearch for full-text search / ranking
* Monitoring: Prometheus + Grafana + ELK for logs

---

## 4. Data Modeling (SQL-style schemas)

### Users

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  display_name VARCHAR(128),
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### Posts (tweets)

```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(280) NOT NULL,
  attachments JSONB, -- {"images": ["s3://..."]}
  is_retweet BOOLEAN DEFAULT FALSE,
  retweet_of BIGINT NULL REFERENCES posts(id),
  likes_count INT DEFAULT 0,
  retweets_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON posts (created_at DESC);
CREATE INDEX ON posts (user_id, created_at DESC);
```

### Follows (social graph)

```sql
CREATE TABLE follows (
  follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  followee_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX ON follows (followee_id); -- to count followers quickly
```

### Likes

```sql
CREATE TABLE likes (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
```

### Notifications (simple)

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32), -- e.g., 'follow','like','retweet'
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. API Endpoints (example)

### Auth

* `POST /api/v1/auth/register` — register
* `POST /api/v1/auth/login` — returns access & refresh JWTs
* `POST /api/v1/auth/refresh` — refresh token

### Users

* `GET /api/v1/users/{username}` — profile
* `POST /api/v1/users/{username}/follow` — follow
* `POST /api/v1/users/{username}/unfollow` — unfollow

### Posts

* `POST /api/v1/posts` — create post (body: `{text, attachments}`)
* `GET /api/v1/posts/{id}` — get post
* `GET /api/v1/users/{username}/posts?limit=&cursor=` — user timeline (paginated)

### Feed

* `GET /api/v1/feed?limit=&cursor=` — authenticated user's home timeline

### Interactions

* `POST /api/v1/posts/{id}/like`
* `POST /api/v1/posts/{id}/retweet`

### Notifications

* `GET /api/v1/notifications` — list notifications
* `POST /api/v1/notifications/{id}/read`

---

## 6. Feed Generation Strategies

### 1) Fan-out on Write (push)

* When a user posts, the system pushes the post ID into each follower's timeline store (e.g. Redis list or sorted set).
* Pros: fast reads for home timelines; low read-latency.
* Cons: heavy write amplification for users with many followers (celebrity problem); needs backpressure/async batching.
* Implementation notes: use a background worker + queue to fan-out; for very large fans (followers > threshold) skip push and store separately as a "global hot" stream or rely on fan-out on read.

### 2) Fan-out on Read (pull)

* Store posts per user; on read, merge the most recent posts from followees (SQL + Redis caches or k-way merge of sorted sets).
* Pros: cheaper writes; simpler correctness; scalable for users with enormous followings.
* Cons: slower read latency; heavier compute at read time; requires efficient merging and caching of results.

### Hybrid

* Push for normal users; fall back to pull for celebrities. Maintain a hot cache for celebrity posts.

**Pagination & Cursors:** Prefer cursor-based pagination (e.g., `created_at,id` pair) over offset for consistent, performant pages.

---

## 7. Caching & Timeline Storage

* Use Redis **lists** or **sorted sets** to store timeline post IDs per user (`timeline:{user_id}` with score=timestamp).
* TTL: keep recent N items in Redis, fall back to DB for older pages.
* When a post is liked/retweet counts change, update counts in DB and invalidate/update cache entries.
* Populate cold caches asynchronously on first read (cache-aside pattern).

Redis data example:

* `timeline:user:123` -> sorted set of (score=epoch\_ms, value=post\_id)
* `user:posts:123` -> list of user's own posts for quick user timeline

---

## 8. Notifications & Eventing

* Publish domain events on actions: `PostCreated`, `FollowCreated`, `PostLiked`, `PostRetweeted` to a message bus (Kafka/RabbitMQ/Redis Streams).
* Consumers:

  * Notification service: writes notification records + pushes to websocket / push gateway
  * Fan-out worker: handles timeline writes
  * Analytics service: aggregates metrics

Delivery options for notifications:

* In-app: Polling endpoint or websocket for real-time push
* Push: APNS / FCM for mobile

---

## 9. Security & Abuse Prevention

* **Rate limiting** — per-IP and per-user (e.g., 300 posts/day, 1 post/second burst limit). Implement token-bucket in Redis.
* **Content moderation** — automated filter (profanity, spam heuristics) + manual review queue
* **Auth security** — short-lived access tokens, rotating refresh tokens, revoke tokens on password change
* **Input validation** — sanitize text and attachments, limit sizes
* **Prevent spam** — follow/follower rate limits, CAPTCHAs for suspicious activity
* **Data privacy** — encryption at rest for sensitive fields, HTTPS everywhere

---

## 10. Scalability Considerations

* **DB sharding / partitioning**: shard posts by user\_id range or use time-based partitioning for posts table.
* **Read replicas**: offload reads (user timelines, profiles) to replicas; ensure read-after-write consistency where needed.
* **Horizontal workers**: scale fan-out workers and consumer groups in the message bus.
* **Storage**: serve media via CDN fronting S3.
* **Indexes**: index `posts(user_id, created_at)`, `follows(followee_id)` to optimize common queries.
* **Handling super-followers**: for users with millions of followers, store their posts in a special public timeline and materialize into follower timelines lazily.

---

## 11. Observability & Testing

* **Metrics**: track request latency, error rates, queue lag, fan-out throughput, timeline cache hit/miss
* **Logging**: structured logs with correlation IDs for tracing
* **Tracing**: distributed tracing (OpenTelemetry) to follow events across services
* **Tests**:

  * Unit tests for business logic
  * Integration tests with an in-memory Redis and a test Postgres
  * Load tests simulating posting and feed reads (k6, locust)

---

## 12. Developer Roadmap (MVP -> v1 -> future)

**MVP** (1-2 sprints):

* JWT auth, user registration/login
* Create/read posts (text only)
* Follow/unfollow
* Simple fan-out-on-read home feed (merge followees' posts at read time)
* Like/retweet counters
* Basic notifications (DB table + poll endpoint)

**v1** (scaling + UX improvements):

* Redis-backed fan-out-on-write for normal users
* Cursor pagination, rate limiting, image attachments (S3)
* Websocket-based live notifications
* Background worker + message bus

**Future / Nice-to-have**:

* Ranked feed with signals (ML) and A/B testing
* Search and topic streams
* Verified accounts / content moderation dashboard
* Analytics dashboard for creators

---

## 13. Example Implementation Notes (Tips & Pitfalls)

* Use idempotency keys for post creation to avoid duplicates when retries happen.
* Avoid joining huge follower lists in a single DB query; paginate follower lists and use background workers.
* When writing to many timelines, batch writes and use pipelining in Redis.
* Keep counters (likes/retweets) eventually consistent — update a counter cache and periodically reconcile with DB.

---

## 14. References & Further Reading

* Twitter engineering blog posts on fan-out engineering
* Martin Kleppmann — *Designing Data-Intensive Applications* (for event-driven architectures)
* Postgres docs — indexes and partitioning
* Redis docs — sorted sets, streams

---

## 15. Appendix: Minimal Sequence (Create Post -> Fan-out -> Read)

1. Client `POST /posts` with JWT -> API validates & stores post record in Postgres.
2. API publishes `PostCreated` event to message bus.
3. Fan-out worker consumes event, reads follower list (or uses cached follower list), writes post ID to each follower's `timeline:{id}` in Redis (or marks it for lazy materialization).
4. Followers request `GET /feed`, API reads `timeline:{user}` from Redis and resolves post IDs to full post objects (batch DB/Redis calls).
5. Notification service creates notifications for followers if necessary (optional: only for mentions).
