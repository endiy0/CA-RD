import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { InputSessionQuestionsResponse, Question } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";

export default function AnswerForm() {
  const { token } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    if (!token) {
      setError("잘못된 링크입니다.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<InputSessionQuestionsResponse>(
          `/api/input/session/${token}`
        );
        if (cancelled) return;
        setQuestions(data.questions);
        setSessionId(data.sessionId);
        setAnswers({});
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "질문을 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitted) return;
    if (!token) {
      setError("잘못된 링크입니다.");
      return;
    }
    if (!allAnswered) {
      setError("모든 질문에 답해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/input/session/${token}/answers`, {
        method: "POST",
        body: {
          name: name.trim(),
          sessionId,
          answers
        }
      });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "답변 제출 실패";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="panel form">
          <h2>답변 완료</h2>
          <p>이제 화면을 닫아도 됩니다. 감사합니다!</p>
        </div>
      </div>
    );
  }

  if (!loading && error && questions.length === 0) {
    return (
      <div className="page">
        <div className="panel form">
          <h2>접속할 수 없습니다</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
        {loading ? <p>질문을 불러오는 중입니다...</p> : null}
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
          <button type="submit" className="primary" disabled={loading || !allAnswered || submitting}>
            {submitting ? "전송 중..." : "답변 제출"}
          </button>
        </div>
      </form>
    </div>
  );
}
