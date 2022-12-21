import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { Button, CircularProgress, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import { SUBMIT_START } from '../constants/actionTypes';
import { useDispatch } from 'react-redux';




const InterruptButt = ({ ws, op }) => {
    return <Button variant="contained" color='error'
        onClick={() => { ws.interrupt({ op }) }}
    > Cancel</Button>
}

const SubmitButt = ({ info, ws, op, options, optNames, submitStatus, isProcedural = false, noPrompt = false, keyframes = false }) => {
    const dispatch = useDispatch();
    const cannotSubmit = () => {
        return submitStatus.submitting || !(options && (noPrompt || (keyframes && options[optNames.prompt_kf] && options[optNames.prompt_kf].values[0].value) || (!keyframes && options[optNames.prompt] && options[optNames.prompt].values[0])))
    }
    const localSubmit = () => {
        dispatch({ type: SUBMIT_START, payload: { op } });
    }
    if (submitStatus.inProgress || submitStatus.submitting) {
        return <InterruptButt ws={ws} op={op} />
    }
    if (isProcedural) {
        return (
            <Button variant="contained" disabled={cannotSubmit()}
                onClick={() => { localSubmit(); ws.submitProcedural({ options, op }) }}
            > Procedural Submit {info && `(${info.num_procedural_batches} Config${info.num_procedural_batches > 1 ? 's' : ''}, ${info.num_procedural_images} Image${info.num_procedural_images > 1 ? 's' : ''})`} </Button>
        )
    }
    return (
        <Button variant="contained" disabled={cannotSubmit()}
            onClick={() => { localSubmit(); ws.submitQuick({ options, op }) }}
        > Quick Submit {info && `(${info.num_quick_images} Image${info.num_quick_images > 1 ? 's' : ''})`}</Button>
    )
}

export default SubmitButt;