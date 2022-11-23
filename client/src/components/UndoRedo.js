import { Button, Stack } from "@mui/material";
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import { setTip } from "../actions";
import { REDO, UNDO } from "../constants/actionTypes";
import { useDispatch, useSelector } from "react-redux";

const UndoRedo = ({ }) => {
    const history = useSelector(state => state.main.history);
    const historyIndex = useSelector(state => state.main.historyIndex);
    const dispatch = useDispatch();
    return (
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Button disabled={historyIndex < 0} onClick={() => dispatch({ type: UNDO })} onMouseEnter={() => dispatch(setTip(UNDO))}><UndoIcon /></Button>
            <Button disabled={historyIndex >= history.length - 1} onClick={() => dispatch({ type: REDO })} onMouseEnter={() => dispatch(setTip(REDO))}><RedoIcon /></Button>
        </Stack>
    )
}

export default UndoRedo;

