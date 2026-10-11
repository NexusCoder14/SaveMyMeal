import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import BrowseFood from "./pages/BrowseFood";
import FoodDetails from "./pages/FoodDetails";
import MyReservations from "./pages/MyReservations";

function App() {
  const currentPath = window.location.pathname;

  let page;

  if (currentPath === "/browse") {
    page = <BrowseFood />;
  } else if (currentPath === "/reservations") {
    page = <MyReservations />;
  } else if (currentPath.startsWith("/food/")) {
    const foodId = currentPath.split("/")[2];
    page = <FoodDetails foodId={foodId} />;
  } else {
    page = <Home />;
  }

  return (
    <>
      <Navbar />
      {page}
    </>
  );
}

export default App;