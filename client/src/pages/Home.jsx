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
      <section className="how-it-works">
  <div className="how-it-works-heading">
    <span className="section-eyebrow">SIMPLE BY NATURE</span>

    <h2>
      A little sharing goes <span>a long way.</span>
    </h2>

    <p>
      Making a difference doesn't have to be complicated.
      It starts with three simple steps.
    </p>
  </div>

  <div className="steps-grid">
    <article className="step-card">
      <span className="step-number">01</span>

      <div className="step-icon" aria-hidden="true">
        ♡
      </div>

      <h3>Share</h3>

      <p>
        Have extra food? Share what you can so it finds
        someone who needs it.
      </p>
    </article>

    <article className="step-card">
      <span className="step-number">02</span>

      <div className="step-icon" aria-hidden="true">
        ⌕
      </div>

      <h3>Discover</h3>

      <p>
        Explore available food in your community and
        find something that works for you.
      </p>
    </article>

    <article className="step-card">
      <span className="step-number">03</span>

      <div className="step-icon" aria-hidden="true">
        →
      </div>

      <h3>Collect</h3>

      <p>
        Reserve what you need and arrange collection
        with the person sharing it.
      </p>
    </article>
  </div>
</section>
    </main>
  );
}