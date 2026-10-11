import "./Home.css";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            A LITTLE KINDNESS GOES A LONG WAY
          </span>

          <h1 className="hero-title">
            Good food deserves
            <span> another chance.</span>
          </h1>

          <p className="hero-description">
            Share what you have. Find what you need.
            Together, we can make less food go to waste
            and bring a little more kindness into the world.
          </p>

          <div className="hero-actions">
            <a href="/browse" className="hero-button hero-button-primary">
              Explore Available Food
              <span aria-hidden="true"> ↗</span>
            </a>

            <a href="/add-food" className="hero-button hero-button-secondary">
              Share Surplus Food
            </a>
          </div>

          <div className="hero-note">
            <span className="hero-note-icon" aria-hidden="true">
              ♡
            </span>

            <p>Small acts of sharing can make a real difference.</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Food sharing illustration">
          <div className="hero-visual-decoration decoration-one"></div>
          <div className="hero-visual-decoration decoration-two"></div>

          <div className="hero-visual-content">
            <span className="visual-heart" aria-hidden="true">
              ♡
            </span>

            <div className="visual-plate" aria-hidden="true">
              <span>🥗</span>
            </div>

            <p className="visual-caption">
              Goodness is better when shared.
            </p>
          </div>

          
        </div>
      </section>
    </main>
  );
}