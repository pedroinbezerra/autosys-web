"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import Alert from "react-bootstrap/Alert/";
import { useState } from "react";

const Alerta = (props: any) => {
  const [type, setType]: any = useState(props.type);
  const [message, setMessage]: any = useState(props.message);
  const [show, setShow]: any = useState(true);

  setTimeout(() => {
    setShow(false)
  }, 8000)

  return (
    <Alert variant={type} show={show} className="mt-3 text-center">{message}</Alert>
  )
}

export default Alerta;
