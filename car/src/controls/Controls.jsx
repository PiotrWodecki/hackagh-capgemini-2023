import React from 'react';
import BatteryGauge from "react-battery-gauge";
import { Slider } from "@mui/material";
import Typography from '@mui/material/Typography';
import {proximityMarks, speedMarks, tempMarks} from './helpers.js';

const Controls = ({ battery, temperature, speed, proximity, setSpeed, setProximity, setTemperature}) => {
  return (
    <div style={{padding:"40px"}}>        
        <Typography gutterBottom>
        Battery
        </Typography>
        <BatteryGauge className="battery" value={battery} />
        <Typography gutterBottom>
        Speed
        </Typography>
        <Slider
        onChange={e=>setSpeed(e.target.value)}
        min={0}
        max={200}
        marks={speedMarks}
        value={speed}
        aria-label="Default"
        valueLabelDisplay="auto"
        />
        <Typography gutterBottom>
        Proximity
        </Typography>
        <Slider
        onChange={e=>setProximity(e.target.value)}
        marks={proximityMarks}
        min={0}
        max={1000}
        value={proximity}
        defaultValue={50}
        aria-label="Default"
        valueLabelDisplay="auto"
        />
        <Typography gutterBottom>
        Temperature
        </Typography>
        <Slider
        onChange={e=>setTemperature(e.target.value)}
        marks={tempMarks}
        min={-30}
        max={60}
        value={temperature}
        defaultValue={50}
        aria-label="Default"
        valueLabelDisplay="auto"
        />
    </div>
  )
}

export default Controls