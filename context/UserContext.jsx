import { useState, createContext, useEffect } from "react";
import axios from 'axios';

export const UserContext = createContext();

export const setPersistAuth = (user) => {
    if(typeof window !== "undefined") {
        const userStringified = JSON.stringify(user);
        localStorage.setItem("@/user", userStringified)
    }
}

export const getPersistAuth = () => {
    if(typeof window !== "undefined") {
        const getUser = localStorage.getItem("@/user");
        return JSON.parse(getUser) || "";
    }
}

export const deletePersistAuth = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/user");
    }
}

export const UserProvider = ({children}) => {
    const [fullUser, setFullUser] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const storagedUser = localStorage.getItem("@/user");
                setFullUser(storagedUser);
            }
        }

        loadStorage();
    }, []);

    return <UserContext.Provider value={{getPersistAuth, setPersistAuth, deletePersistAuth}}>{children}</UserContext.Provider>;
}