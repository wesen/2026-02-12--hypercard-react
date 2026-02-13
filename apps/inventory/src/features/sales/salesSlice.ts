import { createSlice } from '@reduxjs/toolkit';
import { SALES_LOG } from '../../domain/seedData';
import type { SaleEntry } from '../../domain/types';

interface SalesState {
  log: SaleEntry[];
}

const initialState: SalesState = {
  log: JSON.parse(JSON.stringify(SALES_LOG)),
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
});

export const salesReducer = salesSlice.reducer;
