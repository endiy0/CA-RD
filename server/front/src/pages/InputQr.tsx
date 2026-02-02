import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as QRCode from "qrcode";
import { useAppState } from "../App";
import { apiFetch } from "../api/client";
import { InputSessionCreateResponse, InputSessionStatusResponse } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";

export default function InputQr() {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [token, setToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const didInit = useRef(false);

  const answerUrl = useMemo(() => {
    if (!token) return "";
    return new URL(`/answer/${token}`, window.location.origin).toString();
  }, [token]);

  const createSession = async () => {
    setLoading(true);
    setError(null);
    setPollError(null);
    setToken(null);
    setQrDataUrl(null);
    try {
      const data = await apiFetch<InputSessionCreateResponse>("/api/input/session", {
        method: "POST"
      });
      setToken(data.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "세션 생성 실패";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    createSession();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!answerUrl) {
      setQrDataUrl(null);
      return () => {
        cancelled = true;
      };
    }

    QRCode.toDataURL(answerUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: "#0b0f1a",
        light: "#ffffff"
      }
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("QR 코드 생성에 실패했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [answerUrl]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<InputSessionStatusResponse>(
          `/api/input/session/${token}/status`
        );
        if (!active) return;
        if (data.status === "answered" && data.keywords && data.keywords.length > 0) {
          setState((prev) => ({
            ...prev,
            keywords: data.keywords,
            error: undefined,
            cardData: undefined,
            cardImageBase64: undefined,
            cardId: undefined,
            jobId: undefined
          }));
          navigate("/loading");
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "응답 확인 실패";
        setPollError(message);
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [navigate, setState, token]);

  return (
    <div className="page">
      <div className="panel qr">
        <h2>휴대폰으로 QR을 스캔하세요</h2>
        <p>첫 번째로 접속한 사람이 질문에 답하면 자동으로 진행됩니다.</p>
        <div className="qr-layout">
          <div className="qr-block">
            {loading ? <p>QR 코드를 생성 중입니다...</p> : null}
            {!loading && qrDataUrl ? (
              <img className="qr-image" src={qrDataUrl} alt="QR code" />
            ) : (
              <div className="qr-placeholder">QR 준비 중</div>
            )}
            {answerUrl ? (
              <>
                <p className="hint">카메라로 인식이 안 되면 아래 주소를 입력하세요.</p>
                <div className="qr-link">{answerUrl}</div>
              </>
            ) : null}
          </div>
          <div className="qr-status">
            <div className="spinner" />
            <p>응답을 기다리는 중입니다.</p>
            {pollError ? <p className="hint">{pollError}</p> : null}
          </div>
        </div>
        {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
        <div className="actions">
          <button type="button" className="ghost" onClick={() => navigate("/")}>
            홈
          </button>
          <button type="button" className="primary" onClick={createSession} disabled={loading}>
            새 QR 코드
          </button>
        </div>
      </div>
    </div>
  );
}
