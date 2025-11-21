export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export const isLoadingState = (state: unknown): state is LoadingState => {
  return ['idle', 'loading', 'success', 'error'].includes(state as LoadingState);
};
