import "vite/modulepreload-polyfill";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <BrowserRouter basename="/ui">
        <App />
      </BrowserRouter>
    </RecoilRoot>
    <Toaster toastOptions={{ position: "bottom-center" }} />
  </React.StrictMode>
);
