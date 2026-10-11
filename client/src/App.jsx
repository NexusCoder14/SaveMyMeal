import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      <main className="container">
        <h1>Welcome to SaveMyMeal</h1>

        <p>
          Good food deserves another chance. Share what you have,
          find what you need, and help reduce food waste.
        </p>
      </main>
    </>
  );
}

export default App;