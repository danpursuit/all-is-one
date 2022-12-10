import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Link, TextField, FormControl, Slider, Button } from '@mui/material';
import { WebSocketContext } from './WebSocket';
import ImageUpload from './components/ImageUpload';
import Txt2ImgInterface from './interfaces/Txt2ImgInterface';
import Img2ImgInterface from './interfaces/Img2ImgInterface';
import Navbar from './components/Navbar';
import { useSelector } from 'react-redux';
import { IMG2IMG, TXT2IMG, SELECT_MODEL, EDITING } from './constants/features';
import SelectModelInterface from './interfaces/SelectModelInterface';
import EditingInterface from './interfaces/EditingInterface';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default function App() {
  const [steps, setSteps] = React.useState(30);
  const ws = React.useContext(WebSocketContext);
  const location = useSelector(state => state.main.location);

  const handleChange = (event, newValue) => {
    // console.log('event', event);
    setSteps(newValue);
  };
  const handleClick = () => {
    ws.ping({ steps });
  }
  return (
    <Container maxWidth={false}>
      {/* <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create React App example
        </Typography>
        <Slider aria-label="steps" name="stepsSlider" value={steps} onChange={handleChange} />
        <Button variant="contained" onClick={() => handleClick()}>Click me</Button>
        <ImageUpload />
        <Copyright />
      </Box> */}
      <Navbar />
      {location === TXT2IMG && <Txt2ImgInterface />}
      {location === IMG2IMG && <Img2ImgInterface />}
      {location === EDITING && <EditingInterface />}
      {location === SELECT_MODEL && <SelectModelInterface />}
    </Container>
  );
}