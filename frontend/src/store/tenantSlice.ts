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

export const updateTenantStatus = createAsyncThunk(
  'tenants/updateStatus',
  async ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
    api.updateTenantStatus(id, status),
);

export const deleteTenant = createAsyncThunk('tenants/delete', async (id: string) => {
  await api.deleteTenant(id);
  return id;
});

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

        const activeItems = action.payload.items.filter((t) => t.status === 'Active');
        const selectedStillActive = activeItems.some((t) => t.id === state.selectedTenantId);

        if (state.selectedTenantId && !selectedStillActive) {
          state.selectedTenantId = null;
          localStorage.removeItem(SELECTED_KEY);
        } else if (!state.selectedTenantId && activeItems[0]) {
          state.selectedTenantId = activeItems[0].id;
          localStorage.setItem(SELECTED_KEY, activeItems[0].id);
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
      })
      .addCase(updateTenantStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (
          state.selectedTenantId === action.payload.id &&
          action.payload.status !== 'Active'
        ) {
          state.selectedTenantId = null;
          localStorage.removeItem(SELECTED_KEY);
        }
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedTenantId === action.payload) {
          const next = state.items.find((t) => t.status === 'Active')?.id ?? null;
          state.selectedTenantId = next;
          if (next) localStorage.setItem(SELECTED_KEY, next);
          else localStorage.removeItem(SELECTED_KEY);
        }
      });
  },
});

export const { setSelectedTenant } = tenantSlice.actions;
export default tenantSlice.reducer;