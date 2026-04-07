import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import Feed from "../components/Feed";
import styles from "../styles/layout.module.css";

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("Search")

  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "explore", label: "Explore", icon: ExploreIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "profile", label: "Profile", icon: PersonIcon },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.848L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ id, label, Icon = item => item.icon({}) }) => {
            const IconComp = navItems.find(n => n.id === id)?.icon;
            return (
              <button
                key={id}
                className={`${styles.navItem} ${activeTab === id ? styles.active : ""}`}
                onClick={() => setActiveTab(id)}
              >
                {IconComp && <IconComp active={activeTab === id} />}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.userCard} onClick={logout}>
          <div className={styles.avatar}>
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.username}>@{user?.username}</span>
            <span className={styles.logoutHint}>Sign out</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {activeTab === "home" && <Feed />}
        {activeTab === "explore" && (
          <div className={styles.placeholder}>
            <h2>Explore</h2>
            <p>Discover what's happening</p>
          </div>
        )}
        {activeTab === "notifications" && (
          <div className={styles.placeholder}>
            <h2>Notifications</h2>
            <p>You're all caught up</p>
          </div>
        )}
        {activeTab === "profile" && (
          <div className={styles.placeholder}>
            <h2>@{user?.username}</h2>
            <p>Your profile</p>
          </div>
        )}
      </main>

      {/* Right panel */}
      <aside className={styles.rightPanel}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input placeholder="Search"
          value={searchQuery}
          onChange={(e => setSearchQuery(e.target.value))} 
          />
        </div>
        <div className={styles.whoToFollow}>
          <h3>Who to follow</h3>
          <p className={styles.muted}>Follow people to see their posts in your timeline</p>
        </div>
      </aside>
    </div>
  );
}

function HomeIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.51 0 .929-.41.929-.913v-7.075h3.909v7.075c0 .502.417.913.928.913h6.165c.511 0 .929-.41.929-.913V7.903c0-.302-.158-.584-.409-.757z"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.51 0 .929-.41.929-.913v-7.075h3.909v7.075c0 .502.417.913.928.913h6.165c.511 0 .929-.41.929-.913V7.903c0-.302-.158-.584-.409-.757z" strokeLinejoin="round"/></svg>
  );
}

function ExploreIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>;
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function PersonIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>;
}
