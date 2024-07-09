import { useState, createContext, useEffect } from "react";

export const VehicleContext = createContext();

export const setVehicle = (vehicle) => {
    if(typeof window !== "undefined") {
        const vehicleStringified = JSON.stringify(vehicle);
        localStorage.setItem("@/vehicle", vehicleStringified);
    }
}

export const getVehicle = () => {
    if(typeof window !== "undefined") {
        const vehicle = localStorage.getItem("@/vehicle");
        return JSON.parse(vehicle);
    }
}

export const deleteVehicle = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/vehicle");
    }
}

export const VehicleProvider = ({children}) => {
    const [vehicle, setvehicle] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const vhiecle = localStorage.getItem("@/vehicle");
                setvehicle(vhiecle);
            }
        }

        loadStorage();
    }, []);

    return <VehicleContext.Provider value={{getVehicle, setVehicle, deleteVehicle}}>{children}</VehicleContext.Provider>;
}