import { useState, createContext, useEffect } from "react";

export const ClientContext = createContext();

export const setClient = (client) => {
    if(typeof window !== "undefined") {
        const clientStringified = JSON.stringify(client);
        localStorage.setItem("@/client", clientStringified)
    }
}

export const getClient = () => {
    if(typeof window !== "undefined") {
        const getClient = localStorage.getItem("@/client");
        return JSON.parse(getClient);
    }
}

export const deleteClient = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/client");
    }
}

export const ClientProvider = ({children}) => {
    const [fullclient, setFullclient] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const storagedClient = localStorage.getItem("@/client");
                setFullclient(storagedClient);
            }
        }

        loadStorage();
    }, []);

    return <ClientContext.Provider value={{getClient, setClient, deleteClient}}>{children}</ClientContext.Provider>;
}