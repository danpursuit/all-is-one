import { Box } from "@mui/material";

const styles = {
    resizer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        height: '2rem',
        width: '2rem',
        backgroundColor: 'rgba(100,100,100,.15)',
        cursor: 'se-resize',
        '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRight: '4px solid black',
            borderBottom: '4px solid black',
        }
    },
}

const ResizerDrag = ({ resizerRef, setResizing }) => {
    return (<Box sx={styles.resizer} ref={resizerRef} onMouseDown={() => setResizing(true)} />)
}
export default ResizerDrag;