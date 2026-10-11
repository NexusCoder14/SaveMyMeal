import "./Navbar.css";

export default function Navbar() {
  const currentPath = window.location.pathname;

  return (
    <header className="site-header">
      <nav className="navbar container">
        {/* Logo */}
        <a href="/" className="navbar-brand">
          <span className="brand-icon">♡</span>
          <span className="brand-name">
            SaveMy<span>Meal</span>
          </span>
        </a>

        {/* Navigation Links */}
        <div className="navbar-links">
          <a
            href="/"
            className={`nav-link ${
              currentPath === "/" ? "nav-link-active" : ""
            }`}
          >
            Home
          </a>

          <a
            href="/browse"
            className={`nav-link ${
              currentPath === "/browse" ? "nav-link-active" : ""
            }`}
          >
            Browse Food
          </a>

          <a
            href="/add-food"
            className={`nav-link ${
              currentPath === "/add-food" ? "nav-link-active" : ""
            }`}
          >
            Share Food
          </a>

          <a
            href="/reservations"
            className={`nav-link ${
              currentPath === "/reservations" ? "nav-link-active" : ""
            }`}
          >
            My Reservations
          </a>
        </div>

        {/* Call to Action */}
        <a href="/browse" className="navbar-cta">
          Find Food
        </a>
      </nav>
    </header>
  );
}