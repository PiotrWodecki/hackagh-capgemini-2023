import React from 'react'

const Car = ({isCharging}) => {
    const carUrl = '/car.png';
    const chargeCarUrl = '/car-charge.png';
    
    return (
      <div>
        <img src={isCharging ? chargeCarUrl : carUrl} alt="My Car" height={"600vh"} />
      </div>
    );
}

export default Car