import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store, persistor } from "./store";
import App from "./App";
import "./index.css";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

console.log('🌊 CTAS Starting up...');

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>} persistor={persistor}>
        <App />
        <Toaster />
      </PersistGate>
    </Provider>
  </StrictMode>
);
