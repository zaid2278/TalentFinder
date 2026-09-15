import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, type Candidate } from '../api/client';

type CandidateState = {
  items: Candidate[];
  total: number;
  page: number;
  current: Candidate | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: CandidateState = {
  items: [],
  total: 0,
  page: 1,
  current: null,
  status: 'idle',
  error: null,
};

export const fetchCandidates = createAsyncThunk(
  'candidates/fetch',
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
  }) => api.getCandidates(tenantId, { search, page, sort }),
);

export const fetchCandidate = createAsyncThunk(
  'candidates/fetchOne',
  async ({ tenantId, id }: { tenantId: string; id: string }) => api.getCandidate(tenantId, id),
);

export const createCandidate = createAsyncThunk(
  'candidates/create',
  async ({ tenantId, formData }: { tenantId: string; formData: FormData }) =>
    api.createCandidate(tenantId, formData),
);

export const updateCandidate = createAsyncThunk(
  'candidates/update',
  async ({ tenantId, id, formData }: { tenantId: string; id: string; formData: FormData }) =>
    api.updateCandidate(tenantId, id, formData),
);

export const deleteCandidate = createAsyncThunk(
  'candidates/delete',
  async ({ tenantId, id }: { tenantId: string; id: string }) => {
    await api.deleteCandidate(tenantId, id);
    return id;
  },
);

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load candidates';
      })
      .addCase(fetchCandidate.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.total += 1;
        state.current = action.payload;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((c) => (c.id === action.payload.id ? action.payload : c));
      })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.current?.id === action.payload) state.current = null;
      });
  },
});

export const { clearCurrent } = candidateSlice.actions;
export default candidateSlice.reducer;