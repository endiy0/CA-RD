import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAppState } from "../App";
import CardPreview from "../components/CardPreview";
import StatBars from "../components/StatBars";
import ErrorBanner from "../components/ErrorBanner";

export default function Preview() {
  const navigate = useNavigate();
  const { state, setState, reset } = useAppState();
  const [status, setStatus] = useState<"idle" | "sending" | "queued" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!state.cardData || !state.cardImageBase64) {
    return (
      <div className="page">
        <div className="panel">
          <p>카드 데이터가 없습니다. 다시 생성해 주세요.</p>
          <button className="primary" onClick={() => navigate("/input")}>키워드 입력</button>
        </div>
      </div>
    );
  }

  const handlePrint = async () => {
    try {
      setStatus("sending");
      const data = await apiFetch<{ jobId: string }>("/api/print", {
        method: "POST",
        body: { image: state.cardImageBase64, meta: { cardId: state.cardId } }
      });

      setState((prev) => ({ ...prev, jobId: data.jobId }));
      setStatus("queued");
    } catch (err) {
      const message = err instanceof Error ? err.message : "프린트 요청 실패";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <div className="page">
      <div className="panel preview">
        <div className="preview-left">
          <CardPreview imageBase64={state.cardImageBase64} />
        </div>
        <div className="preview-right">
          <h2>{state.cardData.name}</h2>
          <p className="subtitle">{state.cardData.class}</p>
          <StatBars stats={state.cardData.stats} />
          <div className="skill">
            <span>Skill</span>
            <strong>{state.cardData.skill}</strong>
          </div>
          <p className="description">{state.cardData.description}</p>
          {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
          <div className="actions">
            <button className="ghost" onClick={() => navigate("/")}>다시 선택</button>
            <button className="primary" onClick={handlePrint} disabled={status === "sending"}>
              {status === "sending" ? "전송 중..." : "인쇄 요청"}
            </button>
          </div>
          {status === "queued" ? (
            <div className="notice">
              <p>프린트 큐에 등록되었습니다. 출력 스테이션에서 자동으로 처리됩니다.</p>
              <button
                className="ghost"
                onClick={() => {
                  reset();
                  navigate("/");
                }}
              >
                처음으로
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
