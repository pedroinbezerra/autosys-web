import { useState, createContext, useEffect } from "react";

export const ApiContext = createContext();

export const setJwt = (jwt) => {
    if(typeof window !== "undefined") {
        localStorage.setItem("@/jwt", jwt);
    }
}

export const getJwt = () => {
    if(typeof window !== "undefined") {
        return localStorage.getItem("@/jwt");
    }
}

export const deleteJwt = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/jwt");
    }
}

export const ApiProvider = ({children}) => {
    const apiKey = "t]bJ#8Nb0QI#&yr%imoX-Js";

    const [jwt, setJwtt] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const storagedJwt = getJwt();
                setJwtt(storagedJwt);
            }
        }

        loadStorage();
    }, []);

    return <ApiContext.Provider value={{getJwt, deleteJwt, setJwt, apiKey}}>{children}</ApiContext.Provider>;
}