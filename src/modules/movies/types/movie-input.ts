export interface CreateMovieInput {
  title: string;
  description: string;
  releaseDate: Date;
}

export interface UpdateMovieInput {
  title?: string;
  description?: string;
  releaseDate?: Date;
}
