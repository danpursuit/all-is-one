import { configureStore } from '@reduxjs/toolkit'
import mainReducer from './mainReducer';
import galleriesReducer from './galleriesReducer';

const store = configureStore({
    reducer: {
        main: mainReducer,
        galleries: galleriesReducer,
    }
})

export default store