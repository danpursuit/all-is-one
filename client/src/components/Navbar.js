import { Box, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { SET_LOCATION, READ_WELCOME } from "../constants/actionTypes";
import { WebSocketContext } from '../WebSocket';
import { IMG2IMG, TXT2IMG, SELECT_MODEL, EMPTY_MODEL } from "../constants/features";
import React, { useEffect } from "react";
import WelcomePopup from "./WelcomePopup";



const Navbar = ({ }) => {
    const dispatch = useDispatch();
    const ws = React.useContext(WebSocketContext);
    const location = useSelector(state => state.main.location);
    const regularChoice = useSelector(state => state.main.models.models.regularChoice);
    const welcome = useSelector(state => state.main.welcome);
    const readWelcome = useSelector(state => state.main.readWelcome);
    const handleChange = (e) => {
        dispatch({ type: SET_LOCATION, payload: { location: e.target.value } });
    }
    useEffect(() => {
        ws.reqModelData();
    }, [])
    return (
        <Box sx={{ marginBottom: 1 }}>
            <RadioGroup
                row
                value={location}
                onChange={handleChange}
            >
                <FormControlLabel value={TXT2IMG} control={<Radio />} label="Text2Image"
                    disabled={regularChoice === EMPTY_MODEL}
                />
                <FormControlLabel value={IMG2IMG} control={<Radio />} label="Image2Image"
                    disabled={regularChoice === EMPTY_MODEL} />
                <FormControlLabel value={SELECT_MODEL} control={<Radio />} label="Select Model" />
            </RadioGroup>
            {regularChoice === EMPTY_MODEL && <Box sx={{ color: 'red' }}>Please select a base model</Box>}
            {welcome && !readWelcome && <WelcomePopup closeWelcome={() => dispatch({ type: READ_WELCOME })} />}
        </Box>
    )
}

export default Navbar;