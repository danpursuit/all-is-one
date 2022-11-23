import { Box, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { SET_LOCATION } from "../constants/actionTypes";



const Navbar = ({ }) => {
    const dispatch = useDispatch();
    const location = useSelector(state => state.main.location);
    const handleChange = (e) => {
        dispatch({ type: SET_LOCATION, payload: { location: e.target.value } });
    }
    return (
        <Box sx={{ marginBottom: 1 }}>
            <RadioGroup
                row
                value={location}
                onChange={handleChange}
            >
                <FormControlLabel value="txt2img" control={<Radio />} label="Text2Image" />
                <FormControlLabel value="img2img" control={<Radio />} label="Image2Image" />
            </RadioGroup>
        </Box>
    )
}

export default Navbar;