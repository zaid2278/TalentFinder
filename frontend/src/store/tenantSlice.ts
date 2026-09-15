import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, type Tenant } from '../api/client';

const SELECTED_KEY = 'talentfinder.selectedTenantId';

type TenantState = {
  items: Tenant[];
  total: number;
  page: number;
  selectedTenantId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: TenantState = {
  items: [],
  total: 0,
  page: 1,
  selectedTenantId: localStorage.getItem(SELECTED_KEY),
  status: 'idle',
  error: null,
};

export const fetchTenants = createAsyncThunk(
  'tenants/fetch',
  async (params?: { search?: string; page?: number }) => api.getTenants(params),
);

export const createTenant = createAsyncThunk('tenants/create', async (name: string) =>
  api.createTenant(name),
);

const tenantSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setSelectedTenant(state, action: PayloadAction<string | null>) {
      state.selectedTenantId = action.payload;
      if (action.payload) localStorage.setItem(SELECTED_KEY, action.payload);
      else localStorage.removeItem(SELECTED_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        if (!state.selectedTenantId && action.payload.items[0]) {
          state.selectedTenantId = action.payload.items[0].id;
          localStorage.setItem(SELECTED_KEY, action.payload.items[0].id);
        }
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load tenants';
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.total += 1;
        state.selectedTenantId = action.payload.id;
        localStorage.setItem(SELECTED_KEY, action.payload.id);
      });
  },
});

export const { setSelectedTenant } = tenantSlice.actions;
export default tenantSlice.reducer;