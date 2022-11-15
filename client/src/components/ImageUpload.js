import { useSelector, useDispatch } from 'react-redux';
import { Card, Grid, CardContent, Fab, CardActionArea, Button, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CollectionsIcon from "@mui/icons-material/Collections";
import React from 'react'

import { IMG2IMG } from '../constants/features';
import { IMG_UPLOAD } from '../constants/actionTypes';
import { WebSocketContext } from '../WebSocket';


const ImageUpload = () => {
    const dispatch = useDispatch();
    const ws = React.useContext(WebSocketContext);
    const uploads = useSelector(state => state.main.uploads);
    const results = useSelector(state => state.main.results);
    const [disableSubmit, setDisableSubmit] = React.useState(false);
    const handleUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            dispatch({ type: IMG_UPLOAD, payload: reader.result });
        }
        reader.readAsDataURL(file);
    }
    const handleSubmit = () => {
        setDisableSubmit(true);
        ws.submitImg2Img({ img: uploads[IMG2IMG] });
    }
    // whenever disableSubmit is set to true, set a timer to set it back to false
    React.useEffect(() => {
        if (disableSubmit) {
            setTimeout(() => {
                setDisableSubmit(false);
            }, 2000);
        }
    }, [disableSubmit])
    return (
        <Card>
            <CardContent>
                {uploads[IMG2IMG] ?
                    <CardActionArea onClick={() => dispatch({ type: IMG_UPLOAD, payload: null })}>
                        <img src={uploads[IMG2IMG]}
                            width="100%"
                        />
                    </CardActionArea> :
                    <Grid container justify="center" alignItems="center">
                        <input
                            accept="image/*"
                            id="contained-button-file"
                            type="file"
                            onChange={handleUpload}
                        />
                        <label htmlFor="contained-button-file">
                            <Fab component="span">
                                <AddPhotoAlternateIcon />
                            </Fab>
                        </label>
                        <Fab>
                            <SearchIcon />
                        </Fab>
                        <Fab>
                            <CollectionsIcon />
                        </Fab>
                    </Grid>}
                <Button variant="contained" onClick={() => handleSubmit()} disabled={!uploads[IMG2IMG] || disableSubmit}>Submit</Button>
                {disableSubmit && <Typography>Submitted!</Typography>}
                {results[IMG2IMG] && <img src={results[IMG2IMG]} width="100%" />}
            </CardContent>
        </Card>
    )
}

export default ImageUpload