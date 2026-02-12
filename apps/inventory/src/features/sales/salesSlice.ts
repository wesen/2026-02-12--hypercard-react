import { createSlice } from '@reduxjs/toolkit';
import type { SaleEntry } from '../../domain/types';
import { STACK } from '../../domain/stack';

interface SalesState { log: SaleEntry[] }

const initialState: SalesState = {
  log: JSON.parse(JSON.stringify(STACK.data.salesLog)),
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
});

export const salesReducer = salesSlice.reducer;
