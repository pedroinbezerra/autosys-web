import { useState, createContext, useEffect } from "react";

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

export const WelcomeContext = createContext();

export const showWelcomeMessage = () => {
    if (typeof window !== "undefined") {
        const d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = "showmess=true;"+expires;
    }
}

export const unshowWelcomeMessage = () => {
    if (typeof window !== "undefined") {
        const d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = "showmess=false;"+expires;
    }
}

export const getShowWelcomeMessage = () => {
    if (typeof window !== "undefined") {
        return getCookie("showmess");
    }
}

export const WelcomeProvider = ({ children }) => {
    return <WelcomeContext.Provider value={{ showWelcomeMessage, unshowWelcomeMessage, getShowWelcomeMessage }}>{children}</WelcomeContext.Provider>;
}