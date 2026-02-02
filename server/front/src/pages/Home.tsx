import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="panel hero">
        <div className="tag">CA:RD</div>
        <h1>Custom Avatar: Real-time Description</h1>
        <p>
          키워드를 입력하면 아바타 카드와 스탯을 생성합니다. 생성된 카드는 즉시 프린트
          스테이션으로 전달됩니다.
        </p>
        <button className="primary" onClick={() => navigate("/input")}>생성 시작</button>
      </div>
    </div>
  );
}
