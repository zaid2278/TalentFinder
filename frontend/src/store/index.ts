import { configureStore } from '@reduxjs/toolkit';
import tenantReducer from './tenantSlice';
import authReducer from './authSlice';
import candidateReducer from './candidateSlice';
import jobOrderReducer from './jobOrderSlice';
import submissionReducer from './submissionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenants: tenantReducer,
    candidates: candidateReducer,
    jobOrders: jobOrderReducer,
    submissions: submissionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;