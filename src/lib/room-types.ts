// Shapes shared by the room API and the room UI.

export type RoomGoal = {
  id: string;
  userId: string;
  text: string;
  done: boolean;
};

export type RoomState = {
  serverNow: number;
  me: { id: string; isHost: boolean };
  room: {
    id: string;
    name: string;
    ownerId: string;
    focusMinutes: number;
    breakMinutes: number;
    timerStartedAt: number | null;
    maxParticipants: number;
  };
  goals: RoomGoal[];
};

export const GOAL_WINDOW_HOURS = 12;
export const GOAL_MAX_LENGTH = 120;
export const GOALS_PER_PERSON = 10;
