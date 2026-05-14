export interface ExerciseData {
  id: string;
  name: string;
  name_ko?: string;
  body_part: string;
  equipment: string;
  gif_url: string;
}

export interface RoutineExercise {
  id: string; // Unique ID for this instance in the routine
  exerciseId: string; // ID from exercises.json
  workTime: number;
  restTime: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  rounds: number;
  createdAt: number;
}
