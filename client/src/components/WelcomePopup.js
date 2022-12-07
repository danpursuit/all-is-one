import { Box, Button, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { SET_LOCATION } from "../constants/actionTypes";
import { WebSocketContext } from '../WebSocket';
import { IMG2IMG, TXT2IMG, SELECT_MODEL, EMPTY_MODEL } from "../constants/features";
import React, { useEffect } from "react";

const styles = {
    container: { zIndex: 1000, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    inner: {
        width: '50%',
        height: '50%',
        backgroundColor: 'white',
        borderRadius: 1,
        padding: 4,
    }
}

const WelcomePopup = ({ closeWelcome }) => {
    return (
        <Box sx={styles.container}>
            <Stack spacing={4} direction="column" alignItems="center" justifyContent="center" sx={styles.inner}>
                <Typography variant='h3'>Welcome to All is One!</Typography>
                {/* <Typography variant='h5'>To get started, you'll need to set your base model. Using our handy UI, you can either download one from HuggingFace, or convert an existing .ckpt file. After that you're good to go!</Typography> */}
                <Typography variant='h6'>To get started, you'll need to set your base model. Using our handy UI, you can either:
                    <ul>
                        <li>download one from HuggingFace (check readme on where to put your HF token), or</li>
                        <li>convert an existing .ckpt file</li>
                    </ul>
                    After that, you're good to go!</Typography>
                <Button variant='contained' fullWidth color='success' size='large' onClick={closeWelcome}>Got it, let's go!</Button>
            </Stack>
        </Box >
    )
}

export default WelcomePopup;