import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        {/* Brand */}
        <a className="navbar-brand" href="/" aria-label="SaveMyMeal home">
          <span className="brand-icon" aria-hidden="true">
            ♡
          </span>

          <span className="brand-name">
            SaveMy<span>Meal</span>
          </span>
        </a>

        {/* Navigation links */}
        <div className="navbar-links">
          <a className="nav-link nav-link-active" href="/">
            Home
          </a>

          <a className="nav-link" href="/browse">
            Browse Food
          </a>

          <a className="nav-link" href="/add-food">
            Share Food
          </a>

          <a className="nav-link" href="/reservations">
            My Reservations
          </a>
        </div>

        {/* Primary action */}
        <a className="navbar-cta" href="/browse">
          Find Food <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}