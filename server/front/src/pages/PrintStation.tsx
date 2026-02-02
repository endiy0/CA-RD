import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "../api/client";
import ErrorBanner from "../components/ErrorBanner";

const AGENT_URL = "http://127.0.0.1:18181";

function getClientId() {
  const key = "ca-rd-print-client";
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

type PrintJob = {
  jobId: string;
  imageBase64: string;
  meta?: { cardId?: string };
};

export default function PrintStation() {
  const clientId = useMemo(() => getClientId(), []);
  const socketRef = useRef<Socket | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [agentOk, setAgentOk] = useState(false);
  const [status, setStatus] = useState("대기 중");
  const [error, setError] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [busy, setBusy] = useState(false);

  const checkAgent = useCallback(async () => {
    try {
      const res = await fetch(`${AGENT_URL}/health`);
      if (!res.ok) throw new Error("agent offline");
      setAgentOk(true);
      return true;
    } catch {
      setAgentOk(false);
      return false;
    }
  }, []);

  const reportDone = useCallback(async (jobId: string, ok: boolean, message?: string) => {
    await apiFetch(`/api/print/${jobId}/done`, {
      method: "POST",
      body: {
        status: ok ? "printed" : "failed",
        message
      }
    });
  }, []);

  const sendToAgent = useCallback(
    async (job: PrintJob) => {
      setStatus("로컬 프린터로 전송 중...");
      const agentReady = await checkAgent();
      if (!agentReady) {
        await reportDone(job.jobId, false, "agent offline");
        setError("프린트 에이전트를 찾을 수 없습니다.");
        setStatus("대기 중");
        return;
      }

      try {
        const res = await fetch(`${AGENT_URL}/print`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: job.imageBase64,
            printerName: printerName.trim() || undefined
          })
        });

        if (!res.ok) {
          const text = await res.text();
          await reportDone(job.jobId, false, text || "print failed");
          setError("용지/잉크 확인 후 다시 시도하세요.");
          setStatus("대기 중");
          return;
        }

        await reportDone(job.jobId, true);
        setStatus("인쇄 완료");
      } catch (err) {
        const message = err instanceof Error ? err.message : "print error";
        await reportDone(job.jobId, false, message);
        setError("용지/잉크 확인 후 다시 시도하세요.");
        setStatus("대기 중");
      }
    },
    [checkAgent, printerName, reportDone]
  );

  const claimNext = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/print/next?clientId=${clientId}`);
      if (res.status === 204) {
        setStatus("대기 중");
        return;
      }
      if (!res.ok) {
        throw new Error(`claim failed ${res.status}`);
      }
      const job = (await res.json()) as PrintJob;
      setStatus("작업 수신");
      await sendToAgent(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "큐 처리 실패");
      setStatus("대기 중");
    } finally {
      setBusy(false);
    }
  }, [busy, clientId, sendToAgent]);

  useEffect(() => {
    checkAgent();
  }, [checkAgent]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.log("socket connect_error", err);
    });
    socket.on("disconnect", (reason) => {
      console.log("socket disconnected", reason);
    });

    socket.on("print:queue_update", (payload: { pendingCount: number }) => {
      setPendingCount(payload.pendingCount);
      claimNext();
    });

    socket.on("print:new_job", () => {
      claimNext();
    });

    return () => {
      socket.disconnect();
    };
  }, [claimNext]);

  useEffect(() => {
    const interval = setInterval(() => {
      claimNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [claimNext]);

  return (
    <div className="page">
      <div className="panel print">
        <div className="tag">Print Station</div>
        <h2>출력 스테이션</h2>
        <div className="status-grid">
          <div>
            <span>큐 대기</span>
            <strong>{pendingCount}</strong>
          </div>
          <div>
            <span>에이전트</span>
            <strong className={agentOk ? "ok" : "warn"}>{agentOk ? "ONLINE" : "OFFLINE"}</strong>
          </div>
          <div>
            <span>상태</span>
            <strong>{status}</strong>
          </div>
        </div>
        <label className="printer-field">
          프린터 이름 (선택)
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="기본 프린터 사용"
          />
        </label>
        {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
        <div className="actions">
          <button className="ghost" onClick={checkAgent}>에이전트 재확인</button>
          <button className="primary" onClick={claimNext} disabled={busy}>수동 클레임</button>
        </div>
        <p className="hint">프린트 실패 시: 용지/잉크 확인 후 재시도하세요.</p>
      </div>
    </div>
  );
}
