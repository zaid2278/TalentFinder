import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, type Submission } from '../api/client';

type SubmissionState = {
  items: Submission[];
  total: number;
  page: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: SubmissionState = {
  items: [],
  total: 0,
  page: 1,
  status: 'idle',
  error: null,
};

export const fetchSubmissions = createAsyncThunk(
  'submissions/fetch',
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
  }) => api.getSubmissions(tenantId, { search, page, sort }),
);

const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load submissions';
      });
  },
});

export default submissionSlice.reducer;