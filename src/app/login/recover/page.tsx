"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useState } from "react";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import Loading from '../../../../components/Loading';
import Footer from "../../../../components/Footer";

enum ToastVariant {
  DEFAULT = '#e6e6e6',
  SUCCESS = '#b3ff99',
  ERROR = '#ff6666'
}

enum ToastColor {
  LIGHT = '#fff',
  DARK = '#000000',
}

function login() {
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const [email, setEmail] = useState("");

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  const handleSubmitPasswordRecover = () => {
    setLoading(true);
    const infos = {
      "email": email
    }
    const rules = {
      "email": "required|email"
    }

    const validation = new Validator(infos, rules);

    if(validation.fails()) {
      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, "E-mail inválido");
      return;
    }
    setLoading(false);
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }
  return (
    <>
    { loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

    <div className={loading ? loadingStyle : ""} >
    <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
    </div>
    <div className="vh-100 d-flex flex-column justify-content-center">
      <Form className="container mb-5 pb-3">
        <div className="row">
          <div className="col-md-12 mb-4 text-center">
            <h1>Recuperar acesso</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label><b>Coloque seu e-mail abaixo:</b></Form.Label>
              <Form.Control value={email} onChange={(e) => {setEmail(e.target.value)}} type="text" placeholder="E-mail" />
            </Form.Group>
          </div>
          <div className="col-md-3"></div>
        </div>
        <div className="row mt-4">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <Button className="w-100" onClick={handleSubmitPasswordRecover} variant="primary">
              Recuperar acesso
            </Button>
          </div>
          <div className="col-md-3"></div>
        </div>
        <div className="row mt-3">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <Button href={"/login"} className="recoverButton w-100" variant="outline-secondary">
              Cancelar
            </Button>
          </div>
          <div className="col-md-3"></div>
        </div>
      </Form>
    </div>
    </div>
    <Footer />
    </>
  );
}

export default login;
