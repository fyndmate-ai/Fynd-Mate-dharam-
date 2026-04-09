import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import FinderSearch from "./pages/FinderSearch";
import FinderResults from "./pages/FinderResults";
import DesignerOnboarding from "./pages/DesignerOnboarding";
import DesignerSearch from "./pages/DesignerSearch";
import DesignerResults from "./pages/DesignerResults";
import SavedLooks from "./pages/SavedLooks";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/finder" element={<FinderSearch />} />
      <Route path="/finder/results" element={<FinderResults />} />
      <Route path="/designer/onboarding" element={<DesignerOnboarding />} />
      <Route path="/designer" element={<DesignerSearch />} />
      <Route path="/designer/results" element={<DesignerResults />} />
      <Route path="/designer/saved" element={<SavedLooks />} />
    </Routes>
  );
};

export default App;
