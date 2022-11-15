// WebSocket.js from https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { IMG_RESULT } from './constants/actionTypes';
import baseURL from './constants/url';
const WebSocketContext = React.createContext(null)

export { WebSocketContext }

export default ({ children }) => {
    let socket;
    let localUpdate;
    let ws;

    const dispatch = useDispatch();

    const ping = ({ steps }) => {
        socket.emit("ping", { steps });
    }
    const submitImg2Img = ({ img }) => {
        socket.emit("img2img", { img });
    }
    if (!socket) {
        console.log('connecting');
        socket = io.connect(baseURL);
        // clear localUpdate on disconnect
        socket.on('disconnect', () => {
            console.log('disconnected?');
            if (localUpdate) {
                clearInterval(localUpdate);
            }
        })

        socket.on("init", (msg) => {
            console.log('init:', msg);
        })
        socket.on("pong", (msg) => {
            console.log('pong:', msg);
        })
        socket.on("img2imgResult", ({ img }) => {
            dispatch({ type: IMG_RESULT, payload: 'data:image/png;base64,' + img });
        })

        //generic
        socket.on('fail', (msg) => {
            console.log('fail from server', msg);
        })
        socket.on('success', (msg) => {
            console.log('success from server', msg);
        })

        ws = {
            socket,
            ping,
            submitImg2Img
        }
    }

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    )
}