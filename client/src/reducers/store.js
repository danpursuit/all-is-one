import { configureStore } from '@reduxjs/toolkit'
import mainReducer from './mainReducer';
import galleriesReducer from './galleriesReducer';
import tipsReducer from './tipsReducer';

const store = configureStore({
    reducer: {
        main: mainReducer,
        galleries: galleriesReducer,
        tips: tipsReducer,
    }
})

export default store