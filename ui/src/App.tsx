import { Route, Routes } from "react-router";
import SignIn from "./components/pages/SignIn";
import Page from "./components/pages/Page";
import Dashboard from "./components/pages/Dashboard";
import Service from "./components/pages/Service";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/" element={<Page />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/service/:service" element={<Service />} />
      </Route>
    </Routes>
  );
}

export default App;
