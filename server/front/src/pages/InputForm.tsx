import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../App";
import ErrorBanner from "../components/ErrorBanner";
import { apiFetch } from "../api/client";
import { Question, QuestionsResponse } from "../api/types";

export default function InputForm() {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = useMemo(
    () =>
      name.trim().length > 0 &&
      questions.length > 0 &&
      questions.every((q) => (answers[q.id] || "").trim().length > 0),
    [answers, name, questions]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<QuestionsResponse>("/api/questions");
        if (cancelled) return;
        setQuestions(data.questions);
        setSessionId(data.sessionId);
        setAnswers({});
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "질문 생성 실패";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!allAnswered) {
      setError("모든 질문에 답해주세요.");
      return;
    }

    const keywords = [
      `session:${sessionId}`,
      `name:${name.trim()}`,
      ...questions.map((q) => `q${q.id}:${answers[q.id]}`.trim())
    ].filter(Boolean);

    if (keywords.length === 0) {
      setError("답변을 입력해 주세요.");
      return;
    }

    setState((prev) => ({
      ...prev,
      keywords,
      error: undefined,
      cardData: undefined,
      cardImageBase64: undefined,
      cardId: undefined,
      jobId: undefined
    }));

    navigate("/loading");
  };

  return (
    <div className="page">
      <form className="panel form" onSubmit={onSubmit}>
        <h2>질문에 답해주세요</h2>
        <label>
          이름
          <input
            type="text"
            placeholder="예: Nova"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            maxLength={12}
          />
        </label>
        {loading ? <p>질문을 생성 중입니다...</p> : null}
        {!loading &&
          questions.map((q) => (
            <label key={q.id}>
              {q.text}
              <input
                type="text"
                placeholder="짧게 답해주세요"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value.slice(0, 200) }))
                }
                maxLength={200}
              />
            </label>
          ))}
        {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
        <div className="actions">
          <button type="button" className="ghost" onClick={() => navigate("/")}>홈</button>
          <button
            type="button"
            className="ghost"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            질문 다시 받기
          </button>
          <button type="submit" className="primary" disabled={loading || !allAnswered}>
            생성
          </button>
        </div>
      </form>
    </div>
  );
}
