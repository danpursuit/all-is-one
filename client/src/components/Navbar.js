import { Box, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { SET_LOCATION, READ_WELCOME } from "../constants/actionTypes";
import { WebSocketContext } from '../WebSocket';
import { IMG2IMG, TXT2IMG, EDITING, SELECT_MODEL, EMPTY_MODEL, IMG2VID, TIPS_AND_TRICKS } from "../constants/features";
import logo from '../images/logo512.png'
import React, { useEffect } from "react";
import WelcomePopup from "./WelcomePopup";



const Navbar = ({ }) => {
    const dispatch = useDispatch();
    const ws = React.useContext(WebSocketContext);
    const location = useSelector(state => state.main.location);
    const regularModels = useSelector(state => state.main.models.models.regular);
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
        <Box sx={{ marginBottom: 2 }}>
            <Stack direction='row' spacing={2} alignItems='center'>
                <img src={logo} alt='logo' width='50px' height='50px' />
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
                    <FormControlLabel value={IMG2VID} control={<Radio />} label="Image2Video"
                        disabled={regularChoice === EMPTY_MODEL} />
                    <FormControlLabel value={EDITING} control={<Radio />} label="Editing" />
                    <FormControlLabel value={SELECT_MODEL} control={<Radio />} label="Select Model" disabled={regularModels === null} />
                    <FormControlLabel value={TIPS_AND_TRICKS} control={<Radio />} label="FAQ" />
                </RadioGroup>
            </Stack>
            {regularChoice === EMPTY_MODEL && <Box sx={{ color: 'red' }}>Please select a base model</Box>}
            {regularModels === null && <Box sx={{ color: 'red' }}>Server is not active</Box>}
            {welcome && !readWelcome && <WelcomePopup closeWelcome={() => dispatch({ type: READ_WELCOME })} />}
        </Box>
    )
}

export default Navbar;