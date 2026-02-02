import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import AnswerForm from "./pages/AnswerForm";
import InputQr from "./pages/InputQr";
import Loading from "./pages/Loading";
import Preview from "./pages/Preview";
import PrintStation from "./pages/PrintStation";
import { CardData } from "./api/types";

type AppState = {
  keywords: string[];
  cardId?: string;
  cardData?: CardData;
  cardImageBase64?: string;
  jobId?: string;
  error?: string;
};

type AppStateContextValue = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  reset: () => void;
};

const DEFAULT_STATE: AppState = {
  keywords: []
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("AppStateContext not available");
  }
  return ctx;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const stored = sessionStorage.getItem("ca-rd-state");
    if (!stored) return DEFAULT_STATE;
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) } as AppState;
    } catch {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    sessionStorage.setItem("ca-rd-state", JSON.stringify(state));
  }, [state]);

  const reset = () => setState(DEFAULT_STATE);

  const value = useMemo(() => ({ state, setState, reset }), [state]);

  return (
    <AppStateContext.Provider value={value}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/input" element={<InputQr />} />
          <Route path="/answer/:token" element={<AnswerForm />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/print" element={<PrintStation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStateContext.Provider>
  );
}
