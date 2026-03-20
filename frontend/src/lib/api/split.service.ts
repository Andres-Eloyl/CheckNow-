/**
 * CheckNow! — Split Service
 * Handles splitting order items and 'Yo Invito' functionality.
 */

import { api } from './client';
import type {
  SplitCreate,
  SplitResponse,
  PayForRequest,
} from '@/types/api.types';

export const splitService = {
  /** Propose splitting an order item among multiple users. */
  async createSplit(slug: string, token: string, data: SplitCreate): Promise<SplitResponse[]> {
    return api.post<SplitResponse[]>(
      `/api/${slug}/sessions/${token}/splits`,
      data,
      { sessionAuth: true }
    );
  },

  /** Accept a proposed split fraction. */
  async acceptSplit(slug: string, token: string, assignmentId: string): Promise<SplitResponse> {
    return api.post<SplitResponse>(
      `/api/${slug}/sessions/${token}/splits/${assignmentId}/accept`,
      undefined,
      { sessionAuth: true }
    );
  },

  /** 'Yo Invito' — pay for someone else's item. */
  async payForSomeone(slug: string, token: string, data: PayForRequest): Promise<SplitResponse> {
    return api.post<SplitResponse>(
      `/api/${slug}/sessions/${token}/pay-for`,
      data,
      { sessionAuth: true }
    );
  },
};
