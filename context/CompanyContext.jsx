import { useState, createContext, useEffect } from "react";

export const CompanyContext = createContext();

export const setCompany = (client) => {
    if(typeof window !== "undefined") {
        const clientStringified = JSON.stringify(client);
        localStorage.setItem("@/comp", clientStringified)
    }
}

export const getCompany = () => {
    if(typeof window !== "undefined") {
        const getClient = localStorage.getItem("@/comp");
        return JSON.parse(getClient);
    }
}

export const deleteCompany = () => {
    if(typeof window !== "undefined") {
        localStorage.removeItem("@/comp");
    }
}

export const CompanyProvider = ({children}) => {
    const [fullcompany, setFullcompany] = useState("");

    useEffect(() => {
        async function loadStorage() {
            if(typeof window !== "undefined") {
                const fullcompany = localStorage.getItem("@/comp");
                setFullcompany(fullcompany);
            }
        }

        loadStorage();
    }, []);

    return <CompanyContext.Provider value={{getCompany, setCompany, deleteCompany}}>{children}</CompanyContext.Provider>;
}