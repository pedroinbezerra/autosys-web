"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { FooterContext } from "../../context/FooterContext";
import { useContext } from "react";

const Footer = () => {
  const { showFooter } = useContext(FooterContext);

  if (showFooter) {
    return (
      <div className="mt-5 pt-5">
        <div className="pb-5 pt-4 mt-5" style={{ backgroundColor: "#24242c" }}>
          <div className="d-flex mt-5 justify-content-center">
            <img width="75" src="/F2S.png" />
          </div>

          <div className="d-flex justify-content-center text-center text-white">
            Fábrica de Solução em software
          </div>
          <div className="d-flex mb-5 text-center justify-content-center text-white">
            Copyright © {new Date().getFullYear()} | Todos os direitos reservados
          </div>
        </div>
      </div>
    )
  }
  return <></>
}

export default Footer;
