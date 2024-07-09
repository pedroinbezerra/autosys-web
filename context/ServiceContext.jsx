import { useState, createContext, useEffect } from "react";

export const ServiceContext = createContext();

export const setService = (service) => {
    if(typeof window !== "undefined") {
        const serviceStringified = JSON.stringify(service);
        localStorage.setItem("@/service", serviceStringified);
    }
}

export const getService = () => {
    if(typeof window !== "undefined") {
        const service = localStorage.getItem("@/service");
        return JSON.parse(service);
    }
}

export const deleteService = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/service");
    }
}

export const ServiceProvider = ({children}) => {
    const [service, setservice] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const storagedService = localStorage.getItem("@/service");
                setservice(storagedService);
            }
        }

        loadStorage();
    }, []);

    return <ServiceContext.Provider value={{getService, setService, deleteService}}>{children}</ServiceContext.Provider>;
}