import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, type JobOrder, type Match } from '../api/client';

type JobOrderState = {
  items: JobOrder[];
  total: number;
  page: number;
  current: JobOrder | null;
  matches: Match[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: JobOrderState = {
  items: [],
  total: 0,
  page: 1,
  current: null,
  matches: [],
  status: 'idle',
  error: null,
};

export const fetchJobOrders = createAsyncThunk(
  'jobOrders/fetch',
  async ({
    tenantId,
    search,
    page,
    sort,
  }: {
    tenantId: string;
    search?: string;
    page?: number;
    sort?: string;
  }) => api.getJobOrders(tenantId, { search, page, sort }),
);

export const fetchJobOrder = createAsyncThunk(
  'jobOrders/fetchOne',
  async ({ tenantId, id }: { tenantId: string; id: string }) => api.getJobOrder(tenantId, id),
);

export const fetchMatches = createAsyncThunk(
  'jobOrders/matches',
  async ({ tenantId, id }: { tenantId: string; id: string }) => api.getMatches(tenantId, id),
);

export const createJobOrder = createAsyncThunk(
  'jobOrders/create',
  async ({ tenantId, body }: { tenantId: string; body: Record<string, unknown> }) =>
    api.createJobOrder(tenantId, body),
);

export const updateJobOrder = createAsyncThunk(
  'jobOrders/update',
  async ({
    tenantId,
    id,
    body,
  }: {
    tenantId: string;
    id: string;
    body: Record<string, unknown>;
  }) => api.updateJobOrder(tenantId, id, body),
);

export const deleteJobOrder = createAsyncThunk(
  'jobOrders/delete',
  async ({ tenantId, id }: { tenantId: string; id: string }) => {
    await api.deleteJobOrder(tenantId, id);
    return id;
  },
);

export const shortlistCandidate = createAsyncThunk(
  'jobOrders/shortlist',
  async ({
    tenantId,
    jobOrderId,
    candidateId,
  }: {
    tenantId: string;
    jobOrderId: string;
    candidateId: string;
  }) => {
    await api.shortlist(tenantId, jobOrderId, candidateId);
    return api.getJobOrder(tenantId, jobOrderId);
  },
);

const jobOrderSlice = createSlice({
  name: 'jobOrders',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.matches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobOrders.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchJobOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchJobOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load job orders';
      })
      .addCase(fetchJobOrder.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.matches = action.payload;
      })
      .addCase(createJobOrder.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.total += 1;
        state.current = action.payload;
      })
      .addCase(updateJobOrder.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((j) => (j.id === action.payload.id ? action.payload : j));
      })
      .addCase(deleteJobOrder.fulfilled, (state, action) => {
        state.items = state.items.filter((j) => j.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.current?.id === action.payload) state.current = null;
      })
      .addCase(shortlistCandidate.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { clearCurrent } = jobOrderSlice.actions;
export default jobOrderSlice.reducer;