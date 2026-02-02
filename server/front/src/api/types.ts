export type CardStats = {
  sense: number;
  logic: number;
  luck: number;
  charm: number;
  vibe: number;
};

export type CardData = {
  name: string;
  class: string;
  stats: CardStats;
  skill: string;
  description: string;
};

export type Question = {
  id: number;
  text: string;
};

export type QuestionsResponse = {
  sessionId: string;
  questions: Question[];
};

export type InputSessionCreateResponse = {
  token: string;
  expiresAt: number;
};

export type InputSessionQuestionsResponse = {
  sessionId: string;
  questions: Question[];
};

export type InputSessionStatusResponse = {
  status: "pending" | "answered";
  keywords?: string[];
};

export type GenerateResponse = {
  cardId: string;
  cardData: CardData;
  cardImageBase64: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
