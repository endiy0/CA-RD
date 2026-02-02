import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { GenerateResponse } from "../api/types";
import { useAppState } from "../App";

export default function Loading() {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!state.keywords || state.keywords.length === 0) {
        navigate("/input");
        return;
      }

      try {
        const data = await apiFetch<GenerateResponse>("/api/generate", {
          method: "POST",
          body: { keywords: state.keywords }
        });

        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          cardId: data.cardId,
          cardData: data.cardData,
          cardImageBase64: data.cardImageBase64,
          error: undefined
        }));
        navigate("/preview");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "생성 실패";
        setState((prev) => ({ ...prev, error: message }));
        setError(message);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, setState, state.keywords]);

  return (
    <div className="page">
      <div className="panel loading">
        <div className="spinner" />
        <h2>AI 생성 중...</h2>
        <p>주파수 정렬 중입니다. 잠시만 기다려 주세요.</p>
        {error ? (
          <div className="error-block">
            <p>{error}</p>
            <button className="primary" onClick={() => navigate("/input")}>다시 입력</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
