import { configureStore } from '@reduxjs/toolkit';
import eventLoopReducer from './eventLoopSlice';

export const store = configureStore({
  reducer: {
    eventLoop: eventLoopReducer,
  },
});

export default store; 