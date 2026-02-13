import { createSlice } from '@reduxjs/toolkit';
import type { SaleEntry } from '../../domain/types';
import { SALES_LOG } from '../../domain/seedData';

interface SalesState { log: SaleEntry[] }

const initialState: SalesState = {
  log: JSON.parse(JSON.stringify(SALES_LOG)),
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
});

export const salesReducer = salesSlice.reducer;
