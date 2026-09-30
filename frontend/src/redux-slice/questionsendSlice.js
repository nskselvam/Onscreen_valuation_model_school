// src/redux/slices/questionSendSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

const initialState = {
  questions: [],
};

const questionSendSlice = createSlice({
  name: "questionSend",
  initialState,
  reducers: {
    addOrUpdateQuestion: (state, action) => {
      const updatedQuestion = action.payload;
      const index = state.questions.findIndex((q) => q.id === updatedQuestion.id);
      if (index !== -1) {
        state.questions[index] = updatedQuestion; // Update existing question
      } else {
        state.questions.push(updatedQuestion); // Add new question
      }
    },

    updataDatas: (state,action) => {
      state.questions = state.payload;
    },

    deleteQuestion: (state, action) => {
      state.questions = state.questions.filter((q) => q.id !== action.payload);
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutSuccess, (state) => {
      state.questions = [];
    });
  },
});

export const { addOrUpdateQuestion, deleteQuestion,updataDatas, setQuestions } = questionSendSlice.actions;
export default questionSendSlice.reducer;
