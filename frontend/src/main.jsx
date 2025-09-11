import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import "./index.css";
import { persistStore } from "redux-persist"
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";


const persistor = persistStore(store);

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
    <Toaster />
  </StrictMode>
);
